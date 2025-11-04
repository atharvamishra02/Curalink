import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper to get user from token
function getUserFromToken(request) {
  const token = request.cookies.get('token')?.value || request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

// POST: Add a new publication for the researcher
export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Check if user is a researcher
    if (user.role !== 'RESEARCHER') {
      return NextResponse.json(
        { error: 'Only researchers can add publications' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      authors,
      abstract,
      journal,
      publishedDate,
      keywords,
      doi,
      url
    } = body;

    // Validate required fields
    if (!title || !authors || authors.length === 0) {
      return NextResponse.json(
        { error: 'Title and at least one author are required' },
        { status: 400 }
      );
    }

    // Get researcher profile
    const researcherProfile = await prisma.researcherProfile.findUnique({
      where: { userId: user.userId }
    });

    if (!researcherProfile) {
      return NextResponse.json(
        { error: 'Researcher profile not found' },
        { status: 404 }
      );
    }

    // Create publication
    const publication = await prisma.publication.create({
      data: {
        title,
        authors,
        abstract: abstract || null,
        journal: journal || null,
        publishedDate: publishedDate ? new Date(publishedDate) : null,
        keywords: keywords || [],
        doi: doi || null,
        url: url || null,
        researcherId: researcherProfile.id
      }
    });

    return NextResponse.json({
      success: true,
      publication
    });

  } catch (error) {
    console.error('Error adding publication:', error);
    
    // Handle unique constraint violation (duplicate DOI)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A publication with this DOI already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add publication' },
      { status: 500 }
    );
  }
}

// GET: Fetch all publications for the logged-in researcher
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    if (user.role !== 'RESEARCHER') {
      return NextResponse.json(
        { error: 'Only researchers can view their publications' },
        { status: 403 }
      );
    }

    const researcherProfile = await prisma.researcherProfile.findUnique({
      where: { userId: user.userId },
      include: {
        publications: {
          orderBy: { publishedDate: 'desc' }
        }
      }
    });

    if (!researcherProfile) {
      return NextResponse.json(
        { error: 'Researcher profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      publications: researcherProfile.publications,
      count: researcherProfile.publications.length
    });

  } catch (error) {
    console.error('Error fetching publications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publications' },
      { status: 500 }
    );
  }
}
