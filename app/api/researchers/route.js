import { NextResponse } from 'next/server';
import { getResearchersByCondition } from '@/lib/pubmed';
import { fetchResearchersFromGoogleScholar } from '@/lib/serpapi';
import { fetchResearchersFromORCID } from '@/lib/orcid';
import { cache } from '@/lib/redis';
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

/**
 * Calculate location similarity score (0-100)
 * Higher score = better match
 */
function calculateLocationScore(researcherLocation, userLocation) {
  if (!researcherLocation || !userLocation) return 0;
  if (researcherLocation === 'Not specified') return 0;
  
  const researcher = researcherLocation.toLowerCase().trim();
  const user = userLocation.toLowerCase().trim();
  
  // Exact match
  if (researcher === user) return 100;
  
  // Check if one contains the other (substring match)
  if (researcher.includes(user) || user.includes(researcher)) return 80;
  
  // Split into parts (city, state, country) and clean them
  const researcherParts = researcher.split(/[,\s]+/).map(p => p.trim()).filter(p => p.length > 0);
  const userParts = user.split(/[,\s]+/).map(p => p.trim()).filter(p => p.length > 0);
  
  // Count matching parts (case-insensitive, partial match allowed)
  let matchingParts = 0;
  let bestMatchScore = 0;
  
  for (const userPart of userParts) {
    for (const researcherPart of researcherParts) {
      // Exact part match
      if (userPart === researcherPart) {
        matchingParts += 1;
        bestMatchScore = Math.max(bestMatchScore, 1);
      }
      // One contains the other
      else if (userPart.includes(researcherPart) || researcherPart.includes(userPart)) {
        matchingParts += 0.7;
        bestMatchScore = Math.max(bestMatchScore, 0.7);
      }
      // Similar start (first 3 characters match)
      else if (userPart.length >= 3 && researcherPart.length >= 3 && 
               userPart.substring(0, 3) === researcherPart.substring(0, 3)) {
        matchingParts += 0.3;
        bestMatchScore = Math.max(bestMatchScore, 0.3);
      }
    }
  }
  
  // Score based on matching parts (weighted by total parts)
  const maxParts = Math.max(userParts.length, researcherParts.length);
  const score = (matchingParts / maxParts) * 70;
  
  return Math.round(score);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const condition = searchParams.get('condition');
    const search = searchParams.get('search'); // Name search query
    const limit = parseInt(searchParams.get('limit') || '30');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    const userLocation = searchParams.get('location'); // User's location
    const source = searchParams.get('source') || 'all'; // Source filter: 'all', 'internal', 'pubmed', 'scholar', 'orcid'

    if (!condition) {
      return NextResponse.json(
        { error: 'Condition parameter is required' },
        { status: 400 }
      );
    }

    // Aggressive caching for speed
    const cacheKey = `res:v2:${source}:${condition}:${search || 'none'}:${userLocation || 'none'}:${page}:${limit}`;
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      console.log('💾 Cache hit - instant response');
      return NextResponse.json({
        ...cachedData,
        cached: true
      });
    }

    // Get current user for connection status
    const currentUser = getUserFromToken(request);

    console.log('🔍 Fetching researchers for:', condition);
    console.log('📊 Source filter:', source);
    if (search) {
      console.log('🔎 Name search query:', search);
    }
    if (userLocation) {
      console.log('📍 User location:', userLocation);
    }
    
    // Get internal researchers from database (if source is 'all' or 'internal')
    let internalResearchers = [];
    if (source === 'all' || source === 'internal') {
      try {
      // Build the where clause based on source and search parameters
      let whereClause;

      if (source === 'internal') {
        // When filtering by "Curalink Only", show ALL researchers regardless of condition
        if (search) {
          // If searching by name, filter by name/email/institution
          whereClause = {
            AND: [
              { role: 'RESEARCHER' },
              {
                OR: [
                  {
                    name: {
                      contains: search,
                      mode: 'insensitive'
                    }
                  },
                  {
                    email: {
                      contains: search,
                      mode: 'insensitive'
                    }
                  },
                  {
                    researcherProfile: {
                      institution: {
                        contains: search,
                        mode: 'insensitive'
                      }
                    }
                  }
                ]
              }
            ]
          };
        } else {
          // No search query - show all researchers
          whereClause = {
            role: 'RESEARCHER'
          };
        }
      } else {
        // When source is 'all', filter by condition or search
        if (search) {
          // If searching by name, look in name, email, and researcher profile
          whereClause = {
            AND: [
              { role: 'RESEARCHER' },
              {
                OR: [
                  {
                    name: {
                      contains: search,
                      mode: 'insensitive'
                    }
                  },
                  {
                    email: {
                      contains: search,
                      mode: 'insensitive'
                    }
                  },
                  {
                    researcherProfile: {
                      institution: {
                        contains: search,
                        mode: 'insensitive'
                      }
                    }
                  }
                ]
              }
            ]
          };
        } else {
          // If no name search, use condition-based search
          whereClause = {
            role: 'RESEARCHER',
            researcherProfile: {
              OR: [
                {
                  specialties: {
                    hasSome: [condition]
                  }
                },
                {
                  bio: {
                    contains: condition,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          };
        }
      }

      console.log('Where clause:', JSON.stringify(whereClause, null, 2));

      internalResearchers = await prisma.user.findMany({
        where: whereClause,
        include: {
          researcherProfile: {
            include: {
              publications: true,
              clinicalTrials: true
            }
          }
        },
        take: source === 'internal' ? 50 : 10 // Show more when filtering by Curalink only
      });

        console.log('Internal researchers found:', internalResearchers.length);
      } catch (dbError) {
        console.error('Error fetching internal researchers:', dbError.message);
        console.error('Full error:', dbError);
      }
    }

    // Get connection statuses and follow status if user is logged in
    let connectionMap = new Map();
    let followMap = new Map();
    if (currentUser && currentUser.userId) {
      try {
        const connections = await prisma.connection.findMany({
          where: {
            OR: [
              { userId: currentUser.userId },
              { connectedId: currentUser.userId }
            ]
          },
          select: {
            id: true,
            userId: true,
            connectedId: true,
            status: true
          }
        });

        connections.forEach(conn => {
          const otherUserId = conn.userId === currentUser.userId ? conn.connectedId : conn.userId;
          const isSentByMe = conn.userId === currentUser.userId;
          const isReceivedByMe = conn.connectedId === currentUser.userId;
          
          connectionMap.set(otherUserId, {
            connectionId: conn.id,
            status: conn.status,
            isSentByMe,
            isReceivedByMe,
          });
        });
      } catch (connError) {
        console.error('Error fetching connections:', connError.message);
      }

      // Get follow statuses
      try {
        const follows = await prisma.follow.findMany({
          where: {
            followerId: currentUser.userId
          },
          select: {
            followingId: true
          }
        });

        follows.forEach(follow => {
          followMap.set(follow.followingId, true);
        });
      } catch (followError) {
        console.error('Error fetching follows:', followError.message);
      }
    }

    // Fetch external researchers in parallel for maximum speed
    const externalFetchPromises = [];
    
    // Fetch from PubMed if source is 'all' or 'pubmed'
    if (source === 'all' || source === 'pubmed') {
      externalFetchPromises.push(
        getResearchersByCondition({ condition, limit })
          .then(pubmedResearchers => {
            // Normalize PubMed data
            return pubmedResearchers.map(pub => ({
          id: pub.id,
          name: pub.authors || 'Unknown Author',
          email: null,
          affiliation: pub.journal || 'PubMed',
          specialty: condition,
          specialization: condition,
          publicationCount: 1,
          trialCount: 0,
          publications: [pub.title],
          clinicalTrials: [],
          bio: pub.abstract?.substring(0, 200) + '...' || `Researcher published in ${pub.journal}`,
          location: pub.journal,
          avatar: null,
          isInternalResearcher: false,
          source: 'PubMed',
          connectionStatus: null,
          connectionId: null,
          isSentByMe: false,
          isReceivedByMe: false,
          availableForMeetings: false,
          meetingSchedule: null,
          isFollowing: false,
          updatedAt: pub.publishDate
        }));
          })
          .catch(error => {
            console.error('❌ PubMed error:', error.message);
            return [];
          })
      );
    }
    
    // Fetch from Google Scholar if source is 'all' or 'scholar'
    if (source === 'all' || source === 'scholar') {
      const searchQuery = search || condition;
      externalFetchPromises.push(
        fetchResearchersFromGoogleScholar(searchQuery, limit)
          .then(scholarResearchers => {
            // Normalize Google Scholar data
            return scholarResearchers.map(r => ({
          ...r,
          affiliation: r.affiliation || 'Google Scholar',
          specialty: r.specialty || condition,
          specialization: r.specialization || condition,
          publicationCount: r.publicationCount || 0,
          trialCount: 0,
          publications: r.publications || [],
          clinicalTrials: [],
          bio: r.bio || `Researcher specializing in ${condition}`,
          isInternalResearcher: false,
          connectionStatus: null,
          connectionId: null,
          isSentByMe: false,
          isReceivedByMe: false,
          availableForMeetings: false,
          meetingSchedule: null,
          isFollowing: false
        }));
          })
          .catch(error => {
            console.error('❌ Scholar error:', error.message);
            return [];
          })
      );
    }
    
    // Fetch from ORCID if source is 'all' or 'orcid'
    if (source === 'all' || source === 'orcid') {
      const searchQuery = search || condition;
      externalFetchPromises.push(
        fetchResearchersFromORCID({ query: searchQuery, limit })
          .then(orcidResearchers => {
            // Normalize ORCID data
            return orcidResearchers.map(r => ({
          id: r.id,
          orcidId: r.orcidId,
          name: r.name,
          email: null,
          affiliation: r.institution || 'ORCID',
          specialty: r.role || condition,
          specialization: r.role || condition,
          publicationCount: r.worksCount || 0,
          trialCount: 0,
          publications: [],
          clinicalTrials: [],
          bio: r.biography || `${r.role || 'Researcher'} at ${r.institution || 'ORCID'}. Specializes in ${condition}.`,
          location: r.institution || 'ORCID',
          avatar: null,
          isInternalResearcher: false,
          source: 'ORCID',
          connectionStatus: null,
          connectionId: null,
          isSentByMe: false,
          isReceivedByMe: false,
          availableForMeetings: false,
          meetingSchedule: null,
          isFollowing: false,
          updatedAt: null,
          url: r.url
        }));
          })
          .catch(error => {
            console.error('❌ ORCID error:', error.message);
            return [];
          })
      );
    }

    // Execute all external fetches in parallel for maximum speed
    const externalResults = await Promise.allSettled(externalFetchPromises);
    const externalResearchers = externalResults
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);

    console.log(`✅ Fetched ${externalResearchers.length} external researchers in parallel`);

    // Transform internal researchers to match external format
    const formattedInternalResearchers = internalResearchers.map(researcher => {
      const connectionInfo = connectionMap.get(researcher.id);
      return {
        id: researcher.id,
        researcherProfileId: researcher.researcherProfile?.id, // Add this for favorites
        name: researcher.name,
        email: researcher.email,
        affiliation: researcher.researcherProfile?.institution || 'Curalink Platform',
        specialty: researcher.researcherProfile?.specialties?.[0] || 'Research',
        specialization: researcher.researcherProfile?.specialties?.join(', ') || 'Research',
        publicationCount: researcher.researcherProfile?.publications?.length || 0,
        trialCount: researcher.researcherProfile?.clinicalTrials?.length || 0,
        publications: researcher.researcherProfile?.publications || [],
        clinicalTrials: researcher.researcherProfile?.clinicalTrials || [],
        bio: researcher.researcherProfile?.bio,
        location: researcher.researcherProfile?.location,
        avatar: researcher.avatar,
        isInternalResearcher: true, // Flag to identify app researchers
        source: 'APP',
        connectionStatus: connectionInfo?.status || null,
        connectionId: connectionInfo?.connectionId || null,
        isSentByMe: connectionInfo?.isSentByMe || false,
        isReceivedByMe: connectionInfo?.isReceivedByMe || false,
        availableForMeetings: researcher.researcherProfile?.availableForMeetings || false,
        meetingSchedule: researcher.researcherProfile?.meetingSchedule || null,
        isFollowing: followMap.get(researcher.id) || false,
        updatedAt: researcher.researcherProfile?.updatedAt || researcher.updatedAt, // Last update time
      };
    });

    // Combine both lists
    let allResearchers = [...formattedInternalResearchers, ...externalResearchers];

    // If user location is provided, sort by proximity
    if (userLocation) {
      console.log('🗺️ Sorting researchers by proximity to:', userLocation);
      console.log('📊 Before sorting - First 3 researchers:', 
        allResearchers.slice(0, 3).map(r => ({ name: r.name, location: r.location }))
      );
      
      // Calculate location score for each researcher
      allResearchers = allResearchers.map(researcher => {
        const score = calculateLocationScore(researcher.location, userLocation);
        if (score > 0) {
          console.log(`✅ Match found - ${researcher.name}: ${researcher.location} (score: ${score})`);
        }
        return {
          ...researcher,
          locationScore: score
        };
      });

      // Sort by location score (descending), then by publication count
      allResearchers.sort((a, b) => {
        // First priority: internal researchers (app researchers) come before external
        if (a.isInternalResearcher && !b.isInternalResearcher) return -1;
        if (!a.isInternalResearcher && b.isInternalResearcher) return 1;
        
        // Second priority: location match
        if (b.locationScore !== a.locationScore) {
          return b.locationScore - a.locationScore;
        }
        // Third priority: publication count
        return (b.publicationCount || 0) - (a.publicationCount || 0);
      });

      console.log('📍 After sorting - Top 5 researchers by location:', 
        allResearchers.slice(0, 5).map(r => ({
          name: r.name,
          location: r.location,
          score: r.locationScore,
          publications: r.publicationCount
        }))
      );
    } else {
      // No location filter: keep internal researchers first, then external by publication count
      allResearchers.sort((a, b) => {
        // Internal researchers always first
        if (a.isInternalResearcher && !b.isInternalResearcher) return -1;
        if (!a.isInternalResearcher && b.isInternalResearcher) return 1;
        // Then sort by publication count
        return (b.publicationCount || 0) - (a.publicationCount || 0);
      });
    }

    // Pagination
    const totalCount = allResearchers.length;
    const paginatedResearchers = allResearchers.slice(offset, offset + limit);
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    const responseData = {
      researchers: paginatedResearchers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore
      },
      count: totalCount,
      internal: formattedInternalResearchers.length,
      external: externalResearchers.length,
      sortedByLocation: !!userLocation
    };
    
    // Cache external-only results for 30 minutes
    // Cache for 1 hour - researchers don't change frequently
    await cache.set(cacheKey, responseData, 3600);
    
    return NextResponse.json({ 
      ...responseData,
      cached: false
    });
  } catch (error) {
    console.error('Error in researchers API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch researchers', details: error.message },
      { status: 500 }
    );
  }
}