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

// Send connection request
export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { collaboratorId } = body;

    if (!collaboratorId) {
      return NextResponse.json({ error: 'Collaborator ID is required' }, { status: 400 });
    }

    // Check if the collaborator exists in the database (internal user)
    const collaborator = await prisma.user.findUnique({
      where: { id: collaboratorId }
    });

    if (!collaborator) {
      return NextResponse.json({ 
        error: 'This researcher is not registered on the platform. You can only connect with registered researchers.' 
      }, { status: 400 });
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { userId: user.userId, connectedId: collaboratorId },
          { userId: collaboratorId, connectedId: user.userId }
        ]
      }
    });

    if (existingConnection) {
      return NextResponse.json({ error: 'Connection already exists' }, { status: 400 });
    }

    // Create connection request
    const connection = await prisma.connection.create({
      data: {
        userId: user.userId,
        connectedId: collaboratorId,
        status: 'pending'
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: collaboratorId,
        type: 'NEW_FOLLOWER',
        title: 'New Connection Request',
        message: `${user.name || 'A researcher'} wants to connect with you`,
        metadata: {
          connectionId: connection.id,
          requesterId: user.userId,
          requesterName: user.name
        }
      }
    });

    return NextResponse.json({ success: true, connection });
  } catch (error) {
    console.error('Error sending connection request:', error);
    return NextResponse.json({ error: 'Failed to send connection request' }, { status: 500 });
  }
}

// Accept connection request
export async function PATCH(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { connectionId } = body;

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 });
    }

    // Find the connection and verify the user is the recipient
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    if (connection.connectedId !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized to accept this connection' }, { status: 403 });
    }

    // Update connection status to accepted
    const updatedConnection = await prisma.connection.update({
      where: { id: connectionId },
      data: { status: 'accepted' }
    });

    // Create notification for the requester
    await prisma.notification.create({
      data: {
        userId: connection.userId,
        type: 'NEW_FOLLOWER',
        title: 'Connection Accepted',
        message: `${user.name || 'A researcher'} accepted your connection request`,
        metadata: {
          connectionId: connection.id,
          accepterId: user.userId,
          accepterName: user.name
        }
      }
    });

    return NextResponse.json({ success: true, connection: updatedConnection });
  } catch (error) {
    console.error('Error accepting connection:', error);
    return NextResponse.json({ error: 'Failed to accept connection' }, { status: 500 });
  }
}

