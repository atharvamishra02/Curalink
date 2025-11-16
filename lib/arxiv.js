// arXiv Integration
// Documentation: https://info.arxiv.org/help/api/index.html

import { parseStringPromise } from 'xml2js';

/**
 * Search arXiv for preprints and research papers
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {number} params.limit - Maximum number of results
 * @returns {Promise<Array>} Array of publications
 */
export async function searchArXiv({ query = '', limit = 20 }) {
  try {
    console.log('📄 arXiv: Searching for preprints...');
    
    const searchUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${limit}`;
    
    const response = await fetch(searchUrl);
    const xmlData = await response.text();
    
    // Parse XML response
    const result = await parseStringPromise(xmlData);
    const entries = result.feed?.entry || [];
    
    if (entries.length === 0) {
      console.log('ℹ️  No arXiv papers found');
      return [];
    }
    
    const papers = entries.map(entry => {
      const id = entry.id?.[0]?.split('/abs/')?.[1] || '';
      const authors = entry.author?.map(a => a.name?.[0]).join(', ') || 'Unknown';
      
      return {
        id: `arXiv:${id}`,
        arxivId: id,
        title: entry.title?.[0]?.replace(/\n/g, ' ').trim(),
        authors,
        abstract: entry.summary?.[0]?.replace(/\n/g, ' ').trim() || 'No abstract available',
        publishDate: entry.published?.[0],
        updatedDate: entry.updated?.[0],
        categories: entry.category?.map(c => c.$.term).join(', ') || '',
        url: entry.id?.[0],
        pdfUrl: entry.link?.find(l => l.$.title === 'pdf')?.$.href,
        source: 'arXiv',
        type: 'preprint'
      };
    });
    
    console.log(`✅ Found ${papers.length} arXiv papers`);
    return papers;
    
  } catch (error) {
    console.error('❌ Error fetching arXiv papers:', error.message);
    return [];
  }
}

/**
 * Fetch publications from arXiv (alias for searchArXiv)
 * @param {Object} params - Search parameters
 * @param {string} params.condition - Search condition/query
 * @param {number} params.limit - Maximum number of results
 * @returns {Promise<Array>} Array of publications
 */
export async function fetchPublicationsFromArXiv({ condition = '', limit = 20 }) {
  return searchArXiv({ query: condition, limit });
}
