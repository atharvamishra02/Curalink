import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request) {
  const token = request.cookies.get('token')?.value || request.cookies.get('auth-token')?.value;
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

// Get researcher's publications
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get researcher profile ID
    const userWithProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { researcherProfile: true }
    });

    if (!userWithProfile?.researcherProfile) {
      return NextResponse.json({ publications: [] });
    }

    const publications = await prisma.publication.findMany({
      where: {
        researcherId: userWithProfile.researcherProfile.id
      },
      orderBy: {
        publishedDate: 'desc'
      }
    });

    return NextResponse.json({ publications });
  } catch (error) {
    console.error('Error fetching publications:', error);
    return NextResponse.json({ error: 'Failed to fetch publications' }, { status: 500 });
  }
}

// Add new publication
export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      abstract,
      journal,
      publishedDate,
      doi,
      url,
      aiSummary
    } = body;

    if (!title || !abstract) {
      return NextResponse.json(
        { error: 'Title and abstract are required' },
        { status: 400 }
      );
    }

    // Get researcher profile ID
    const userWithProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { researcherProfile: true }
    });

    if (!userWithProfile?.researcherProfile) {
      return NextResponse.json(
        { error: 'Researcher profile not found' },
        { status: 400 }
      );
    }

    const publication = await prisma.publication.create({
      data: {
        title,
        abstract,
        summary: aiSummary || null,
        journal: journal || 'Not specified',
        publishedDate: publishedDate ? new Date(publishedDate) : new Date(),
        doi,
        url,
        authors: [],
        keywords: [],
        researcherId: userWithProfile.researcherProfile.id
      }
    });

    return NextResponse.json({ success: true, publication }, { status: 201 });
  } catch (error) {
    console.error('Error creating publication:', error);
    return NextResponse.json({ error: 'Failed to create publication' }, { status: 500 });
  }
}
