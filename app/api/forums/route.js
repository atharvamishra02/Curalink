import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cache } from '@/lib/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const CACHE_TTL = 30; // 30 seconds cache for forums

// Helper to get user from token
function getUserFromToken(request) {
  const token = request.cookies.get('token')?.value || request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

// GET: Fetch all forums or filter by category
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Try cache first
    const cacheKey = `forums:${categorySlug || 'all'}:${limit}`;
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    let where = {};
    
    // If category filter is provided, find the category first
    if (categorySlug) {
      const category = await prisma.forumCategory.findFirst({
        where: { slug: categorySlug.toLowerCase() }
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    const forums = await prisma.forumPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            researcherProfile: {
              select: {
                institution: true
              }
            }
          }
        },
        category: true,
        comments: {
          select: {
            id: true,
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // Format response
    const formattedForums = forums.map(forum => ({
      id: forum.id,
      title: forum.title,
      content: forum.content,
      category: forum.category?.name || 'General',
      author: {
        id: forum.author?.id,
        name: forum.author?.name || 'Anonymous',
        role: forum.author?.role,
        institution: forum.author?.researcherProfile?.institution
      },
      commentCount: forum.comments?.length || 0,
      viewCount: forum.views || 0,
      isPinned: forum.isPinned,
      createdAt: forum.createdAt
    }));

    const responseData = {
      forums: formattedForums,
      count: formattedForums.length
    };

    // Cache for 30 seconds
    await cache.set(cacheKey, responseData, CACHE_TTL);

    return NextResponse.json(responseData, {
      headers: { 'X-Cache': 'MISS' }
    });

  } catch (error) {
    console.error('Error fetching forums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forums', forums: [] },
      { status: 500 }
    );
  }
}

// POST: Create a new forum post
export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, category } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Map category values to names
    const categoryMap = {
      'general': { name: 'General', description: 'General discussions' },
      'research': { name: 'Research & Methodology', description: 'Research methods and approaches' },
      'clinical-trials': { name: 'Clinical Trials', description: 'Clinical trial discussions' },
      'publications': { name: 'Publications', description: 'Research publications and papers' },
      'qa': { name: 'Questions & Answers', description: 'Ask and answer questions' },
      'collaboration': { name: 'Collaboration', description: 'Collaboration opportunities' }
    };

    const categorySlug = category?.toLowerCase() || 'general';
    const categoryInfo = categoryMap[categorySlug] || categoryMap['general'];

    // Find or create the category
    let forumCategory = await prisma.forumCategory.upsert({
      where: { slug: categorySlug },
      update: {},
      create: {
        name: categoryInfo.name,
        slug: categorySlug,
        description: categoryInfo.description
      }
    });

    console.log('📁 Using category:', {
      slug: forumCategory.slug,
      name: forumCategory.name,
      requested: category
    });

    const forum = await prisma.forumPost.create({
      data: {
        title,
        content,
        categoryId: forumCategory.id,
        authorId: user.userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        },
        category: true
      }
    });

    // Invalidate cache for all forums and this category
    await cache.del(`forums:all:20`);
    await cache.del(`forums:all:50`);
    await cache.del(`forums:${categorySlug}:20`);
    await cache.del(`forums:${categorySlug}:50`);

    return NextResponse.json({
      success: true,
      post: {
        id: forum.id,
        title: forum.title,
        content: forum.content,
        category: forum.category?.slug || categorySlug,
        author: {
          id: forum.author?.id,
          name: forum.author?.name || 'Anonymous',
          role: forum.author?.role
        },
        commentCount: 0,
        viewCount: 0,
        isPinned: false,
        createdAt: forum.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating forum post:', error);
    return NextResponse.json(
      { error: 'Failed to create forum post' },
      { status: 500 }
    );
  }
}
