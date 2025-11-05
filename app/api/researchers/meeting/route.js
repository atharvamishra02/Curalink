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

    // Check if researcher exists in the system
    const researcher = await prisma.user.findUnique({
      where: { id: researcherId },
      include: {
        researcherProfile: true
      }
    });

    const isExternal = !researcher;

    // Create meeting request
    const meetingRequest = await prisma.meetingRequest.create({
      data: {
        requesterId: user.userId,
        expertId: isExternal ? null : researcherId,
        externalResearcherName: isExternal ? researcherName : null,
        externalResearcherId: isExternal ? researcherId : null,
        message: message || 'I would like to schedule a meeting to discuss research opportunities.',
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTime: preferredTime || null,
        status: 'PENDING'
      }
    });

    // Create notification for the researcher with patient details
    try {
      // Determine if request should go to admin
      const sendToAdmin = isExternal || !researcher?.researcherProfile?.availableForMeetings;
      
      // If researcher exists and is available, notify them
      if (!isExternal && researcher?.researcherProfile?.availableForMeetings) {
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
              patientCondition: patient?.patientProfile?.conditions?.[0] || 'Not specified',
              patientAge: patient?.patientProfile?.age,
              patientGender: patient?.patientProfile?.gender,
              patientLocation: patient?.patientProfile?.city && patient?.patientProfile?.country 
                ? `${patient.patientProfile.city}, ${patient.patientProfile.country}`
                : 'Not specified',
              message: message,
              preferredDate: preferredDate,
              preferredTime: preferredTime
            }
          }
        });
      }

      // Also send to admin if researcher is unavailable or doesn't exist
      if (sendToAdmin) {
        // Find all admin users
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' }
        });

        // Create notification for each admin
        for (const admin of admins) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              type: 'MEETING_REQUEST',
              title: !isExternal
                ? `Meeting Request (Researcher Unavailable) - ${researcherName}`
                : `Meeting Request (External Researcher) - ${researcherName}`,
              message: !isExternal
                ? `${patient?.name || 'A patient'} requested a meeting with ${researcherName} who is currently unavailable. Please assist.`
                : `${patient?.name || 'A patient'} requested a meeting with external researcher ${researcherName}. Please coordinate this meeting.`,
              metadata: {
                meetingRequestId: meetingRequest.id,
                requesterId: user.userId,
                targetResearcherId: researcherId,
                targetResearcherName: researcherName,
                isExternal: isExternal,
                requesterName: patient?.name,
                requesterEmail: patient?.email,
                patientCondition: patient?.patientProfile?.conditions?.[0] || 'Not specified',
                patientAge: patient?.patientProfile?.age,
                patientGender: patient?.patientProfile?.gender,
                patientLocation: patient?.patientProfile?.city && patient?.patientProfile?.country 
                  ? `${patient.patientProfile.city}, ${patient.patientProfile.country}`
                  : 'Not specified',
                message: message,
                preferredDate: preferredDate,
                preferredTime: preferredTime
              }
            }
          });
        }
      }

    } catch (error) {
      console.log('Error sending notifications:', error);
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
