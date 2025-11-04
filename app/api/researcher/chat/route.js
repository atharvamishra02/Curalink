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

// Get chat messages between two users
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');

    if (!otherUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify connection exists and is accepted
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { userId: user.userId, connectedId: otherUserId },
          { userId: otherUserId, connectedId: user.userId }
        ],
        status: 'accepted'
      }
    });

    if (!connection) {
      return NextResponse.json({ error: 'You must be connected to chat' }, { status: 403 });
    }

    // Get messages between the two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: user.userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Get other user info
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        researcherProfile: {
          select: {
            institution: true,
            specialties: true
          }
        }
      }
    });

    return NextResponse.json({ 
      messages,
      otherUser
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// Send a message
export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Receiver ID and content are required' }, { status: 400 });
    }

    // Verify connection exists and is accepted
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { userId: user.userId, connectedId: receiverId },
          { userId: receiverId, connectedId: user.userId }
        ],
        status: 'accepted'
      }
    });

    if (!connection) {
      return NextResponse.json({ error: 'You must be connected to send messages' }, { status: 403 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: user.userId,
        receiverId,
        content,
        isRead: false
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: `${user.name || 'A researcher'} sent you a message`,
        metadata: {
          messageId: message.id,
          senderId: user.userId,
          senderName: user.name
        }
      }
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// Mark messages as read
export async function PATCH(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { senderId } = body;

    if (!senderId) {
      return NextResponse.json({ error: 'Sender ID is required' }, { status: 400 });
    }

    // Mark all messages from sender as read
    await prisma.message.updateMany({
      where: {
        senderId,
        receiverId: user.userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
