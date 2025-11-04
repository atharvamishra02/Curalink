import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request) {
  const token = request.cookies.get('token')?.value || request.cookies.get('auth-token')?.value;
  
  console.log('Token from cookies:', token ? 'Token exists' : 'No token found');
  console.log('Available cookies:', Array.from(request.cookies.getAll().map(c => c.name)));
  
  if (!token) {
    console.log('No authentication token found');
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded successfully. User:', decoded.userId, 'Role:', decoded.role);
    return decoded;
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return null;
  }
}

export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const specialty = searchParams.get('specialty');
    const limit = parseInt(searchParams.get('limit') || '30');

    // Build where clause
    const where = {
      role: 'RESEARCHER',
      id: { not: user.userId }, // Exclude current user
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        {
          researcherProfile: {
            specialties: {
              hasSome: [search]
            }
          }
        },
        {
          researcherProfile: {
            researchInterests: {
              hasSome: [search]
            }
          }
        },
        {
          researcherProfile: {
            institution: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    if (specialty) {
      where.researcherProfile = {
        specialties: {
          has: specialty
        }
      };
    }

    const collaborators = await prisma.user.findMany({
      where,
      include: {
        researcherProfile: {
          select: {
            specialties: true,
            researchInterests: true,
            institution: true,
            orcidId: true,
            researchGateUrl: true,
            availableForMeetings: true,
            _count: {
              select: {
                publications: true,
              }
            }
          }
        }
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all connections for the current user
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { userId: user.userId },
          { connectedId: user.userId }
        ]
      },
      select: {
        id: true,
        userId: true,
        connectedId: true,
        status: true
      }
    });

    // Create a map of connection statuses with more details
    const connectionMap = new Map();
    connections.forEach(conn => {
      const otherUserId = conn.userId === user.userId ? conn.connectedId : conn.userId;
      const isSentByMe = conn.userId === user.userId;
      const isReceivedByMe = conn.connectedId === user.userId;
      
      connectionMap.set(otherUserId, {
        connectionId: conn.id,
        status: conn.status,
        isSentByMe, // I sent the request
        isReceivedByMe, // I received the request
      });
    });

    // Get follow statuses
    const follows = await prisma.follow.findMany({
      where: {
        followerId: user.userId
      },
      select: {
        followingId: true
      }
    });

    const followMap = new Map();
    follows.forEach(follow => {
      followMap.set(follow.followingId, true);
    });

    // Format response
    const formattedCollaborators = collaborators.map(collab => {
      const connectionInfo = connectionMap.get(collab.id);
      return {
        id: collab.id,
        name: collab.name,
        email: collab.email,
        avatar: collab.avatar,
        institution: collab.researcherProfile?.institution,
        specialties: collab.researcherProfile?.specialties || [],
        researchInterests: collab.researcherProfile?.researchInterests || [],
        publicationCount: collab.researcherProfile?._count?.publications || 0,
        availableForMeetings: collab.researcherProfile?.availableForMeetings || false,
        meetingSchedule: collab.researcherProfile?.meetingSchedule || null,
        orcidId: collab.researcherProfile?.orcidId,
        researchGateUrl: collab.researcherProfile?.researchGateUrl,
        connectionStatus: connectionInfo?.status || null, // 'accepted', 'pending', or null
        connectionId: connectionInfo?.connectionId || null,
        isSentByMe: connectionInfo?.isSentByMe || false,
        isReceivedByMe: connectionInfo?.isReceivedByMe || false,
        isFollowing: followMap.get(collab.id) || false,
        isInternalResearcher: true,
      };
    });

    return NextResponse.json({ collaborators: formattedCollaborators });
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 });
  }
}
