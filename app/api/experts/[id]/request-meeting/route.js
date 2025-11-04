import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

// Helper function to get user from token
async function getUserFromToken(request) {
  // Try both possible cookie names
  let token = request.cookies.get('token')?.value;
  if (!token) {
    token = request.cookies.get('auth-token')?.value;
  }
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret-key'
    );
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    
    return user;
  } catch {
    return null;
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { message, preferredDate, preferredTime } = await request.json();
    const { id: expertId } = await params;
    const userId = user.id;

    // Validate required fields
    if (!message || !preferredDate) {
      return NextResponse.json(
        { error: 'Message and preferred date are required' },
        { status: 400 }
      );
    }

    // Get the expert's details
    const expert = await prisma.user.findUnique({
      where: { id: expertId },
      include: {
        researcherProfile: {
          select: {
            availableForMeetings: true,
          },
        },
      },
    });

    if (!expert) {
      return NextResponse.json(
        { error: 'Expert not found' },
        { status: 404 }
      );
    }

    if (!expert.researcherProfile?.availableForMeetings) {
      return NextResponse.json(
        { error: 'This expert is not available for meetings' },
        { status: 400 }
      );
    }

    // Create meeting request
    const meetingRequest = await prisma.meetingRequest.create({
      data: {
        requesterId: userId,
        expertId: expertId,
        message: message,
        preferredDate: new Date(preferredDate),
        preferredTime: preferredTime || null,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Create notification for the expert
    await prisma.notification.create({
      data: {
        userId: expertId,
        type: 'MEETING_REQUEST',
        title: 'New Meeting Request',
        message: `${user.name} has requested a meeting with you`,
        read: false,
        metadata: {
          meetingRequestId: meetingRequest.id,
          requesterId: userId,
          requesterName: user.name,
          preferredDate: preferredDate,
          preferredTime: preferredTime,
        },
      },
    });

    // Optionally, send email notification
    // await sendEmail({
    //   to: expert.email,
    //   subject: 'New Meeting Request on CuraLink',
    //   message: `${session.user.name} has requested a meeting...`,
    // });

    return NextResponse.json(
      { 
        message: 'Meeting request sent successfully',
        meetingRequest: {
          id: meetingRequest.id,
          status: meetingRequest.status,
          preferredDate: meetingRequest.preferredDate,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating meeting request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get meeting requests for a user
export async function GET(request, { params }) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: expertId } = await params;
    const userId = user.id;

    // Check if current user is viewing their own requests or requests they made
    const meetingRequests = await prisma.meetingRequest.findMany({
      where: {
        OR: [
          { expertId: expertId, requesterId: userId },
          { requesterId: userId, expertId: expertId },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        expert: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      meetingRequests,
    });
  } catch (error) {
    console.error('Error fetching meeting requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
