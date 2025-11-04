import axios from 'axios';
import { cache } from './redis';

const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const API_KEY = process.env.PUBMED_API_KEY;
const CACHE_TTL = 21600; // 6 hours for PubMed data

/**
 * Get base params with API key if available
 * @returns {Object} Base parameters for PubMed API
 */
function getBaseParams() {
  const params = {};
  if (API_KEY) {
    params.api_key = API_KEY;
    console.log('Using PubMed API key - Rate limit: 10 req/sec');
  } else {
    console.log('No PubMed API key - Rate limit: 3 req/sec');
  }
  return params;
}

/**
 * Search PubMed for publications
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} Array of publication IDs
 */
export async function searchPubMed(query, maxResults = 20) {
  try {
    // Create cache key from query
    const cacheKey = `pubmed:search:${query}:${maxResults}`;
    
    // Try to get from cache first
    const cachedIds = await cache.get(cacheKey);
    if (cachedIds) {
      console.log('✅ PubMed IDs retrieved from Redis cache');
      return cachedIds;
    }

    console.log('⏳ Fetching PubMed IDs from API...');
    
    const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi`;
    
    // Clean and format the query - replace spaces with + for better compatibility
    const formattedQuery = query.trim().replace(/\s+/g, '+');
    console.log('Searching PubMed for:', formattedQuery);
    
    const response = await axios.get(searchUrl, {
      params: {
        ...getBaseParams(),
        db: 'pubmed',
        term: formattedQuery,
        retmax: maxResults,
        retmode: 'json',
        sort: 'relevance',
      },
      timeout: 15000, // 15 second timeout
      validateStatus: function (status) {
        return status < 500; // Resolve only if status is less than 500
      }
    });

    // Check if we got a 500 error even though axios didn't throw
    if (response.status >= 500) {
      console.log('PubMed returned 500 error, returning empty results');
      return [];
    }

    const ids = response.data.esearchresult?.idlist || [];
    console.log(`PubMed search found ${ids.length} results for: ${formattedQuery}`);
    
    // Store in cache for 6 hours
    await cache.set(cacheKey, ids, CACHE_TTL);
    console.log('✅ PubMed IDs cached in Redis');
    
    return ids;
  } catch (error) {
    console.error('PubMed search error:', error.message);
    console.log('Returning empty results due to PubMed error');
    // Return empty array instead of throwing
    return [];
  }
}


/**
 * Fetch publication details from PubMed with retry logic
 * @param {string[]} ids - Array of PubMed IDs
 * @returns {Promise<Array>} Array of publication details
 */
export async function fetchPubMedDetails(ids) {
  if (!ids || ids.length === 0) return [];
  
  // Create cache key from IDs
  const cacheKey = `pubmed:details:${ids.sort().join(',')}`;
  
  // Try to get from cache first
  const cachedDetails = await cache.get(cacheKey);
  if (cachedDetails) {
    console.log('✅ PubMed details retrieved from Redis cache');
    return cachedDetails;
  }

  console.log('⏳ Fetching PubMed details from API...');
  
  const maxRetries = 2;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi`;
      const response = await axios.get(fetchUrl, {
        params: {
          ...getBaseParams(),
          db: 'pubmed',
          id: ids.join(','),
          retmode: 'xml',
        },
        timeout: 10000, // 10 second timeout
      });

      // Parse XML response
      const publications = parsePubMedXML(response.data);
      
      // Store in cache for 6 hours
      await cache.set(cacheKey, publications, CACHE_TTL);
      console.log('✅ PubMed details cached in Redis');
      
      return publications;
    } catch (error) {
      lastError = error;
      console.error(`PubMed fetch error (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  console.error('PubMed fetch failed after all retries:', lastError?.message);
  return [];
}

/**
 * Parse PubMed XML response (simplified version)
 * In production, use a proper XML parser like fast-xml-parser
 */
function parsePubMedXML(xmlData) {
  // This is a simplified parser. In production, use fast-xml-parser
  const publications = [];
  
  // Basic regex parsing (replace with proper XML parser)
  const articleMatches = xmlData.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
  
  articleMatches.forEach((article) => {
    try {
      const titleMatch = article.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/);
      const abstractMatch = article.match(/<AbstractText.*?>(.*?)<\/AbstractText>/);
      const pmidMatch = article.match(/<PMID.*?>(.*?)<\/PMID>/);
      const journalMatch = article.match(/<Title>(.*?)<\/Title>/);
      
      // Extract authors
      const authorMatches = article.match(/<Author.*?>[\s\S]*?<\/Author>/g) || [];
      const authors = authorMatches.slice(0, 5).map(author => {
        const lastNameMatch = author.match(/<LastName>(.*?)<\/LastName>/);
        const foreNameMatch = author.match(/<ForeName>(.*?)<\/ForeName>/);
        const affiliationMatch = author.match(/<Affiliation>(.*?)<\/Affiliation>/);
        
        return {
          lastName: lastNameMatch ? lastNameMatch[1] : '',
          foreName: foreNameMatch ? foreNameMatch[1] : '',
          affiliation: affiliationMatch ? affiliationMatch[1] : '',
          fullName: `${foreNameMatch ? foreNameMatch[1] : ''} ${lastNameMatch ? lastNameMatch[1] : ''}`.trim()
        };
      });
      
      publications.push({
        id: pmidMatch ? `pmid-${pmidMatch[1]}` : `pub-${Date.now()}-${Math.random()}`, // Add id field
        title: titleMatch ? titleMatch[1] : 'No title',
        abstract: abstractMatch ? abstractMatch[1].replace(/<[^>]*>/g, '') : '',
        pmid: pmidMatch ? pmidMatch[1] : '',
        journal: journalMatch ? journalMatch[1] : '',
        url: pmidMatch ? `https://pubmed.ncbi.nlm.nih.gov/${pmidMatch[1]}/` : '',
        authors: authors,
      });
    } catch (e) {
      console.error('Error parsing article:', e);
    }
  });
  
  return publications;
}

