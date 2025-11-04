import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PATCH(request) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const body = await request.json();
    const { name, patientProfile, researcherProfile } = body;

    // Get current user to check role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patientProfile: true,
        researcherProfile: true
      }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user name
    const updateData = { name };

    // Update patient profile if patient
    if (currentUser.role === 'PATIENT' && patientProfile) {
      if (currentUser.patientProfile) {
        await prisma.patientProfile.update({
          where: { userId },
          data: {
            age: patientProfile.age,
            gender: patientProfile.gender,
            conditions: patientProfile.conditions,
            emergencyContact: patientProfile.emergencyContact
          }
        });
      } else {
        await prisma.patientProfile.create({
          data: {
            userId,
            age: patientProfile.age,
            gender: patientProfile.gender,
            conditions: patientProfile.conditions,
            emergencyContact: patientProfile.emergencyContact
          }
        });
      }
    }

    // Update researcher profile if researcher
    if (currentUser.role === 'RESEARCHER' && researcherProfile) {
      if (currentUser.researcherProfile) {
        await prisma.researcherProfile.update({
          where: { userId },
          data: {
            specialties: researcherProfile.specialties,
            institution: researcherProfile.institution,
            bio: researcherProfile.bio,
            researchInterests: researcherProfile.researchInterests
          }
        });
      } else {
        await prisma.researcherProfile.create({
          data: {
            userId,
            specialties: researcherProfile.specialties,
            institution: researcherProfile.institution,
            bio: researcherProfile.bio,
            researchInterests: researcherProfile.researchInterests
          }
        });
      }
    }

    // Update user name
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        patientProfile: true,
        researcherProfile: {
          include: {
            publications: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
