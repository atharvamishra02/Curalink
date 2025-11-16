// Google Scholar integration using SerpAPI
import { serpApiLimiter } from './rate-limiter';

export async function fetchResearchersFromGoogleScholar(query, limit = 10) {
  // Use rate limiter to ensure we don't exceed 1 request per second
  return serpApiLimiter.throttle(async () => {
    return await fetchResearchersFromGoogleScholarInternal(query, limit);
  });
}

async function fetchResearchersFromGoogleScholarInternal(query, limit = 10) {
  const apiKey = process.env.NEXT_PUBLIC_SERPAPI_KEY;
  
  if (!apiKey) {
    console.error('❌ SERPAPI_KEY not configured');
    return [];
  }
  
  console.log('🔑 Using SerpAPI key:', apiKey.substring(0, 10) + '...');
  console.log('🔍 Searching Google Scholar publications for researchers:', query);

  try {
    // Use regular Google Scholar search (not profiles) to find papers and extract authors
    const cleanQuery = query.trim().replace(/\s+/g, '+');
    const url = `https://serpapi.com/search.json?engine=google_scholar&q=${cleanQuery}&api_key=${apiKey}&num=${limit * 2}`;
    console.log('Fetching from SerpAPI URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('SerpAPI error response:', errorData);
      
      // Common error messages
      if (errorData.error?.includes('Invalid API key')) {
        console.error('❌ SerpAPI: Invalid API key. Please check your NEXT_PUBLIC_SERPAPI_KEY in .env');
      } else if (errorData.error?.includes('credit')) {
        console.error('❌ SerpAPI: No credits remaining. Please check your account at https://serpapi.com/dashboard');
      }
      
      // Return empty array instead of throwing to allow other sources to work
      return [];
    }

    const data = await response.json();
    console.log('📦 SerpAPI response keys:', Object.keys(data));
    
    // Check for error in response data
    if (data.error) {
      console.error('❌ SerpAPI returned error:', data.error);
      return [];
    }
    
    if (!data.organic_results || data.organic_results.length === 0) {
      console.log('⚠️ No Google Scholar results found for:', query);
      return [];
    }

    console.log(`✅ Found ${data.organic_results.length} Google Scholar papers`);
    
    // Extract unique authors from papers
    const authorsMap = new Map();
    
    data.organic_results.forEach(result => {
      const authors = result.publication_info?.authors || [];
      authors.forEach(author => {
        const authorName = author.name;
        if (authorName && !authorsMap.has(authorName)) {
          const affiliation = author.affiliation || `Research Institution (${query})`;
          authorsMap.set(authorName, {
            id: `scholar-author-${authorName.replace(/\s+/g, '-').toLowerCase()}`,
            name: authorName,
            email: 'Contact via Google Scholar',
            affiliation: typeof affiliation === 'string' ? affiliation : `Research Institution (${query})`,
            specialty: query, // Add specialty field for card display
            specialization: query,
            bio: `Active researcher in ${query} field`, // Add bio field
            location: extractLocationFromAffiliation(affiliation) || 'See Google Scholar Profile',
            publicationCount: 1, // We found at least 1 publication
            trialCount: 0,
            source: 'Google Scholar',
            isInternalResearcher: false,
            googleScholarUrl: author.link || `https://scholar.google.com/scholar?q=${encodeURIComponent(authorName)}`
          });
        } else if (authorName && authorsMap.has(authorName)) {
          // Increment publication count
          const existing = authorsMap.get(authorName);
          existing.publicationCount += 1;
        }
      });
    });

    const researchers = Array.from(authorsMap.values()).slice(0, limit);
    console.log(`👥 Extracted ${researchers.length} unique researchers`);
    return researchers;
  } catch (error) {
    console.error('Error fetching from Google Scholar:', error);
    return [];
  }
}

export async function fetchPublicationsFromGoogleScholar(query, limit = 20) {
  // Use rate limiter to ensure we don't exceed 1 request per second
  return serpApiLimiter.throttle(async () => {
    return await fetchPublicationsFromGoogleScholarInternal(query, limit);
  });
}

