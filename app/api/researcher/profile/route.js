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

// Get researcher profile
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.researcherProfile.findUnique({
      where: { userId: user.userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// Update researcher profile
export async function PATCH(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bio, institution, location, specialties, researchInterests, availableForMeetings, meetingSchedule } = body;

    const profile = await prisma.researcherProfile.upsert({
      where: { userId: user.userId },
      update: {
        bio,
        institution,
        location,
        specialties,
        researchInterests,
        availableForMeetings,
        meetingSchedule
      },
      create: {
        userId: user.userId,
        bio: bio || '',
        institution: institution || '',
        location: location || '',
        specialties: specialties || [],
        researchInterests: researchInterests || [],
        availableForMeetings: availableForMeetings || false,
        meetingSchedule: meetingSchedule || ''
      }
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
