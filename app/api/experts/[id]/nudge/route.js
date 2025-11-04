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

    const { message } = await request.json();
    const { id: expertId } = await params;
    const userId = user.id;

    // Get the expert's details
    const expert = await prisma.user.findUnique({
      where: { id: expertId },
      select: { name: true, email: true },
    });

    if (!expert) {
      return NextResponse.json(
        { error: 'Expert not found' },
        { status: 404 }
      );
    }

    // Create a nudge notification
    await prisma.notification.create({
      data: {
        userId: expertId,
        type: 'NUDGE',
        title: `${user.name} sent you a nudge!`,
        message: message || `${user.name} is encouraging you to be more active on CuraLink`,
        read: false,
        metadata: {
          senderId: userId,
          senderName: user.name,
        },
      },
    });

    // Optionally, you can send an email notification here
    // await sendEmail({
    //   to: expert.email,
    //   subject: 'Someone nudged you on CuraLink!',
    //   message: `${session.user.name} sent you a nudge...`,
    // });

    return NextResponse.json(
      { 
        message: 'Nudge sent successfully',
        expert: expert.name 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending nudge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
