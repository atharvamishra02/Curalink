import axios from 'axios';

const OPENFDA_BASE_URL = 'https://api.fda.gov';
const API_KEY = process.env.OPENFDA_API_KEY;

/**
 * Get base params with API key if available
 * @returns {Object} Base parameters for OpenFDA API
 */
function getBaseParams() {
  const params = {};
  if (API_KEY) {
    params.api_key = API_KEY;
    console.log('Using OpenFDA API key - Rate limit: 1000 req/min');
  } else {
    console.log('No OpenFDA API key - Rate limit: 240 req/min');
  }
  return params;
}

/**
 * Search for drug information
 * @param {string} drugName - Drug name to search
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Drug information
 */
export async function searchDrugInfo(drugName, limit = 10) {
  try {
    const response = await axios.get(`${OPENFDA_BASE_URL}/drug/label.json`, {
      params: {
        ...getBaseParams(),
        search: `openfda.brand_name:"${drugName}" OR openfda.generic_name:"${drugName}"`,
        limit,
      },
    });

    return (response.data.results || []).map(parseDrugLabel);
  } catch (error) {
    console.error('OpenFDA drug search error:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Search for drug adverse events
 * @param {string} drugName - Drug name
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Adverse events
 */
export async function searchAdverseEvents(drugName, limit = 10) {
  try {
    const response = await axios.get(`${OPENFDA_BASE_URL}/drug/event.json`, {
      params: {
        ...getBaseParams(),
        search: `patient.drug.medicinalproduct:"${drugName}"`,
        limit,
      },
    });

    return (response.data.results || []).map(parseAdverseEvent);
  } catch (error) {
    console.error('OpenFDA adverse events error:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Search for drug recalls
 * @param {string} drugName - Drug name
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Recalls
 */
export async function searchDrugRecalls(drugName, limit = 10) {
  try {
    const response = await axios.get(`${OPENFDA_BASE_URL}/drug/enforcement.json`, {
      params: {
        ...getBaseParams(),
        search: `product_description:"${drugName}"`,
        limit,
      },
    });

    return (response.data.results || []).map(parseRecall);
  } catch (error) {
    console.error('OpenFDA recalls error:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Parse drug label data
 * @param {Object} label - Raw label data
 * @returns {Object} Formatted drug information
 */
function parseDrugLabel(label) {
  return {
    brandName: label.openfda?.brand_name?.[0] || 'Unknown',
    genericName: label.openfda?.generic_name?.[0] || 'Unknown',
    manufacturer: label.openfda?.manufacturer_name?.[0] || 'Unknown',
    purpose: label.purpose?.[0] || '',
    warnings: label.warnings?.[0] || '',
    dosage: label.dosage_and_administration?.[0] || '',
    indications: label.indications_and_usage?.[0] || '',
    adverseReactions: label.adverse_reactions?.[0] || '',
    route: label.openfda?.route?.[0] || '',
    productType: label.openfda?.product_type?.[0] || '',
  };
}

/**
 * Parse adverse event data
 * @param {Object} event - Raw event data
 * @returns {Object} Formatted adverse event
 */
function parseAdverseEvent(event) {
  const drug = event.patient?.drug?.[0] || {};
  const reactions = event.patient?.reaction || [];
  
  return {
    drugName: drug.medicinalproduct || 'Unknown',
    reactions: reactions.map(r => r.reactionmeddrapt).filter(Boolean),
    seriousness: event.serious || 0,
    date: event.receivedate || '',
    outcome: event.patient?.reaction?.[0]?.reactionoutcome || '',
    age: event.patient?.patientonsetage || '',
    sex: event.patient?.patientsex || '',
  };
}

/**
 * Parse recall data
 * @param {Object} recall - Raw recall data
 * @returns {Object} Formatted recall
 */
function parseRecall(recall) {
  return {
    productDescription: recall.product_description || '',
    reason: recall.reason_for_recall || '',
    status: recall.status || '',
    recallDate: recall.recall_initiation_date || '',
    classification: recall.classification || '',
    company: recall.recalling_firm || '',
    distribution: recall.distribution_pattern || '',
  };
}

/**
 * Get drug safety information (combines multiple endpoints)
 * @param {string} drugName - Drug name
 * @returns {Promise<Object>} Comprehensive safety information
 */
export async function getDrugSafetyInfo(drugName) {
  try {
    const [drugInfo, adverseEvents, recalls] = await Promise.all([
      searchDrugInfo(drugName, 1),
      searchAdverseEvents(drugName, 5),
      searchDrugRecalls(drugName, 5),
    ]);

    return {
      drug: drugInfo[0] || null,
      adverseEvents,
      recalls,
      safetyScore: calculateSafetyScore(adverseEvents, recalls),
    };
  } catch (error) {
    console.error('Error getting drug safety info:', error);
    return {
      drug: null,
      adverseEvents: [],
      recalls: [],
      safetyScore: null,
    };
  }
}

/**
 * Calculate a simple safety score based on adverse events and recalls
 * @param {Array} adverseEvents - Adverse events
 * @param {Array} recalls - Recalls
 * @returns {Object} Safety score and level
 */
function calculateSafetyScore(adverseEvents, recalls) {
  if (!adverseEvents.length && !recalls.length) {
    return { score: 100, level: 'excellent', color: 'green' };
  }

  const seriousEvents = adverseEvents.filter(e => e.seriousness === 1).length;
  const totalEvents = adverseEvents.length;
  const totalRecalls = recalls.length;

  let score = 100;
  score -= (seriousEvents * 10);
  score -= (totalEvents * 2);
  score -= (totalRecalls * 15);
  score = Math.max(0, Math.min(100, score));

  let level = 'excellent';
  let color = 'green';

  if (score < 90) {
    level = 'good';
    color = 'blue';
  }
  if (score < 70) {
    level = 'moderate';
    color = 'yellow';
  }
  if (score < 50) {
    level = 'concerning';
    color = 'orange';
  }
  if (score < 30) {
    level = 'serious';
    color = 'red';
  }

  return { score, level, color };
}
