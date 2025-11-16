import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cache } from '@/lib/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const CACHE_TTL = 5; // 5 seconds cache

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

// Get unread notification count
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get from cache first
    const cacheKey = `notifications:unread:${user.userId}`;
    const cachedCount = await cache.get(cacheKey);
    
    if (cachedCount !== null) {
      return NextResponse.json({ count: cachedCount }, {
        headers: {
          'Cache-Control': 'private, max-age=5',
          'X-Cache': 'HIT'
        }
      });
    }

    const count = await prisma.notification.count({
      where: {
        userId: user.userId,
        read: false
      }
    });

    // Cache the count
    await cache.set(cacheKey, count, CACHE_TTL);

    return NextResponse.json({ count }, {
      headers: {
        'Cache-Control': 'private, max-age=5',
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
}
