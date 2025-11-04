import axios from 'axios';
import { cache } from './redis';

const CLINICAL_TRIALS_BASE_URL = 'https://clinicaltrials.gov/api/v2';
const CACHE_TTL = 21600; // 6 hours for clinical trials data

/**
 * Search for clinical trials (simplified for dashboard)
 * @param {Object} params - Search parameters
 * @returns {Promise<Array>} Clinical trials
 */
export async function searchClinicalTrials({
  query = '',
  condition = '',
  status = '',
  phase = '',
  location = '',
  limit = 20,
  pageToken = null,
}) {
  try {
    // Create cache key from search parameters
    const cacheKey = `trials:${condition || query}:${status}:${phase}:${location}:${limit}:${pageToken || 'none'}`;
    
    // Try to get from cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      console.log('✅ Clinical trials retrieved from Redis cache');
      return cachedData;
    }

    console.log('⏳ Fetching clinical trials from API...');
    
    const params = {
      'query.cond': condition || query,
      pageSize: limit,
      format: 'json',
    };

    // Note: ClinicalTrials.gov API v2 has limited filter support
    // We'll do filtering client-side instead to avoid 400 errors
    // if (status) {
    //   params['filter.overallStatus'] = status;
    // }

    // if (phase) {
    //   params['filter.phase'] = phase;
    // }

    if (location) {
      params['query.locn'] = location;
    }

    if (pageToken) {
      params.pageToken = pageToken;
    }

    console.log('API Request params:', params);

    const response = await axios.get(`${CLINICAL_TRIALS_BASE_URL}/studies`, {
      params,
    });

    // Parse and return formatted trials
    const studies = response.data.studies || [];
    const formattedTrials = studies.map(parseClinicalTrial);

    // Store in cache for 6 hours
    await cache.set(cacheKey, formattedTrials, CACHE_TTL);
    console.log('✅ Clinical trials cached in Redis');

    return formattedTrials;
  } catch (error) {
    console.error('Clinical Trials search error:', error);
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
    const response = await axios.get(
      `${CLINICAL_TRIALS_BASE_URL}/studies/${nctId}`,
      {
        params: {
          format: 'json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Clinical Trial details error:', error);
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
    contactEmail: contactsLocationsModule.centralContacts?.[0]?.email,
    contactPhone: contactsLocationsModule.centralContacts?.[0]?.phone,
    startDate: statusModule.startDateStruct?.date,
    completionDate: statusModule.completionDateStruct?.date,
    enrollmentCount: protocolSection.designModule?.enrollmentInfo?.count,
    url: `https://clinicaltrials.gov/study/${identificationModule.nctId}`,
  };
}

/**
 * Get trials by condition with pagination
 * @param {string} condition - Medical condition
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Trials and pagination info
 */
export async function getTrialsByCondition(condition, options = {}) {
  const result = await searchClinicalTrials({
    condition,
    ...options,
  });

  const formattedStudies = result.studies.map(parseClinicalTrial);

  return {
    trials: formattedStudies,
    nextPageToken: result.nextPageToken,
    totalCount: result.totalCount,
  };
}
