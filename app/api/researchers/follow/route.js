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
  } catch (error) {
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
    const { researcherId, researcherName, message } = body;

    if (!researcherId) {
      return NextResponse.json({ error: 'Researcher ID is required' }, { status: 400 });
    }

    // Check if the researcher exists in the database
    const researcher = await prisma.user.findUnique({
      where: { id: researcherId },
      include: {
        researcherProfile: true
      }
    });

    const isExternal = !researcher;

    // If internal researcher exists, handle normal follow
    if (!isExternal) {
      // Check if already following
      const existingFollow = await prisma.follow.findFirst({
        where: {
          followerId: user.userId,
          followingId: researcherId
        }
      });

      if (existingFollow) {
        return NextResponse.json({ error: 'Already following this researcher' }, { status: 400 });
      }

      // Store follow action
      const follow = await prisma.follow.create({
        data: {
          followerId: user.userId,
          followingId: researcherId
        }
      });

      // Create notification for the researcher
      await prisma.notification.create({
        data: {
          userId: researcherId,
          type: 'NEW_FOLLOWER',
          title: 'New Follower',
          message: `${user.name || 'A user'} started following you`,
          metadata: {
            followerId: user.userId,
            followerName: user.name
          }
        }
      });

      return NextResponse.json({ success: true, follow });
    }

    // For external researchers, create a follow request that goes to admin
    const followRequest = await prisma.followRequest.create({
      data: {
        patientId: user.userId,
        researcherId: null,
        externalResearcherName: researcherName,
        externalResearcherId: researcherId,
        message: message || `I would like to connect with ${researcherName}`,
        status: 'PENDING'
      }
    });

    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    // Create notifications for all admins
    const adminNotifications = admins.map(admin => ({
      userId: admin.id,
      type: 'SYSTEM',
      title: 'New External Researcher Follow Request',
      message: `${user.name} wants to connect with external researcher: ${researcherName}`,
      metadata: {
        followRequestId: followRequest.id,
        patientId: user.userId,
        patientName: user.name,
        researcherName: researcherName,
        researcherId: researcherId,
        isExternal: true
      }
    }));

    await prisma.notification.createMany({
      data: adminNotifications
    });

    return NextResponse.json({ 
      success: true, 
      followRequest,
      message: 'Follow request sent to admin for external researcher'
    });

  } catch (error) {
    console.error('Follow error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Already following this researcher' }, { status: 400 });
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Researcher not found in database' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to follow researcher' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const researcherId = searchParams.get('researcherId');

    if (!researcherId) {
      return NextResponse.json({ error: 'Researcher ID is required' }, { status: 400 });
    }

    await prisma.follow.deleteMany({
      where: {
        followerId: user.userId,
        followingId: researcherId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json({ error: 'Failed to unfollow researcher' }, { status: 500 });
  }
}
