import { NextResponse } from 'next/server';
import { searchClinicalTrials } from '@/lib/clinicalTrials';
import { cache } from '@/lib/redis';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const condition = searchParams.get('condition');
    const keyword = searchParams.get('keyword');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const location = searchParams.get('location');
    const phase = searchParams.get('phase');
    const status = searchParams.get('status');

    // Need at least one search parameter
    if (!condition && !keyword) {
      return NextResponse.json(
        { error: 'Condition or keyword parameter is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const searchTerm = keyword || condition;
    const cacheKey = `trials:${searchTerm}:${location || 'all'}:${phase || 'all'}:${status || 'all'}:${limit}`;
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json({
        trials: cachedData,
        cached: true,
      });
    }

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
      // Search by condition
      searchConditions.push(
        {
          conditions: {
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
          description: {
            contains: condition,
            mode: 'insensitive'
          }
        }
      );
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

    const internalTrials = await prisma.clinicalTrial.findMany(internalTrialsQuery);

    // Transform internal trials to match external format
    const formattedInternalTrials = internalTrials.map(trial => ({
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

    // Fetch external trials from ClinicalTrials.gov (with error handling)
    let externalTrials = [];
    try {
      // Only fetch external if we have a condition (external API doesn't support researcher name search)
      if (condition) {
        console.log('Fetching external trials for condition:', condition);
        
        // Note: We don't pass phase/status to external API to avoid 400 errors
        // All filtering will be done client-side after fetching
        externalTrials = await searchClinicalTrials({
          condition,
          limit: limit * 2, // Fetch more to account for filtering
          location,
        });
        
        console.log('External trials fetched:', externalTrials.length);
      }
    } catch (apiError) {
      console.error('Error fetching external trials:', apiError.message);
      // Continue with internal trials only
    }

    // Combine both lists - internal first, then external
    const allTrials = [...formattedInternalTrials, ...externalTrials];
    
    console.log('Total trials before filtering:', allTrials.length, { internal: formattedInternalTrials.length, external: externalTrials.length });
    
    // Apply client-side filtering if filters are present
    let filteredTrials = allTrials;
    if (phase || status) {
      filteredTrials = allTrials.filter(trial => {
        let matchesPhase = true;
        let matchesStatus = true;
        
        if (phase) {
          if (trial.isInternalTrial) {
            // Internal trials are already filtered by database
            matchesPhase = true;
          } else if (trial.phase) {
            // Normalize phase formats for comparison
            // External API returns: "PHASE 1", "Phase 1", "PHASE1", "Early Phase 1", "N/A"
            // We need to match to our format: "PHASE_1", "EARLY_PHASE_1", "NOT_APPLICABLE"
            
            const trialPhaseNormalized = trial.phase
              .toUpperCase()
              .replace(/EARLY\s+PHASE\s+/, 'EARLY_PHASE_')
              .replace(/PHASE\s+/, 'PHASE_')
              .replace(/\s+/g, '_')
              .replace(/N\/A|NOT\s*APPLICABLE/i, 'NOT_APPLICABLE');
            
            matchesPhase = trialPhaseNormalized === phase;
          } else {
            matchesPhase = false;
          }
        }
        
        if (status) {
          if (trial.isInternalTrial) {
            // Internal trials are already filtered by database
            matchesStatus = true;
          } else if (trial.status) {
            // Normalize status for comparison
            const normalizedTrialStatus = trial.status
              .toUpperCase()
              .replace(/[,\s]+/g, '_')
              .replace(/__+/g, '_'); // Replace multiple underscores with single
            
            const normalizedFilterStatus = status.toUpperCase();
            
            // Direct match
            matchesStatus = normalizedTrialStatus === normalizedFilterStatus;
            
            // Handle special cases
            if (!matchesStatus && status === 'ACTIVE') {
              // ACTIVE should match "ACTIVE" and "ACTIVE_NOT_RECRUITING"
              matchesStatus = normalizedTrialStatus === 'ACTIVE' || 
                            normalizedTrialStatus === 'ACTIVE_NOT_RECRUITING' ||
                            normalizedTrialStatus.startsWith('ACTIVE');
            }
          } else {
            matchesStatus = false;
          }
        }
        
        return matchesPhase && matchesStatus;
      });
      
      console.log('Total trials after client-side filtering:', filteredTrials.length);
      
      // Log filter summary for debugging
      if (filteredTrials.length === 0 && allTrials.length > 0) {
        console.log(`⚠️ No trials matched filters (phase: ${phase || 'any'}, status: ${status || 'any'}). Fetched ${allTrials.length} trials but none matched.`);
      }
    }

    // Cache for 6 hours (clinical trials don't change frequently)
    await cache.set(cacheKey, filteredTrials, 21600);

    return NextResponse.json({
      trials: filteredTrials.slice(0, limit),
      cached: false,
      internal: formattedInternalTrials.length,
      external: externalTrials.length,
      filtered: filteredTrials.length,
      message: filteredTrials.length === 0 && (phase || status) 
        ? `No trials found matching the selected filters. Try adjusting your phase or status selection.`
        : undefined
    });
  } catch (error) {
    console.error('Clinical Trials API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clinical trials', trials: [] },
      { status: 500 }
    );
  }
}