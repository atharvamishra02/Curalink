import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request) {
  const token = request.cookies.get('token')?.value || request.cookies.get('auth-token')?.value;
  
  console.log('Trials API - Token from cookies:', token ? 'Token exists' : 'No token found');
  console.log('Trials API - Available cookies:', Array.from(request.cookies.getAll().map(c => c.name)));
  
  if (!token) {
    console.log('Trials API - No authentication token found');
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Trials API - Token decoded. User:', decoded.userId, 'Role:', decoded.role);
    return decoded;
  } catch (error) {
    console.log('Trials API - Token verification failed:', error.message);
    return null;
  }
}

// Get researcher's trials
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get researcher profile ID
    const userWithProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { researcherProfile: true }
    });

    if (!userWithProfile?.researcherProfile) {
      return NextResponse.json({ trials: [] });
    }

    const trials = await prisma.clinicalTrial.findMany({
      where: {
        researcherId: userWithProfile.researcherProfile.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return NextResponse.json({ trials });
  } catch (error) {
    console.error('Error fetching researcher trials:', error);
    return NextResponse.json({ error: 'Failed to fetch trials' }, { status: 500 });
  }
}

// Add new clinical trial
export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      condition,
      phase,
      status,
      eligibilityCriteria,
      targetParticipants,
      location,
      startDate,
      endDate
    } = body;

    if (!title || !description || !condition) {
      return NextResponse.json(
        { error: 'Title, description, and condition are required' },
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

    const trial = await prisma.clinicalTrial.create({
      data: {
        title,
        description,
        conditions: [condition], // Schema expects array
        phase: phase || 'PHASE_1',
        status: status || 'RECRUITING',
        eligibilityCriteria: eligibilityCriteria || null,
        interventions: [],
        location: location || 'Not specified',
        startDate: startDate ? new Date(startDate) : new Date(),
        completionDate: endDate ? new Date(endDate) : null,
        researcherId: userWithProfile.researcherProfile.id
      }
    });

    return NextResponse.json({ success: true, trial }, { status: 201 });
  } catch (error) {
    console.error('Error creating trial:', error);
    console.error('Error details:', error.message);
    return NextResponse.json({ 
      error: 'Failed to create trial',
      details: error.message 
    }, { status: 500 });
  }
}
