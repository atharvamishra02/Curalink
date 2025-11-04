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

// Add comment to forum post
export async function POST(request, { params }) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Check if post exists and get post author
    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const comment = await prisma.forumComment.create({
      data: {
        content,
        postId: id,
        authorId: user.userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            researcherProfile: {
              select: {
                specialties: true,
                institution: true
              }
            }
          }
        }
      }
    });

    // Get the commenter's info
    const commenter = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        name: true,
        role: true,
        researcherProfile: {
          select: {
            institution: true
          }
        }
      }
    });

    // Create notification for post author if commenter is a researcher
    if (commenter?.role === 'RESEARCHER' && post.author.id !== user.userId) {
      await prisma.notification.create({
        data: {
          userId: post.author.id,
          type: 'FORUM_REPLY',
          title: 'Researcher Answered Your Question',
          message: `${commenter.name} from ${commenter.researcherProfile?.institution || 'a research institution'} answered your forum question`,
          metadata: {
            postId: id,
            commentId: comment.id,
            commenterId: user.userId,
            commenterName: commenter.name,
            commenterInstitution: commenter.researcherProfile?.institution,
            postTitle: post.title
          }
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      comment 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ 
      error: 'Failed to create comment' 
    }, { status: 500 });
  }
}
