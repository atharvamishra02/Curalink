import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// GET: Fetch user's favorites
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login', favorites: [] },
        { status: 401 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: user.userId
      },
      include: {
        publication: {
          include: {
            researcher: {
              select: {
                institution: true,
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        clinicalTrial: {
          include: {
            researcher: {
              select: {
                institution: true,
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch researcher profiles for expertId favorites
    const researcherIds = favorites
      .filter(fav => fav.expertId)
      .map(fav => fav.expertId);

    const researcherProfiles = researcherIds.length > 0 
      ? await prisma.researcherProfile.findMany({
          where: {
            id: { in: researcherIds }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            publications: {
              select: {
                id: true
              }
            }
          }
        })
      : [];

    // Create a map for quick lookup
    const researcherMap = {};
    researcherProfiles.forEach(profile => {
      researcherMap[profile.id] = {
        id: profile.user?.id, // User ID for display
        researcherProfileId: profile.id, // ResearcherProfile ID for favorites
        name: profile.user?.name || 'Unknown Researcher',
        affiliation: profile.institution || 'Research Institution',
        specialization: profile.specialties?.[0] || 'Medical Research',
        location: profile.location || 'Not specified',
        publicationCount: profile.publications?.length || 0,
        verified: true,
        isInternalResearcher: true
      };
    });

    // Format favorites with their type
    const formattedFavorites = favorites.map(fav => {
      // Handle external items
      if (fav.externalId && fav.externalData) {
        return {
          id: fav.id,
          type: fav.externalType,
          data: fav.externalData,
          itemId: fav.externalId,
          isExternal: true,
          createdAt: fav.createdAt
        };
      }
      
      // Handle internal items
      if (fav.publication) {
        return {
          id: fav.id,
          type: 'publication',
          data: {
            ...fav.publication,
            authors: [fav.publication.researcher?.user?.name || 'Unknown'],
            journal: fav.publication.journal,
            isInternalPublication: true
          },
          itemId: fav.publicationId,
          createdAt: fav.createdAt
        };
      } else if (fav.clinicalTrial) {
        return {
          id: fav.id,
          type: 'trial',
          data: {
            ...fav.clinicalTrial,
            principalInvestigator: fav.clinicalTrial.researcher?.user?.name,
            leadSponsor: fav.clinicalTrial.researcher?.institution || 'Curalink Platform',
            isInternalTrial: true
          },
          itemId: fav.clinicalTrialId,
          createdAt: fav.createdAt
        };
      } else if (fav.expertId && researcherMap[fav.expertId]) {
        return {
          id: fav.id,
          type: 'researcher',
          data: researcherMap[fav.expertId],
          itemId: fav.expertId,
          createdAt: fav.createdAt
        };
      }
      return null;
    }).filter(Boolean);

    return NextResponse.json({
      favorites: formattedFavorites,
      count: formattedFavorites.length
    });

  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites', favorites: [] },
      { status: 500 }
    );
  }
}

// POST: Add item to favorites
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
    const { type, itemId, itemData } = body;

    if (!type || !itemId) {
      return NextResponse.json(
        { error: 'Type and itemId are required' },
        { status: 400 }
      );
    }

    // Check if itemId is a string ID (external item) or database cuid
    const isExternalItem = typeof itemId === 'string' && (
      itemId.startsWith('researcher-') || 
      itemId.startsWith('trial-') || 
      itemId.startsWith('pub-') ||
      itemId.includes('NCT') || // ClinicalTrials.gov IDs
      !itemId.match(/^c[a-z0-9]{24}$/) // Not a Prisma cuid
    );

    let favoriteData = {
      userId: user.userId
    };

    if (isExternalItem) {
      // External item - store in externalData
      favoriteData.externalId = itemId;
      favoriteData.externalType = type;
      favoriteData.externalData = itemData || { id: itemId };
    } else {
      // Internal item - use database relations
      if (type === 'publication') {
        favoriteData.publicationId = itemId;
      } else if (type === 'trial') {
        favoriteData.clinicalTrialId = itemId;
      } else if (type === 'researcher') {
        favoriteData.expertId = itemId;
      } else {
        return NextResponse.json(
          { error: 'Invalid type. Must be "publication", "trial", or "researcher"' },
          { status: 400 }
        );
      }
    }

    // Check if already favorited
    let existing;
    if (isExternalItem) {
      existing = await prisma.favorite.findFirst({
        where: {
          userId: user.userId,
          externalId: itemId,
          externalType: type
        }
      });
    } else {
      existing = await prisma.favorite.findFirst({
        where: favoriteData
      });
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Item already in favorites' },
        { status: 409 }
      );
    }

    const favorite = await prisma.favorite.create({
      data: favoriteData
    });

    return NextResponse.json({
      success: true,
      favorite: {
        id: favorite.id,
        type,
        itemId,
        isExternal: isExternalItem
      }
    });

  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

// DELETE: Remove item from favorites
export async function DELETE(request) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const itemId = searchParams.get('itemId');
    const favoriteId = searchParams.get('id');

    // Support both deletion methods: by type+itemId or by favoriteId
    if (favoriteId) {
      // Original method: delete by favorite ID
      const favorite = await prisma.favorite.findUnique({
        where: { id: favoriteId }
      });

      if (!favorite || favorite.userId !== user.userId) {
        return NextResponse.json(
          { error: 'Favorite not found or unauthorized' },
          { status: 404 }
        );
      }

      await prisma.favorite.delete({
        where: { id: favoriteId }
      });
    } else if (type && itemId) {
      // New method: delete by type and itemId
      // Check if itemId is external
      const isExternalItem = typeof itemId === 'string' && (
        itemId.startsWith('researcher-') || 
        itemId.startsWith('trial-') || 
        itemId.startsWith('pub-') ||
        itemId.includes('NCT') ||
        !itemId.match(/^c[a-z0-9]{24}$/)
      );

      let whereClause = { userId: user.userId };

      if (isExternalItem) {
        whereClause.externalId = itemId;
        whereClause.externalType = type;
      } else {
        if (type === 'publication') {
          whereClause.publicationId = itemId;
        } else if (type === 'trial') {
          whereClause.clinicalTrialId = itemId;
        } else if (type === 'researcher') {
          whereClause.expertId = itemId;
        } else {
          return NextResponse.json(
            { error: 'Invalid type' },
            { status: 400 }
          );
        }
      }

      await prisma.favorite.deleteMany({
        where: whereClause
      });
    } else {
      return NextResponse.json(
        { error: 'Either favoriteId or (type and itemId) are required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Favorite removed'
    });

  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}
