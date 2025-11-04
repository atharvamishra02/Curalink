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

export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { researcherId, researcherName, message, preferredDate, preferredTime } = body;

    if (!researcherId) {
      return NextResponse.json({ error: 'Researcher ID is required' }, { status: 400 });
    }

    // Get patient's full details
    const patient = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        patientProfile: true
      }
    });

    // Create meeting request
    const meetingRequest = await prisma.meetingRequest.create({
      data: {
        requesterId: user.userId,
        expertId: researcherId,
        message: message || 'I would like to schedule a meeting to discuss research opportunities.',
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTime: preferredTime || null,
        status: 'PENDING'
      }
    });

    // Create notification for the researcher with patient details
    try {
      const researcher = await prisma.user.findUnique({
        where: { id: researcherId }
      });

      if (researcher) {
        await prisma.notification.create({
          data: {
            userId: researcherId,
            type: 'MEETING_REQUEST',
            title: 'New Meeting Request',
            message: `${patient?.name || 'A patient'} requested a meeting with you`,
            metadata: {
              meetingRequestId: meetingRequest.id,
              requesterId: user.userId,
              requesterName: patient?.name,
              requesterEmail: patient?.email,
              patientCondition: patient?.patientProfile?.condition,
              patientAge: patient?.patientProfile?.age,
              patientGender: patient?.patientProfile?.gender,
              patientLocation: patient?.patientProfile?.location,
              message: message,
              preferredDate: preferredDate,
              preferredTime: preferredTime
            }
          }
        });
      }
    } catch (error) {
      console.log('Researcher not in system, meeting request stored');
    }

    return NextResponse.json({ success: true, meetingRequest });
  } catch (error) {
    console.error('Meeting request error:', error);
    return NextResponse.json({ error: 'Failed to create meeting request' }, { status: 500 });
  }
}

// Get meeting requests for a user
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetingRequests = await prisma.meetingRequest.findMany({
      where: {
        OR: [
          { requesterId: user.userId },
          { expertId: user.userId }
        ]
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            patientProfile: true
          }
        },
        expert: {
          select: {
            id: true,
            name: true,
            email: true,
            researcherProfile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ meetingRequests });
  } catch (error) {
    console.error('Get meeting requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch meeting requests' }, { status: 500 });
  }
}
