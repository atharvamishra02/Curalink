import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request) {
  const token = request.cookies.get('token')?.value || request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

// Update a specific clinical trial
export async function PUT(request, { params }) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      title,
      description,
      condition,
      phase,
      status,
      eligibilityCriteria,
      location,
      startDate,
      endDate
    } = body;

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

    // Check if trial exists and belongs to the researcher
    const existingTrial = await prisma.clinicalTrial.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTrial) {
      return NextResponse.json({ error: 'Trial not found' }, { status: 404 });
    }

    if (existingTrial.researcherId !== userWithProfile.researcherProfile.id) {
      return NextResponse.json({ error: 'Unauthorized to edit this trial' }, { status: 403 });
    }

    // Update the trial
    const updatedTrial = await prisma.clinicalTrial.update({
      where: { id: parseInt(id) },
      data: {
        title: title || existingTrial.title,
        description: description || existingTrial.description,
        conditions: condition ? [condition] : existingTrial.conditions,
        phase: phase || existingTrial.phase,
        status: status || existingTrial.status,
        eligibilityCriteria: eligibilityCriteria !== undefined ? eligibilityCriteria : existingTrial.eligibilityCriteria,
        location: location || existingTrial.location,
        startDate: startDate ? new Date(startDate) : existingTrial.startDate,
        completionDate: endDate ? new Date(endDate) : existingTrial.completionDate
      }
    });

    return NextResponse.json({ success: true, trial: updatedTrial });
  } catch (error) {
    console.error('Error updating trial:', error);
    return NextResponse.json({ 
      error: 'Failed to update trial',
      details: error.message 
    }, { status: 500 });
  }
}

// Delete a specific clinical trial
export async function DELETE(request, { params }) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

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

    // Check if trial exists and belongs to the researcher
    const existingTrial = await prisma.clinicalTrial.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTrial) {
      return NextResponse.json({ error: 'Trial not found' }, { status: 404 });
    }

    if (existingTrial.researcherId !== userWithProfile.researcherProfile.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this trial' }, { status: 403 });
    }

    // Delete the trial
    await prisma.clinicalTrial.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true, message: 'Trial deleted successfully' });
  } catch (error) {
    console.error('Error deleting trial:', error);
    return NextResponse.json({ 
      error: 'Failed to delete trial',
      details: error.message 
    }, { status: 500 });
  }
}
