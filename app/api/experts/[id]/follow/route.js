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
    console.log('No token found in cookies');
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'fallback-secret-key'
    );
    
    console.log('Decoded token:', decoded);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user) {
      console.log('User not found for ID:', decoded.userId);
    }
    
    return user;
  } catch (error) {
    console.error('Token verification error:', error.message);
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

    const { action } = await request.json();
    const { id: expertId } = await params;
    const userId = user.id;

    // Check if follow relationship exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: expertId,
        },
      },
    });

    if (action === 'follow') {
      if (existingFollow) {
        return NextResponse.json(
          { message: 'Already following this expert' },
          { status: 200 }
        );
      }

      // Create follow relationship
      await prisma.follow.create({
        data: {
          followerId: userId,
          followingId: expertId,
        },
      });

      // Create notification for the expert
      await prisma.notification.create({
        data: {
          userId: expertId,
          type: 'NEW_FOLLOWER',
          title: 'New Follower',
          message: `${user.name} started following you`,
          read: false,
        },
      });

      return NextResponse.json(
        { message: 'Successfully followed expert' },
        { status: 200 }
      );
    } else if (action === 'unfollow') {
      if (!existingFollow) {
        return NextResponse.json(
          { message: 'Not following this expert' },
          { status: 200 }
        );
      }

      // Delete follow relationship
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: expertId,
          },
        },
      });

      return NextResponse.json(
        { message: 'Successfully unfollowed expert' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in follow API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get follow status
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

    console.log('Follow status check:', { userId, expertId });

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: expertId,
        },
      },
    });

    return NextResponse.json({
      isFollowing: !!follow,
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
