import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request) {
  try {
    // Verify user authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { meetingRequestId, action } = await request.json();

    if (!meetingRequestId || !action) {
      return NextResponse.json(
        { error: 'Meeting request ID and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Get the meeting request
    const meetingRequest = await prisma.meetingRequest.findUnique({
      where: { id: meetingRequestId },
      include: {
        requester: true,
        expert: true
      }
    });

    if (!meetingRequest) {
      return NextResponse.json(
        { error: 'Meeting request not found' },
        { status: 404 }
      );
    }

    // Verify the current user is the expert/receiver
    if (meetingRequest.expertId !== decoded.userId) {
      return NextResponse.json(
        { error: 'You are not authorized to respond to this meeting request' },
        { status: 403 }
      );
    }

    // Update meeting request status
    const newStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED';
    const updatedMeeting = await prisma.meetingRequest.update({
      where: { id: meetingRequestId },
      data: { status: newStatus }
    });

    // Create notification for the requester
    const notificationType = action === 'accept' ? 'MEETING_ACCEPTED' : 'MEETING_REJECTED';
    await prisma.notification.create({
      data: {
        userId: meetingRequest.requesterId,
        type: notificationType,
        title: action === 'accept' 
          ? 'Meeting Request Accepted' 
          : 'Meeting Request Declined',
        message: action === 'accept'
          ? `${meetingRequest.expert.name} has accepted your meeting request.`
          : `${meetingRequest.expert.name} has declined your meeting request.`,
        metadata: {
          meetingRequestId: meetingRequest.id,
          expertId: meetingRequest.expertId,
          expertName: meetingRequest.expert.name
        }
      }
    });

    return NextResponse.json({
      success: true,
      meeting: updatedMeeting,
      message: `Meeting request ${action}ed successfully`
    });

  } catch (error) {
    console.error('Error responding to meeting request:', error);
    return NextResponse.json(
      { error: 'Failed to respond to meeting request' },
      { status: 500 }
    );
  }
}
