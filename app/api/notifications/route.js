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

// Get notifications for current user
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Enrich notifications with meeting request status
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        if (notification.type === 'MEETING_REQUEST' && notification.metadata?.meetingRequestId) {
          try {
            const meetingRequest = await prisma.meetingRequest.findUnique({
              where: { id: notification.metadata.meetingRequestId }
            });
            
            if (meetingRequest) {
              return {
                ...notification,
                metadata: {
                  ...notification.metadata,
                  status: meetingRequest.status
                }
              };
            }
          } catch (error) {
            console.error('Error fetching meeting status:', error);
          }
        }
        return notification;
      })
    );

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.userId,
        read: false
      }
    });

    return NextResponse.json({ notifications: enrichedNotifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// Mark notification as read
export async function PATCH(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId: user.userId,
          read: false
        },
        data: {
          read: true
        }
      });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    await prisma.notification.update({
      where: {
        id: notificationId,
        userId: user.userId
      },
      data: {
        read: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
