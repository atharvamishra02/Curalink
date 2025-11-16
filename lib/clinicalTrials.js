import axios from 'axios';
import { cache } from './redis';

const CLINICAL_TRIALS_BASE_URL = 'https://clinicaltrials.gov/api/v2';
const CACHE_TTL = 21600; // 6 hours for clinical trials data

/**
 * Search for clinical trials using ClinicalTrials.gov v2 API
 * @param {Object} params - Search parameters
 * @returns {Promise<Array>} Clinical trials
 */
export async function searchClinicalTrials({
  query = '',
  condition = '',
  intervention = '',
  status = '',
  phase = '',
  location = '',
  sponsor = '',
  nctIds = [],
  limit = 20,
  pageToken = null,
}) {
  try {
    // Create cache key from search parameters
    const cacheKey = `trials:${condition || query}:${intervention}:${status}:${phase}:${location}:${sponsor}:${nctIds.join(',')}:${limit}:${pageToken || 'none'}`;
    
    // Try to get from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      console.log('✅ Clinical trials retrieved from Redis cache');
      return cachedData;
    }

    console.log('⏳ Fetching clinical trials from ClinicalTrials.gov API v2...');
    
    const params = {
      format: 'json',
      pageSize: limit,
      // Keep it simple - don't use fields parameter as it might cause issues
      // sort: 'LastUpdatePostDate:desc',
      // countTotal: true,
    };

    // Handle NCT ID filtering
    if (nctIds && nctIds.length > 0) {
      // If NCT IDs are the only criteria, use query.id for fast lookup
      if (!condition && !query && !intervention && !location) {
        params['query.id'] = nctIds.join(',');
      } else {
        // If combined with other filters, use filter.ids for intersection
        params['filter.ids'] = nctIds.join(',');
      }
    }

    // Build query parameters
    if (condition) {
      params['query.cond'] = condition;
    } else if (query) {
      params['query.term'] = query;
    }

    if (intervention) {
      params['query.intr'] = intervention;
    }

    if (location) {
      params['query.locn'] = location;
    }

    if (sponsor) {
      params['query.spons'] = sponsor;
    }

    // Build filter parameters - only add if explicitly specified
    if (status) {
      // Convert our status format to API format
      const apiStatus = status.toUpperCase().replace(/_/g, '_');
      params['filter.overallStatus'] = apiStatus;
    }

    // Handle phase filtering
    if (phase) {
      // Convert phase format: PHASE_1 -> "PHASE1" for API
      let phaseQuery = phase.replace(/_/g, '');
      if (phase === 'EARLY_PHASE_1') {
        phaseQuery = 'EARLY_PHASE1';
      } else if (phase === 'NOT_APPLICABLE') {
        phaseQuery = 'NA';
      }
      params['filter.phase'] = phaseQuery;
    }

    if (pageToken) {
      params.pageToken = pageToken;
    }

    console.log('ClinicalTrials.gov API Request params:', params);
    
    const url = `${CLINICAL_TRIALS_BASE_URL}/studies`;
    console.log('Making request to:', url);

    const response = await axios.get(url, {
      params,
      timeout: 10000, // 10 second timeout
    });
    
    console.log('ClinicalTrials.gov API Response status:', response.status);

    // Parse and return formatted trials
    const studies = response.data.studies || [];
    const formattedTrials = studies.map(parseClinicalTrial);

    console.log(`✅ Fetched ${formattedTrials.length} trials from ClinicalTrials.gov`);

    // Store in cache for 6 hours
    await cache.set(cacheKey, formattedTrials, CACHE_TTL);
    console.log('✅ Clinical trials cached in Redis');

    return formattedTrials;
  } catch (error) {
    if (error.response) {
      console.error('ClinicalTrials.gov API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('ClinicalTrials.gov API - No response received:', error.message);
    } else {
      console.error('ClinicalTrials.gov API Error:', error.message);
    }
    return [];
  }
}

/**
 * Get clinical trial details by NCT ID
 * @param {string} nctId - NCT ID
 * @returns {Promise<Object>} Trial details
 */
