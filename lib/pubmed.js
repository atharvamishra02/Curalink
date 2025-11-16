// PubMed/NCBI Integration
// Documentation: https://www.ncbi.nlm.nih.gov/books/NBK25501/

/**
 * Search PubMed for research articles
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {number} params.limit - Maximum number of results
 * @returns {Promise<Array>} Array of publications
 */
export async function searchPubMed({ query = '', limit = 20 }) {
  try {
    console.log('🔬 PubMed: Searching for articles...');
    
    // Step 1: Search for article IDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retmode=json`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    const ids = searchData.esearchresult?.idlist || [];
    
    if (ids.length === 0) {
      console.log('ℹ️  No PubMed articles found');
      return [];
    }
    
    // Step 2: Fetch article details
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    
    const fetchResponse = await fetch(fetchUrl);
    const fetchData = await fetchResponse.json();
    
    // Step 3: Fetch full abstracts for each article
    const detailsPromises = ids.map(async (id) => {
      try {
        const detailUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${id}&retmode=xml`;
        const detailResponse = await fetch(detailUrl);
        const xmlText = await detailResponse.text();
        
        // Extract abstract from XML (simple regex approach)
        const abstractMatch = xmlText.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
        const abstract = abstractMatch ? abstractMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        
        return { id, abstract };
      } catch (error) {
        console.error(`Error fetching details for PMID ${id}:`, error);
        return { id, abstract: '' };
      }
    });
    
    const detailsResults = await Promise.all(detailsPromises);
    const abstractsMap = Object.fromEntries(detailsResults.map(r => [r.id, r.abstract]));
    
    const articles = ids.map(id => {
      const article = fetchData.result?.[id];
      if (!article) return null;
      
      const fullAbstract = abstractsMap[id] || 'No abstract available';
      
      return {
        id: `PMID:${id}`,
        pmid: id,
        title: article.title,
        authors: article.authors?.map(a => a.name).join(', ') || 'Unknown',
        journal: article.fulljournalname || article.source,
        publishDate: article.pubdate,
        abstract: fullAbstract,
        doi: article.elocationid || null,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        source: 'PubMed',
        type: 'publication'
      };
    }).filter(Boolean);
    
    console.log(`✅ Found ${articles.length} PubMed articles`);
    return articles;
    
  } catch (error) {
    console.error('❌ Error fetching PubMed articles:', error.message);
    return [];
  }
}

/**
 * Get researchers by condition (alias for searchPubMed)
 * @param {Object} params - Search parameters
 * @param {string} params.condition - Medical condition
 * @param {number} params.limit - Maximum number of results
 * @returns {Promise<Array>} Array of publications
 */
export async function getResearchersByCondition({ condition = '', limit = 20 }) {
  return searchPubMed({ query: condition, limit });
}

/**
 * Get publications by condition (alias for searchPubMed)
 * @param {Object} params - Search parameters
 * @param {string} params.condition - Medical condition
 * @param {number} params.limit - Maximum number of results
 * @returns {Promise<Array>} Array of publications
 */
export async function getPublicationsByCondition({ condition = '', limit = 20 }) {
  return searchPubMed({ query: condition, limit });
}