async function fetchPublicationsFromGoogleScholarInternal(query, limit = 20) {
  const apiKey = process.env.NEXT_PUBLIC_SERPAPI_KEY;
  
  if (!apiKey) {
    console.error('SERPAPI_KEY not configured');
    return [];
  }

  try {
    const response = await fetch(
      `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=${limit}`
    );

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.organic_results || data.organic_results.length === 0) {
      console.log('No Google Scholar publications found for:', query);
      return [];
    }

    return data.organic_results.map((result, index) => ({
      id: `scholar-pub-${result.result_id || index}`,
      title: result.title,
      authors: result.publication_info?.authors?.map(a => a.name) || [result.publication_info?.summary?.split(',')[0] || 'Unknown'],
      journal: result.publication_info?.summary || 'Unknown',
      publishedDate: extractYear(result.publication_info?.summary),
      abstract: result.snippet || '',
      citationCount: result.inline_links?.cited_by?.total || 0,
      source: 'Google Scholar',
      url: result.link,
      pdfUrl: result.resources?.find(r => r.file_format === 'PDF')?.link
    }));
  } catch (error) {
    console.error('Error fetching publications from Google Scholar:', error);
    return [];
  }
}

// Helper function to extract location from affiliation string
function extractLocationFromAffiliation(affiliation) {
  if (!affiliation) return 'Not specified';
  
  // Common patterns: "University of X, City, State" or "Institution, Location"
  const parts = affiliation.split(',').map(p => p.trim());
  
  // If there are multiple parts, the last ones are usually location
  if (parts.length >= 2) {
    return parts.slice(-2).join(', ');
  }
  
  return affiliation;
}

// Helper function to extract year from publication info
function extractYear(summary) {
  if (!summary) return null;
  
  const yearMatch = summary.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? `${yearMatch[0]}-01-01` : null;
}

// ResearchGate integration using SerpAPI
export async function fetchPublicationsFromResearchGate(query, limit = 20) {
  // Use rate limiter
  return serpApiLimiter.throttle(async () => {
    return await fetchPublicationsFromResearchGateInternal(query, limit);
  });
}

async function fetchPublicationsFromResearchGateInternal(query, limit = 20) {
  const apiKey = process.env.NEXT_PUBLIC_SERPAPI_KEY || process.env.SERPAPI_KEY;
  
  if (!apiKey) {
    console.error('❌ SERPAPI_KEY not configured - ResearchGate will return no results');
    return [];
  }

  try {
    // Search Google Scholar for publications (ResearchGate content is indexed there)
    const cleanQuery = query.trim().replace(/\s+/g, '+');
    const url = `https://serpapi.com/search.json?engine=google_scholar&q=${cleanQuery}&api_key=${apiKey}&num=${limit}`;
    
    console.log('🔍 Fetching ResearchGate publications via SerpAPI for:', query);
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('SerpAPI error for ResearchGate:', errorData);
      return [];
    }

    const data = await response.json();
    
    if (!data.organic_results || data.organic_results.length === 0) {
      console.log('⚠️ No ResearchGate publications found for:', query);
      return [];
    }

    console.log(`✅ Found ${data.organic_results.length} publications via SerpAPI`);

    return data.organic_results.map((result, index) => ({
      id: `researchgate-${result.result_id || index}`,
      title: result.title,
      authors: result.publication_info?.authors?.map(a => a.name).join(', ') || 
               result.publication_info?.summary?.split(',')[0] || 'Unknown',
      journal: result.publication_info?.summary?.split('-')[0]?.trim() || 'ResearchGate',
      publishedDate: extractYear(result.publication_info?.summary),
      abstract: result.snippet || 'No abstract available',
      source: 'ResearchGate',
      url: result.link,
      citationCount: result.inline_links?.cited_by?.total || 0,
      pdfUrl: result.resources?.find(r => r.file_format === 'PDF')?.link
    }));
  } catch (error) {
    console.error('Error fetching from ResearchGate:', error);
    return [];
  }
}
