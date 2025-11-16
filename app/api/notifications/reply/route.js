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

    const { notificationId, replyMessage } = await request.json();

    if (!notificationId || !replyMessage) {
      return NextResponse.json(
        { error: 'Notification ID and reply message are required' },
        { status: 400 }
      );
    }

    console.log('📨 Processing reply:', { notificationId, userId: user.userId });

    // Get the original notification to find the sender
    const originalNotification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        user: true
      }
    });

    if (!originalNotification) {
      console.error('❌ Notification not found:', notificationId);
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    console.log('✅ Found original notification for user:', originalNotification.userId);

    // Get the current user's details
    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId }
    });

    if (!currentUser) {
      console.error('❌ Current user not found:', user.userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ Current user:', currentUser.name);

    // Extract sender ID from notification metadata or parse from message
    let recipientId = null;
    
    // Check if metadata contains senderId
    if (originalNotification.metadata && typeof originalNotification.metadata === 'object') {
      recipientId = originalNotification.metadata.senderId || 
                    originalNotification.metadata.fromUserId || 
                    originalNotification.metadata.requesterId;
    }
    
    // If no sender in metadata, try to extract from message
    // Messages like "John Doe sent you a meeting request" or "Jane Smith wants to connect"
    if (!recipientId) {
      // For now, we'll try to find the user by name in the message
      const nameMatch = originalNotification.message.match(/^([^:]+?)(?:\s+(?:sent|wants|replied|accepted|declined))/);
      if (nameMatch) {
        const senderName = nameMatch[1].trim();
        const sender = await prisma.user.findFirst({
          where: {
            name: {
              contains: senderName,
              mode: 'insensitive'
            }
          }
        });
        if (sender) {
          recipientId = sender.id;
        }
      }
    }
    
    // If still no recipient found, don't send (avoid sending to self)
    if (!recipientId || recipientId === user.userId) {
      console.log('⚠️ Could not determine original sender, not sending reply');
      // Just mark as read
      await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read (no reply sent - sender unknown)'
      });
    }
    
    console.log('✅ Sending reply to user:', recipientId);
    
    // Create a new notification for the original sender
    const replyNotification = await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'NEW_MESSAGE',
        title: 'New Reply',
        message: `${currentUser.name} replied: "${replyMessage}"`,
        read: false,
        metadata: {
          senderId: user.userId,
          replyTo: notificationId
        }
      }
    });

    console.log('✅ Created reply notification:', replyNotification.id);

    // Mark the original notification as read
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });

    console.log('✅ Marked original notification as read');
    console.log(`📨 Reply sent from ${currentUser.name} to user ${recipientId}`);

    return NextResponse.json({
      success: true,
      notification: replyNotification,
      message: 'Reply sent successfully'
    });
  } catch (error) {
    console.error('❌ Error sending reply:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to send reply: ' + error.message },
      { status: 500 }
    );
  }
}
