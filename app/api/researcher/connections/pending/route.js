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

// Get pending connection requests (received by the user)
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all pending requests where the user is the recipient
    const pendingRequests = await prisma.connection.findMany({
      where: {
        connectedId: user.userId,
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            researcherProfile: {
              select: {
                institution: true,
                specialties: true,
                researchInterests: true,
                _count: {
                  select: {
                    publications: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const formattedRequests = pendingRequests.map(req => ({
      connectionId: req.id,
      requesterId: req.userId,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      institution: req.user.researcherProfile?.institution,
      specialties: req.user.researcherProfile?.specialties || [],
      researchInterests: req.user.researcherProfile?.researchInterests,
      publicationCount: req.user.researcherProfile?._count?.publications || 0,
      requestDate: req.createdAt
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return NextResponse.json({ error: 'Failed to fetch pending requests' }, { status: 500 });
  }
}
