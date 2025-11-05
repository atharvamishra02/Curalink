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

export async function PATCH(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, metadata } = body;

    if (!notificationId || !metadata) {
      return NextResponse.json({ 
        error: 'Missing required fields: notificationId, metadata' 
      }, { status: 400 });
    }

    // Get the notification to verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Verify user owns this notification
    if (notification.userId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update notification metadata
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        metadata: metadata
      }
    });

    return NextResponse.json({ 
      success: true, 
      notification: updatedNotification,
      message: 'Notification metadata updated successfully'
    });

  } catch (error) {
    console.error('Update notification metadata error:', error);
    return NextResponse.json({ 
      error: 'Failed to update notification metadata' 
    }, { status: 500 });
  }
}
