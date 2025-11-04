import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const expert = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'RESEARCHER',
      },
      include: {
        researcherProfile: true,
      },
    });

    if (!expert) {
      return NextResponse.json(
        { error: 'Expert not found' },
        { status: 404 }
      );
    }

    // Remove password
    const { password: _, ...expertWithoutPassword } = expert;

    return NextResponse.json({
      expert: expertWithoutPassword,
    });
  } catch (error) {
    console.error('Expert Profile API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expert profile' },
      { status: 500 }
    );
  }
}
