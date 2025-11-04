import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const specialty = searchParams.get('specialty');
    const location = searchParams.get('location');
    const available = searchParams.get('available') === 'true';

    // Build filter conditions
    const where = {
      role: 'RESEARCHER',
      researcherProfile: {
        isNot: null,
      },
    };

    // Add search query
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        {
          researcherProfile: {
            specialties: {
              hasSome: [query],
            },
          },
        },
        {
          researcherProfile: {
            researchInterests: {
              hasSome: [query],
            },
          },
        },
        {
          researcherProfile: {
            institution: { contains: query, mode: 'insensitive' },
          },
        },
      ];
    }

    // Add specialty filter
    if (specialty && specialty !== 'All Specialties') {
      where.researcherProfile = {
        ...where.researcherProfile,
        specialties: {
          has: specialty,
        },
      };
    }

    // Add availability filter
    if (available) {
      where.researcherProfile = {
        ...where.researcherProfile,
        availableForMeetings: true,
      };
    }

    // Fetch experts
    const experts = await prisma.user.findMany({
      where,
      include: {
        researcherProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // Filter by location in memory (if needed)
    let filteredExperts = experts;
    if (location) {
      filteredExperts = experts.filter((expert) => {
        const profile = expert.researcherProfile;
        return (
          profile?.institution?.toLowerCase().includes(location.toLowerCase())
        );
      });
    }

    // Remove passwords
    const expertsWithoutPasswords = filteredExperts.map(({ password, ...expert }) => expert);

    return NextResponse.json({
      experts: expertsWithoutPasswords,
      count: expertsWithoutPasswords.length,
    });
  } catch (error) {
    console.error('Experts API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experts', experts: [] },
      { status: 500 }
    );
  }
}
