// ORCID Integration
// Documentation: https://info.orcid.org/documentation/api-tutorials/

/**
 * Search ORCID for researchers
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query (name, affiliation, etc.)
 * @param {number} params.limit - Maximum number of results
 * @returns {Promise<Array>} Array of researchers
 */
export async function searchORCID({ query = '', limit = 20 }) {
  try {
    console.log('🆔 ORCID: Searching for researchers...');
    
    const searchUrl = `https://pub.orcid.org/v3.0/search/?q=${encodeURIComponent(query)}&rows=${limit}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`ORCID API error: ${response.status}`);
    }
    
    const data = await response.json();
    const results = data.result || [];
    
    if (results.length === 0) {
      console.log('ℹ️  No ORCID profiles found');
      return [];
    }
    
    // Fetch detailed profiles for each researcher
    const detailedResearchers = await Promise.all(
      results.slice(0, 10).map(async (result) => {
        try {
          const orcidId = result['orcid-identifier']?.path;
          if (!orcidId) return null;
          
          // Fetch full profile
          const profileUrl = `https://pub.orcid.org/v3.0/${orcidId}/record`;
          const profileResponse = await fetch(profileUrl, {
            headers: { 'Accept': 'application/json' }
          });
          
          if (!profileResponse.ok) {
            // Fallback to basic info
            const person = result['person'] || {};
            const name = person.name || {};
            return {
              id: `ORCID:${orcidId}`,
              orcidId,
              name: `${name['given-names']?.value || ''} ${name['family-name']?.value || ''}`.trim() || 'Unknown',
              givenNames: name['given-names']?.value,
              familyName: name['family-name']?.value,
              creditName: name['credit-name']?.value,
              otherNames: [],
              biography: '',
              employments: [],
              educations: [],
              worksCount: 0,
              url: `https://orcid.org/${orcidId}`,
              source: 'ORCID',
              type: 'researcher'
            };
          }
          
          const profileData = await profileResponse.json();
          const person = profileData.person || {};
          const name = person.name || {};
          const biography = person.biography?.content || '';
          
          // Get employment info
          const employments = profileData['activities-summary']?.employments?.['affiliation-group'] || [];
          const currentEmployment = employments[0]?.summaries?.[0]?.['employment-summary'];
          const institution = currentEmployment?.organization?.name || '';
          const role = currentEmployment?.['role-title'] || '';
          
          // Get works count
          const worksCount = profileData['activities-summary']?.works?.group?.length || 0;
          
          // Build comprehensive biography
          let fullBio = biography;
          if (!fullBio && institution) {
            fullBio = `${role ? role + ' at ' : 'Researcher at '}${institution}. `;
          }
          if (worksCount > 0) {
            fullBio += `Published ${worksCount} research works.`;
          }
          
          return {
            id: `ORCID:${orcidId}`,
            orcidId,
            name: name['credit-name']?.value || `${name['given-names']?.value || ''} ${name['family-name']?.value || ''}`.trim() || 'Unknown',
            givenNames: name['given-names']?.value,
            familyName: name['family-name']?.value,
            creditName: name['credit-name']?.value,
            otherNames: person['other-names']?.['other-name']?.map(n => n.content) || [],
            biography: fullBio,
            institution,
            role,
            employments: employments.slice(0, 3),
            educations: profileData['activities-summary']?.educations?.['affiliation-group']?.slice(0, 3) || [],
            worksCount,
            url: `https://orcid.org/${orcidId}`,
            source: 'ORCID',
            type: 'researcher'
          };
        } catch (error) {
          console.error(`Error fetching ORCID profile:`, error);
          return null;
        }
      })
    );
    
    const researchers = detailedResearchers.filter(Boolean);
    
    console.log(`✅ Found ${researchers.length} ORCID profiles`);
    return researchers;
    
  } catch (error) {
    console.error('❌ Error fetching ORCID data:', error.message);
    return [];
  }
}

/**
 * Get detailed ORCID profile
 * @param {string} orcidId - ORCID identifier
 * @returns {Promise<Object|null>} Researcher profile with works
 */
export async function getORCIDProfile(orcidId) {
  try {
    console.log(`🆔 ORCID: Fetching profile ${orcidId}...`);
    
    const profileUrl = `https://pub.orcid.org/v3.0/${orcidId}`;
    
    const response = await fetch(profileUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`ORCID API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract works/publications
    const works = data.activities?.works?.group || [];
    const publications = works.map(work => {
      const summary = work['work-summary']?.[0];
      return {
        title: summary?.title?.title?.value,
        type: summary?.type,
        publicationDate: summary?.['publication-date'],
        url: summary?.url?.value,
        externalIds: summary?.['external-ids']?.['external-id']
      };
    });
    
    return {
      orcidId,
      person: data.person,
      publications,
      employments: data.activities?.employments?.['affiliation-group'] || [],
      educations: data.activities?.educations?.['affiliation-group'] || []
    };
    
  } catch (error) {
    console.error('❌ Error fetching ORCID profile:', error.message);
    return null;
  }
}

/**
 * Fetch researchers from ORCID (alias for searchORCID)
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {number} params.limit - Maximum number of results
 * @returns {Promise<Array>} Array of researchers
 */
export async function fetchResearchersFromORCID({ query = '', limit = 20 }) {
  return searchORCID({ query, limit });
}
