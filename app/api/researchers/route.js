import { NextResponse } from 'next/server';
import { getResearchersByCondition } from '@/lib/pubmed';
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
    const userLocation = searchParams.get('location'); // User's location

    if (!condition) {
      return NextResponse.json(
        { error: 'Condition parameter is required' },
        { status: 400 }
      );
    }

    // Get current user for connection status
    const currentUser = getUserFromToken(request);

    console.log('Fetching researchers for:', condition);
    if (search) {
      console.log('Name search query:', search);
    }
    if (userLocation) {
      console.log('User location:', userLocation);
    }
    
    // Get internal researchers from database first
    let internalResearchers = [];
    try {
      // Build the where clause based on whether we have a name search
      let whereClause;

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
        take: 10 // Limit internal researchers
      });

      console.log('Internal researchers found:', internalResearchers.length);
    } catch (dbError) {
      console.error('Error fetching internal researchers:', dbError.message);
      console.error('Full error:', dbError);
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

    // Get external researchers from PubMed (with error handling)
    let externalResearchers = [];
    try {
      externalResearchers = await getResearchersByCondition(condition, limit);
    } catch (pubmedError) {
      console.error('Error fetching external researchers:', pubmedError.message);
      // Continue with internal researchers only
    }

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

    return NextResponse.json({ 
      researchers: allResearchers.slice(0, limit),
      count: allResearchers.length,
      internal: formattedInternalResearchers.length,
      external: externalResearchers.length,
      sortedByLocation: !!userLocation
    });
  } catch (error) {
    console.error('Error in researchers API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch researchers', details: error.message },
      { status: 500 }
    );
  }
}