export async function getClinicalTrialDetails(nctId) {
  try {
    // Check cache first
    const cacheKey = `trial:details:${nctId}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      console.log('✅ Trial details retrieved from Redis cache');
      return cachedData;
    }

    console.log(`⏳ Fetching trial details for ${nctId}...`);
    
    const response = await axios.get(
      `${CLINICAL_TRIALS_BASE_URL}/studies/${nctId}`,
      {
        params: {
          format: 'json',
        },
        timeout: 10000,
      }
    );

    const trialData = response.data;
    
    // Cache for 24 hours (trial details don't change frequently)
    await cache.set(cacheKey, trialData, 86400);
    console.log('✅ Trial details cached in Redis');

    return trialData;
  } catch (error) {
    if (error.response) {
      console.error('ClinicalTrials.gov API Error:', error.response.status, error.response.data);
    } else {
      console.error('Clinical Trial details error:', error.message);
    }
    return null;
  }
}

/**
 * Parse clinical trial data into our format
 * @param {Object} trial - Raw trial data from API
 * @returns {Object} Formatted trial data
 */
export function parseClinicalTrial(trial) {
  const protocolSection = trial.protocolSection || {};
  const identificationModule = protocolSection.identificationModule || {};
  const statusModule = protocolSection.statusModule || {};
  const descriptionModule = protocolSection.descriptionModule || {};
  const conditionsModule = protocolSection.conditionsModule || {};
  const contactsLocationsModule = protocolSection.contactsLocationsModule || {};
  const eligibilityModule = protocolSection.eligibilityModule || {};
  const sponsorCollaboratorsModule = protocolSection.sponsorCollaboratorsModule || {};

  // Get first location if available
  const firstLocation = contactsLocationsModule.locations?.[0];
  const locationStr = firstLocation 
    ? `${firstLocation.city || ''}, ${firstLocation.state || ''}, ${firstLocation.country || ''}`.replace(/, ,/g, ',').trim()
    : 'Location not specified';

  return {
    id: identificationModule.nctId || `trial-${Date.now()}-${Math.random()}`, // Add id field using nctId
    nctId: identificationModule.nctId,
    title: identificationModule.officialTitle || identificationModule.briefTitle || 'Untitled Study',
    description: descriptionModule.briefSummary || 'No description available',
    summary: descriptionModule.detailedDescription || descriptionModule.briefSummary || 'No summary available',
    status: statusModule.overallStatus || 'Unknown',
    phase: statusModule.phase || 'Not specified',
    conditions: conditionsModule.conditions || [],
    interventions: protocolSection.armsInterventionsModule?.interventions?.map(i => i.name) || [],
    eligibilityCriteria: eligibilityModule.eligibilityCriteria,
    location: locationStr,
    locations: contactsLocationsModule.locations || [],
    sponsor: sponsorCollaboratorsModule.leadSponsor?.name || 'Not specified',
    leadSponsor: sponsorCollaboratorsModule.leadSponsor?.name || 'Not specified',
    principalInvestigator: contactsLocationsModule.centralContacts?.[0]?.name || 'Not specified',
    contactEmail: contactsLocationsModule.centralContacts?.[0]?.email,
    contactPhone: contactsLocationsModule.centralContacts?.[0]?.phone,
    startDate: statusModule.startDateStruct?.date,
    completionDate: statusModule.completionDateStruct?.date,
    enrollmentCount: protocolSection.designModule?.enrollmentInfo?.count,
    url: `https://clinicaltrials.gov/study/${identificationModule.nctId}`,
    source: 'ClinicalTrials.gov',
    type: 'trial'
  };
}

/**
 * Get trials by condition with pagination
 * @param {string} condition - Medical condition
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Trials and pagination info
 */
export async function getTrialsByCondition(condition, options = {}) {
  const trials = await searchClinicalTrials({
    condition,
    ...options,
  });

  return {
    trials,
    // Note: v2 API pagination is handled differently
    // nextPageToken would need to be extracted from response headers
  };
}

/**
 * Get multiple trials by NCT IDs
 * @param {Array<string>} nctIds - Array of NCT IDs
 * @returns {Promise<Array>} Clinical trials
 */
export async function getTrialsByIds(nctIds) {
  if (!nctIds || nctIds.length === 0) {
    return [];
  }

  try {
    return await searchClinicalTrials({
      nctIds,
      limit: nctIds.length,
    });
  } catch (error) {
    console.error('Error fetching trials by IDs:', error);
    return [];
  }
}
