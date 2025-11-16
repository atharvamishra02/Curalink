import { NextResponse } from 'next/server';
import { searchClinicalTrials } from '@/lib/clinicalTrials';
import { searchClinicalTrials as searchAACT } from '@/lib/aact';
import { searchPubMed } from '@/lib/pubmed';
import { searchArXiv } from '@/lib/arxiv';
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
    let location = searchParams.get('location');
    const phase = searchParams.get('phase');
    const status = searchParams.get('status');
    const source = searchParams.get('source'); // 'all', 'internal', 'clinicaltrials', 'pubmed', 'arxiv'

    // Smart location parsing: Extract country from "City, Country" format
    if (location && location.includes(',')) {
      const parts = location.split(',').map(p => p.trim());
      const originalLocation = location;
      location = parts[parts.length - 1]; // Get the last part (country)
      console.log(`📍 Location parsing: "${originalLocation}" → "${location}"`);
    }

    // Need at least one search parameter
    if (!condition && !keyword) {
      return NextResponse.json(
        { error: 'Condition or keyword parameter is required' },
        { status: 400 }
      );
    }

    // Check cache first - include ALL filter parameters in cache key
    const searchTerm = keyword || condition;
    const cacheKey = `trials:${searchTerm}:${location || 'all'}:${phase || 'all'}:${status || 'all'}:${source || 'all'}:${page}:${limit}`;
    console.log('🔑 Cache key:', cacheKey);
    console.log('📄 Page:', page, 'Limit:', limit, 'Offset:', offset);
    
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      console.log('💾 Returning cached trials:', cachedData.trials?.length || 0);
      return NextResponse.json({
        ...cachedData,
        cached: true,
      });
    }
    
    console.log('🆕 Fetching fresh trials data');

    // Build search query - if keyword is provided, search across more fields including researcher name
    const searchConditions = [];
    
    if (keyword) {
      // Search by keyword in title, description, conditions, and researcher name
      searchConditions.push(
        {
          title: {
            contains: keyword,
            mode: 'insensitive'
          }
        },
        {
          description: {
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
      // Handle multiple conditions (comma-separated) or single condition
      const conditions = condition.includes(',') ? condition.split(',').map(c => c.trim()) : [condition];
      
      // For each condition, add search criteria
      conditions.forEach(cond => {
        searchConditions.push(
          {
            conditions: {
              hasSome: [cond]
            }
          },
          {
            title: {
              contains: cond,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: cond,
              mode: 'insensitive'
            }
          }
        );
      });
      
      // Also search for the full phrase (e.g., "lung cancer" as a whole)
      if (conditions.length > 1) {
        const fullPhrase = conditions.join(' ');
        searchConditions.push(
          {
            title: {
              contains: fullPhrase,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: fullPhrase,
              mode: 'insensitive'
            }
          }
        );
      }
    }

    // Fetch internal trials from database
    const internalTrialsQuery = {
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
        createdAt: 'desc'
      }
    };

    // Add additional filters
    const additionalFilters = [];
    
    if (location) {
      additionalFilters.push({
        location: {
          contains: location,
          mode: 'insensitive'
        }
      });
    }
    
    if (phase) {
      additionalFilters.push({
        phase: phase
      });
    }
    
    if (status) {
      additionalFilters.push({
        status: status
      });
    }
    
    if (additionalFilters.length > 0) {
      internalTrialsQuery.where.AND = additionalFilters;
    }

    // Fetch internal trials only if source is 'all' or 'internal'
    let formattedInternalTrials = [];
    if (!source || source === 'all' || source === 'internal') {
      // If source is 'internal' (Curalink Only), fetch ALL trials regardless of condition
      const finalQuery = source === 'internal' 
        ? {
            include: internalTrialsQuery.include,
            take: 50, // Show more when filtering by Curalink only
            orderBy: { createdAt: 'desc' }
          }
        : internalTrialsQuery;
      
      const internalTrials = await prisma.clinicalTrial.findMany(finalQuery);

      // Transform internal trials to match external format
      formattedInternalTrials = internalTrials.map(trial => ({
        id: trial.id,
        nctId: trial.nctId,
        title: trial.title,
        description: trial.description,
        summary: trial.description,
        status: trial.status,
        phase: trial.phase,
        location: trial.location,
        conditions: trial.conditions,
        startDate: trial.startDate,
        completionDate: trial.completionDate,
        leadSponsor: trial.researcher?.institution || 'Curalink Platform',
        principalInvestigator: trial.researcher?.user?.name || 'Unknown Investigator',
        source: 'APP',
        isInternalTrial: true
      }));
    }

    // Fetch external trials and research from various sources
    let externalTrials = [];
    
    // Fetch from PubMed if selected
    if ((source === 'all' || source === 'pubmed') && searchTerm) {
      try {
        console.log('🔬 Fetching articles from PubMed...');
        const pubmedArticles = await searchPubMed({
          query: searchTerm,
          limit: limit
        });
        
        // Transform PubMed articles to trial-like format
        const normalizedArticles = pubmedArticles.map(article => {
          // Create a better summary
          const abstractPreview = article.abstract && article.abstract !== 'No abstract available'
            ? (article.abstract.length > 300 ? article.abstract.substring(0, 300) + '...' : article.abstract)
            : `Research article published in ${article.journal} by ${article.authors}. Related to ${searchTerm}.`;
          
          const summary = `Published in ${article.journal} (${article.publishDate}). ${abstractPreview}`;
          
          return {
            id: article.id,
            nctId: article.pmid,
            title: article.title,
            description: article.abstract,
            summary,
            status: 'COMPLETED', // Use standard status
            phase: 'NOT_APPLICABLE', // Publications don't have phases
            location: article.journal,
            conditions: [searchTerm],
            startDate: article.publishDate,
            completionDate: article.publishDate,
            leadSponsor: article.journal,
            principalInvestigator: article.authors,
            url: article.url,
            doi: article.doi,
            source: 'PubMed',
            type: 'publication'
          };
        });
        
        externalTrials.push(...normalizedArticles);
        console.log(`✅ Fetched ${pubmedArticles.length} articles from PubMed`);
      } catch (pubmedError) {
        console.error('❌ Error fetching from PubMed:', pubmedError.message);
      }
    }
    
    // Fetch from arXiv if selected
    if ((source === 'all' || source === 'arxiv') && searchTerm) {
      try {
        console.log('📄 Fetching preprints from arXiv...');
        const arxivPapers = await searchArXiv({
          query: searchTerm,
          limit: limit
        });
        
        // Transform arXiv papers to trial-like format
        const normalizedPapers = arxivPapers.map(paper => {
          // Create a better summary from abstract
          const abstractPreview = paper.abstract.length > 300 
            ? paper.abstract.substring(0, 300) + '...' 
            : paper.abstract;
          
          const summary = `Research preprint by ${paper.authors}. ${abstractPreview}`;
          
          return {
            id: paper.id,
            nctId: paper.arxivId,
            title: paper.title,
            description: paper.abstract,
            summary,
            status: 'COMPLETED', // Use standard status
            phase: 'NOT_APPLICABLE', // Preprints don't have phases
            location: paper.categories || 'arXiv',
            conditions: paper.categories ? paper.categories.split(', ').slice(0, 3) : [searchTerm],
            startDate: paper.publishDate,
            completionDate: paper.updatedDate,
            leadSponsor: 'arXiv',
            principalInvestigator: paper.authors,
            url: paper.url,
            pdfUrl: paper.pdfUrl,
            source: 'arXiv',
            type: 'preprint'
          };
        });
        
        externalTrials.push(...normalizedPapers);
        console.log(`✅ Fetched ${arxivPapers.length} papers from arXiv`);
      } catch (arxivError) {
        console.error('❌ Error fetching from arXiv:', arxivError.message);
      }
    }
    


    
    // Fetch from ClinicalTrials.gov
    if ((!source || source === 'all' || source === 'clinicaltrials') && condition) {
      // Convert comma-separated conditions to space-separated for better search
      const searchCondition = condition.includes(',') 
        ? condition.split(',').map(c => c.trim()).join(' ')
        : condition;
      
      console.log(`🔍 Fetching trials from ClinicalTrials.gov for condition: ${searchCondition}`);
      console.log(`� FiFlters - Status: ${status || 'all'}, Phase: ${phase || 'all'}, Location: ${location || 'all'}`);
      
      // Try ClinicalTrials.gov API first (more reliable)
      try {
        const apiTrials = await searchClinicalTrials({
          condition: searchCondition,
          status,
          phase,
          location,
          limit: limit * 2,
        });
        externalTrials.push(...apiTrials);
        console.log(`✅ Fetched ${apiTrials.length} trials from ClinicalTrials.gov API`);
      } catch (apiError) {
        console.error('❌ Error fetching from ClinicalTrials.gov API:', apiError.message);
        
        // Fallback to AACT database if API fails
        try {
          console.log('⚠️ Falling back to AACT database');
          const aactTrials = await searchAACT({
            condition: searchCondition,
            status,
            phase,
            location,
            limit: limit * 2,
            offset: 0
          });
          externalTrials.push(...aactTrials);
          console.log(`✅ Fetched ${aactTrials.length} trials from AACT database`);
        } catch (aactError) {
          console.error('❌ Error fetching from AACT database:', aactError.message);
        }
      }
    }



    // Combine both lists - internal first, then external
    const allTrials = [...formattedInternalTrials, ...externalTrials];
    
    console.log('Total trials fetched:', allTrials.length, { 
      internal: formattedInternalTrials.length, 
      external: externalTrials.length 
    });
    
    // Log source breakdown
    const sourceBreakdown = {};
    allTrials.forEach(trial => {
      sourceBreakdown[trial.source] = (sourceBreakdown[trial.source] || 0) + 1;
    });
    console.log('📊 Source breakdown:', sourceBreakdown);
    
    // Apply client-side phase and status filtering (for external sources that don't support these filters)
    let filteredTrials = allTrials;
    
    // Phase filtering
    if (phase) {
      filteredTrials = filteredTrials.filter(trial => {
        if (!trial.phase) return false;
        
        // Normalize phase for comparison
        const trialPhase = trial.phase
          .toUpperCase()
          .replace(/EARLY\s+PHASE\s+/, 'EARLY_PHASE_')
          .replace(/PHASE\s+/, 'PHASE_')
          .replace(/\s+/g, '_')
          .replace(/N\/A|NOT\s*APPLICABLE/i, 'NOT_APPLICABLE');
        
        return trialPhase === phase;
      });
      
      console.log(`Filtered by phase ${phase}:`, filteredTrials.length, 'trials');
    }
    
    // Status filtering (for external sources)
    if (status) {
      filteredTrials = filteredTrials.filter(trial => {
        if (!trial.status) return false;
        
        // Normalize status for comparison
        const trialStatus = trial.status
          .toUpperCase()
          .replace(/\s+/g, '_')
          .replace(/,/g, '');
        
        return trialStatus === status;
      });
      
      console.log(`Filtered by status ${status}:`, filteredTrials.length, 'trials');
    }

    // Generate helpful message based on results and filters
    let message = undefined;
    if (filteredTrials.length === 0) {
      if (source === 'pubmed') {
        message = `No articles found in PubMed for "${searchTerm}". Try different keywords or "All Sources".`;
      } else if (source === 'arxiv') {
        message = `No preprints found in arXiv for "${searchTerm}". Try different keywords or "All Sources".`;
      } else if (location) {
        message = `No trials found in "${location}". Try a different location or remove the location filter.`;
      } else {
        message = `No results found for "${searchTerm}". Try different keywords or adjust your filters.`;
      }
    } else if (source === 'pubmed') {
      message = `Showing ${filteredTrials.length} articles from PubMed.`;
    } else if (source === 'arxiv') {
      message = `Showing ${filteredTrials.length} preprints from arXiv.`;
    }

    // Apply pagination
    const paginatedTrials = filteredTrials.slice(offset, offset + limit);
    const totalPages = Math.ceil(filteredTrials.length / limit);
    
    const responseData = {
      trials: paginatedTrials,
      cached: false,
      internal: formattedInternalTrials.length,
      external: externalTrials.length,
      total: filteredTrials.length,
      source: source || 'all',
      message,
      pagination: {
        page,
        limit,
        offset,
        totalCount: filteredTrials.length,
        totalPages,
        hasMore: page < totalPages
      }
    };

    // Cache the complete response for 6 hours (clinical trials don't change frequently)
    await cache.set(cacheKey, responseData, 21600);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Clinical Trials API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clinical trials', trials: [] },
      { status: 500 }
    );
  }
}