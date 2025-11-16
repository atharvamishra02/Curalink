import { NextResponse } from 'next/server';
import { getPublicationsByCondition } from '@/lib/pubmed';
import { fetchPublicationsFromArXiv } from '@/lib/arxiv';
import { searchORCID } from '@/lib/orcid';
import { cache } from '@/lib/redis';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const condition = searchParams.get('condition');
    const keyword = searchParams.get('keyword');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;
    const offset = (page - 1) * limit;
    // Handle both 'sources' (plural) and 'source' (singular) parameters
    const sourcesParam = searchParams.get('sources') || searchParams.get('source');
    const sources = sourcesParam ? sourcesParam.split(',') : ['pubmed', 'arxiv', 'orcid'];
    const noCache = searchParams.get('nocache') === 'true';

    // Need at least one search parameter
    if (!condition && !keyword) {
      return NextResponse.json(
        { error: 'Condition or keyword parameter is required' },
        { status: 400 }
      );
    }

    // Aggressive caching for speed
    const searchTerm = keyword || condition;
    const cacheKey = `pubs:v2:${searchTerm}:${page}:${limit}:${sources.sort().join(',')}`;
    
    if (!noCache) {
      const cachedData = await cache.get(cacheKey);
      
      if (cachedData) {
        console.log('💾 Cache hit - instant response');
        return NextResponse.json({
          ...cachedData,
          cached: true
        });
      }
    }
    
    console.log('🆕 Fetching fresh data');

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
      // If source includes 'internal' only, fetch ALL publications regardless of condition
      const shouldFetchAll = sources.length === 1 && sources.includes('internal');
      
      internalPublications = await prisma.publication.findMany({
        where: shouldFetchAll ? {} : {
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
        take: shouldFetchAll ? 50 : 10, // Show more when filtering by Curalink only
        orderBy: {
          publishedDate: 'desc'
        }
      });
    } catch (dbError) {
      console.error('Error fetching internal publications:', dbError.message);
    }

    // Transform internal publications to match external format with rich data
    const formattedInternalPublications = internalPublications.map(pub => {
      const authorName = pub.researcher?.user?.name || 'Unknown';
      const institution = pub.researcher?.institution || 'Curalink Platform';
      const abstractPreview = pub.abstract?.length > 300 
        ? pub.abstract.substring(0, 300) + '...' 
        : pub.abstract || 'No abstract available';
      
      return {
        id: pub.id,
        title: pub.title,
        abstract: pub.abstract || 'No abstract available',
        description: pub.abstract || 'No abstract available',
        summary: `Published in ${pub.journal || 'Curalink'} by ${authorName} from ${institution}. ${abstractPreview}`,
        authors: authorName,
        journal: pub.journal || 'Curalink',
        publishedDate: pub.publishedDate,
        publishDate: pub.publishedDate,
        doi: pub.doi,
        url: pub.url,
        source: 'Curalink',
        status: 'Published',
        phase: 'Publication',
        location: pub.journal || 'Curalink',
        conditions: pub.keywords || [searchTerm],
        leadSponsor: institution,
        principalInvestigator: authorName,
        isInternalPublication: true,
        type: 'publication'
      };
    });

    // Fetch external publications in parallel for maximum speed
    const externalFetchPromises = [];
    
    // Fetch from PubMed if selected
    if (sources.includes('pubmed') && condition) {
      externalFetchPromises.push(
        getPublicationsByCondition({ condition, limit })
          .then(pubmedPubs => {
            // Normalize PubMed data
            return pubmedPubs.map(pub => {
          const abstractPreview = pub.abstract && pub.abstract !== 'No abstract available'
            ? (pub.abstract.length > 300 ? pub.abstract.substring(0, 300) + '...' : pub.abstract)
            : `Research article published in ${pub.journal} by ${pub.authors}. Related to ${searchTerm}.`;
          
          return {
            id: pub.id,
            pmid: pub.pmid,
            title: pub.title,
            abstract: pub.abstract,
            description: pub.abstract,
            summary: `Published in ${pub.journal} (${pub.publishDate}). ${abstractPreview}`,
            authors: pub.authors,
            journal: pub.journal,
            publishedDate: pub.publishDate,
            publishDate: pub.publishDate,
            doi: pub.doi,
            url: pub.url,
            source: 'PubMed',
            status: 'Published',
            phase: 'Publication',
            location: pub.journal,
            conditions: [searchTerm],
            leadSponsor: pub.journal,
            principalInvestigator: pub.authors,
            type: 'publication'
          };
        });
          })
          .catch(error => {
            console.error('❌ PubMed error:', error.message);
            return [];
          })
      );
    }
    
    // Fetch from arXiv if selected
    if (sources.includes('arxiv')) {
      externalFetchPromises.push(
        fetchPublicationsFromArXiv({ condition: searchTerm, limit })
          .then(arxivPubs => {
            // Normalize arXiv data
            return arxivPubs.map(pub => {
          const abstractPreview = pub.abstract?.length > 300 
            ? pub.abstract.substring(0, 300) + '...' 
            : pub.abstract;
          
          return {
            id: pub.id,
            arxivId: pub.arxivId,
            title: pub.title,
            abstract: pub.abstract,
            description: pub.abstract,
            summary: `Research preprint by ${pub.authors}. ${abstractPreview}`,
            authors: pub.authors,
            journal: 'arXiv',
            publishedDate: pub.publishDate,
            publishDate: pub.publishDate,
            updatedDate: pub.updatedDate,
            categories: pub.categories,
            url: pub.url,
            pdfUrl: pub.pdfUrl,
            source: 'arXiv',
            status: 'Published',
            phase: 'Preprint',
            location: pub.categories || 'arXiv',
            conditions: pub.categories ? pub.categories.split(', ').slice(0, 3) : [searchTerm],
            leadSponsor: 'arXiv',
            principalInvestigator: pub.authors,
            type: 'preprint'
          };
        });
          })
          .catch(error => {
            console.error('❌ arXiv error:', error.message);
            return [];
          })
      );
    }
    
    // Fetch from ORCID if selected
    if (sources.includes('orcid')) {
      externalFetchPromises.push(
        searchORCID({ query: searchTerm, limit })
          .then(orcidResearchers => {
            // Transform ORCID researchers to publication-like format
            return orcidResearchers.map(researcher => {
          const institution = researcher.institution || 'Independent Researcher';
          const role = researcher.role || 'Researcher';
          const worksInfo = researcher.worksCount > 0 ? ` with ${researcher.worksCount} published works` : '';
          
          const description = researcher.biography || 
            `${researcher.name} is a ${role} at ${institution}${worksInfo}. ORCID verified researcher profile with expertise in ${searchTerm}.`;
          
          return {
            id: researcher.id,
            orcidId: researcher.orcidId,
            title: `${researcher.name} - Research Profile`,
            abstract: description,
            description,
            summary: `${role} at ${institution}. ${researcher.worksCount > 0 ? `Has published ${researcher.worksCount} research works.` : 'Active researcher in the field.'}`,
            authors: researcher.name,
            journal: institution,
            publishedDate: null,
            publishDate: null,
            url: researcher.url,
            source: 'ORCID',
            status: 'Active Researcher',
            phase: 'Researcher Profile',
            location: institution,
            conditions: [searchTerm],
            leadSponsor: institution,
            principalInvestigator: researcher.name,
            worksCount: researcher.worksCount,
            type: 'researcher'
          };
        });
          })
          .catch(error => {
            console.error('❌ ORCID error:', error.message);
            return [];
          })
      );
    }
    




    // Execute all external fetches in parallel for maximum speed
    const externalResults = await Promise.allSettled(externalFetchPromises);
    const externalPublications = externalResults
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);

    console.log(`✅ Fetched ${externalPublications.length} external publications in parallel`);

    // Combine both lists - internal first, then external
    const allPublications = [...formattedInternalPublications, ...externalPublications];

    // Log source breakdown
    const sourceBreakdown = {};
    allPublications.forEach(pub => {
      sourceBreakdown[pub.source] = (sourceBreakdown[pub.source] || 0) + 1;
    });
    console.log('📈 Source breakdown:', sourceBreakdown);
    console.log('📚 Total publications:', allPublications.length);

    // Pagination
    const totalCount = allPublications.length;
    const paginatedPublications = allPublications.slice(offset, offset + limit);
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    const responseData = {
      publications: paginatedPublications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore
      },
      internal: formattedInternalPublications.length,
      external: externalPublications.length,
      sources: sources,
      sourceBreakdown: sourceBreakdown
    };

    // Cache for 1 hour (3600 seconds) - publications don't change frequently
    await cache.set(cacheKey, responseData, 3600);

    return NextResponse.json({
      ...responseData,
      cached: false
    });
  } catch (error) {
    console.error('Publications API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publications', publications: [] },
      { status: 500 }
    );
  }
}