/**
 * Search for publications by condition
 * @param {string} condition - Medical condition
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} Publications
 */
export async function getPublicationsByCondition(condition, limit = 20) {
  const ids = await searchPubMed(condition, limit);
  if (ids.length === 0) return [];
  
  const publications = await fetchPubMedDetails(ids);
  return publications;
}

/**
 * Get researchers/authors by medical condition from PubMed
 * @param {string} condition - Medical condition
 * @param {number} limit - Number of publications to search
 * @returns {Promise<Array>} Array of unique researchers
 */
export async function getResearchersByCondition(condition, limit = 50) {
  try {
    console.log('Fetching researchers for condition:', condition);
    const publications = await getPublicationsByCondition(condition, limit);
    
    // Extract unique researchers from publications
    const researchersMap = new Map();
    
    publications.forEach(pub => {
      if (pub.authors && pub.authors.length > 0) {
        pub.authors.forEach(author => {
          if (author.fullName && author.fullName.trim()) {
            const key = author.fullName.toLowerCase();
            
            if (!researchersMap.has(key)) {
              // Extract location from affiliation if available
              let location = 'Not specified';
              if (author.affiliation) {
                // Try multiple patterns to extract location
                // Pattern 1: City, State/Country (e.g., "Boston, MA" or "London, UK")
                let locationMatch = author.affiliation.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2,})/);
                if (locationMatch) {
                  location = `${locationMatch[1]}, ${locationMatch[2]}`;
                } else {
                  // Pattern 2: Just country name (USA, Canada, India, etc.)
                  const countries = ['USA', 'UK', 'Canada', 'India', 'China', 'Japan', 'Germany', 'France', 'Italy', 'Spain', 'Australia', 'Brazil', 'Mexico', 'Netherlands', 'Switzerland', 'Sweden', 'Denmark', 'Norway'];
                  for (const country of countries) {
                    if (author.affiliation.includes(country)) {
                      location = country;
                      break;
                    }
                  }
                  
                  // Pattern 3: State abbreviations (CA, NY, TX, etc.)
                  if (location === 'Not specified') {
                    const stateMatch = author.affiliation.match(/\b([A-Z]{2})\b/);
                    if (stateMatch) {
                      location = `USA, ${stateMatch[1]}`;
                    }
                  }
                }
              }
              
              researchersMap.set(key, {
                id: `researcher-${key.replace(/\s+/g, '-')}`,
                name: author.fullName,
                specialization: condition,
                affiliation: author.affiliation || 'Not specified',
                location: location,
                publicationCount: 1,
                publications: [pub.title],
                verified: true,
                avatar: null, // Can be added later
                isInternalResearcher: false, // Flag for external researchers
                source: 'PubMed',
              });
            } else {
              // Increment publication count for existing researcher
              const researcher = researchersMap.get(key);
              researcher.publicationCount += 1;
              if (researcher.publications.length < 5) {
                researcher.publications.push(pub.title);
              }
            }
          }
        });
      }
    });
    
    // Convert map to array and sort by publication count
    const researchers = Array.from(researchersMap.values())
      .sort((a, b) => b.publicationCount - a.publicationCount);
    
    console.log(`Found ${researchers.length} unique researchers for ${condition}`);
    return researchers;
  } catch (error) {
    console.error('Error fetching researchers:', error);
    return [];
  }
}
