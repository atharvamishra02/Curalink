import { NextResponse } from 'next/server';
import { getPublicationsByCondition } from '@/lib/pubmed';
import { cache } from '@/lib/redis';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const condition = searchParams.get('condition');
    const keyword = searchParams.get('keyword');
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Need at least one search parameter
    if (!condition && !keyword) {
      return NextResponse.json(
        { error: 'Condition or keyword parameter is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const searchTerm = keyword || condition;
    const cacheKey = `publications:${searchTerm}:${limit}`;
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json({
        publications: cachedData,
        cached: true,
      });
    }

    // Build search query - if keyword is provided, search by researcher name and title
    const searchConditions = [];
    
    if (keyword) {
      // Search by keyword in title and researcher name
      searchConditions.push(
        {
          title: {
            contains: keyword,
            mode: 'insensitive'
          }
        },
        {
          researcher: {
            user: {
              name: {
                contains: keyword,
                mode: 'insensitive'
              }
            }
          }
        }
      );
    }
    
    if (condition) {
      // Search by condition
      searchConditions.push(
        {
          keywords: {
            hasSome: [condition]
          }
        },
        {
          title: {
            contains: condition,
            mode: 'insensitive'
          }
        },
        {
          abstract: {
            contains: condition,
            mode: 'insensitive'
          }
        }
      );
    }

    // Fetch internal publications from database
    let internalPublications = [];
    try {
      internalPublications = await prisma.publication.findMany({
        where: {
          OR: searchConditions
        },
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
        },
        take: 10,
        orderBy: {
          publishedDate: 'desc'
        }
      });
    } catch (dbError) {
      console.error('Error fetching internal publications:', dbError.message);
    }

    // Transform internal publications to match external format
    const formattedInternalPublications = internalPublications.map(pub => ({
      id: pub.id,
      title: pub.title,
      abstract: pub.abstract,
      authors: [pub.researcher?.user?.name || 'Unknown'],
      journal: pub.journal,
      publishedDate: pub.publishedDate,
      doi: pub.doi,
      url: pub.url,
      source: 'APP',
      isInternalPublication: true
    }));

    // Fetch external publications from PubMed (with error handling)
    let externalPublications = [];
    try {
      // Only fetch external if we have a condition (PubMed search works better with conditions than researcher names)
      if (condition) {
        externalPublications = await getPublicationsByCondition(condition, limit);
      }
    } catch (pubmedError) {
      console.error('Error fetching external publications:', pubmedError.message);
      // Continue with internal publications only
    }

    // Combine both lists - internal first, then external
    const allPublications = [...formattedInternalPublications, ...externalPublications];

    // Cache for 1 hour
    await cache.set(cacheKey, allPublications, 3600);

    return NextResponse.json({
      publications: allPublications.slice(0, limit),
      cached: false,
      internal: formattedInternalPublications.length,
      external: externalPublications.length
    });
  } catch (error) {
    console.error('Publications API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publications', publications: [] },
      { status: 500 }
    );
  }
}