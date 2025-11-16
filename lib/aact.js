// AACT (Aggregate Analysis of ClinicalTrials.gov) Database Integration
// Documentation: https://aact.ctti-clinicaltrials.org/

import { Pool } from 'pg';

// Create a connection pool to AACT database
let pool = null;

function getPool() {
  if (!pool) {
    // Check if using local database or remote
    const useLocal = process.env.AACT_LOCAL === 'true';
    
    if (useLocal) {
      console.log('🏠 Using local AACT database');
      pool = new Pool({
        host: process.env.AACT_LOCAL_HOST || 'localhost',
        port: parseInt(process.env.AACT_LOCAL_PORT || '5432'),
        database: process.env.AACT_LOCAL_DATABASE || 'aact_local',
        user: process.env.AACT_LOCAL_USER || 'postgres',
        password: process.env.AACT_LOCAL_PASSWORD,
        max: 20, // More connections for local database
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    } else {
      console.log('☁️  Using remote AACT database');
      pool = new Pool({
        host: 'aact-db.ctti-clinicaltrials.org',
        port: 5432,
        database: 'aact',
        user: process.env.AACT_USERNAME,
        password: process.env.AACT_PASSWORD,
        ssl: {
          rejectUnauthorized: false // AACT uses self-signed certificates
        },
        max: 10, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    }

    pool.on('error', (err) => {
      console.error('Unexpected error on idle AACT client', err);
    });
  }
  return pool;
}

/**
 * Search clinical trials from AACT database
 * @param {Object} params - Search parameters
 * @param {string} params.condition - Medical condition to search for
 * @param {string} params.status - Trial status (e.g., 'Recruiting', 'Active, not recruiting')
 * @param {string} params.phase - Trial phase (e.g., 'Phase 1', 'Phase 2')
 * @param {string} params.location - Location/country
 * @param {number} params.limit - Maximum number of results
 * @param {number} params.offset - Offset for pagination
 * @returns {Promise<Array>} Array of clinical trials
 */
export async function searchClinicalTrials({
  condition = '',
  status = '',
  phase = '',
  location = '',
  limit = 50,
  offset = 0
}) {
  const client = await getPool().connect();
  
  try {
    // Build the WHERE clause dynamically
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Search in conditions table for disease/condition
    if (condition) {
      conditions.push(`EXISTS (
        SELECT 1 FROM conditions c 
        WHERE c.nct_id = s.nct_id 
        AND LOWER(c.name) LIKE LOWER($${paramIndex})
      )`);
      params.push(`%${condition}%`);
      paramIndex++;
    }

    // Filter by overall status
    if (status) {
      conditions.push(`s.overall_status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Filter by phase
    if (phase) {
      conditions.push(`s.phase LIKE $${paramIndex}`);
      params.push(`%${phase}%`);
      paramIndex++;
    }

    // Filter by location (country or facility)
    if (location) {
      conditions.push(`EXISTS (
        SELECT 1 FROM facilities f 
        WHERE f.nct_id = s.nct_id 
        AND (LOWER(f.country) LIKE LOWER($${paramIndex}) OR LOWER(f.city) LIKE LOWER($${paramIndex}))
      )`);
      params.push(`%${location}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    // Main query - fetch studies with key information
    const query = `
      SELECT 
        s.nct_id,
        s.brief_title,
        s.official_title,
        s.overall_status,
        s.phase,
        s.enrollment,
        s.study_type,
        s.start_date,
        s.completion_date,
        s.last_update_posted_date,
        s.study_first_posted_date,
        bd.description as brief_summary,
        bd.detailed_description,
        de.gender,
        de.minimum_age,
        de.maximum_age,
        de.healthy_volunteers,
        (
          SELECT STRING_AGG(DISTINCT c.name, ', ')
          FROM conditions c
          WHERE c.nct_id = s.nct_id
          LIMIT 10
        ) as conditions,
        (
          SELECT STRING_AGG(DISTINCT i.intervention_type || ': ' || i.name, '; ')
          FROM interventions i
          WHERE i.nct_id = s.nct_id
          LIMIT 5
        ) as interventions,
        (
          SELECT STRING_AGG(DISTINCT f.name || ' (' || f.city || ', ' || f.country || ')', '; ')
          FROM facilities f
          WHERE f.nct_id = s.nct_id
          LIMIT 5
        ) as locations,
        (
          SELECT STRING_AGG(DISTINCT sp.name, ', ')
          FROM sponsors sp
          WHERE sp.nct_id = s.nct_id AND sp.lead_or_collaborator = 'lead'
          LIMIT 3
        ) as sponsors
      FROM studies s
      LEFT JOIN brief_summaries bd ON s.nct_id = bd.nct_id
      LEFT JOIN detailed_descriptions dd ON s.nct_id = dd.nct_id
      LEFT JOIN eligibilities de ON s.nct_id = de.nct_id
      ${whereClause}
      ORDER BY s.last_update_posted_date DESC NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    console.log('🔍 AACT Query:', query);
    console.log('📊 Parameters:', params);

    const result = await client.query(query, params);

    // Transform results to match our application format
    const trials = result.rows.map(row => ({
      nctId: row.nct_id,
      title: row.brief_title || row.official_title,
      officialTitle: row.official_title,
      status: row.overall_status,
      phase: row.phase,
      enrollment: row.enrollment,
      studyType: row.study_type,
      startDate: row.start_date,
      completionDate: row.completion_date,
      lastUpdatePosted: row.last_update_posted_date,
      firstPosted: row.study_first_posted_date,
      briefSummary: row.brief_summary,
      detailedDescription: row.detailed_description,
      conditions: row.conditions ? row.conditions.split(', ') : [],
      interventions: row.interventions ? row.interventions.split('; ') : [],
      locations: row.locations ? row.locations.split('; ') : [],
      sponsors: row.sponsors ? row.sponsors.split(', ') : [],
      eligibility: {
        gender: row.gender,
        minimumAge: row.minimum_age,
        maximumAge: row.maximum_age,
        healthyVolunteers: row.healthy_volunteers
      },
      url: `https://clinicaltrials.gov/study/${row.nct_id}`,
      source: 'AACT'
    }));

    console.log(`✅ Found ${trials.length} trials from AACT database`);
    return trials;

  } catch (error) {
    console.error('❌ Error querying AACT database:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get total count of trials matching criteria
 */
export async function getTrialCount({ condition = '', status = '', phase = '', location = '' }) {
  const client = await getPool().connect();
  
  try {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (condition) {
      conditions.push(`EXISTS (
        SELECT 1 FROM conditions c 
        WHERE c.nct_id = s.nct_id 
        AND LOWER(c.name) LIKE LOWER($${paramIndex})
      )`);
      params.push(`%${condition}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`s.overall_status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (phase) {
      conditions.push(`s.phase LIKE $${paramIndex}`);
      params.push(`%${phase}%`);
      paramIndex++;
    }

    if (location) {
      conditions.push(`EXISTS (
        SELECT 1 FROM facilities f 
        WHERE f.nct_id = s.nct_id 
        AND (LOWER(f.country) LIKE LOWER($${paramIndex}) OR LOWER(f.city) LIKE LOWER($${paramIndex}))
      )`);
      params.push(`%${location}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    const query = `
      SELECT COUNT(*) as total
      FROM studies s
      ${whereClause}
    `;

    const result = await client.query(query, params);
    return parseInt(result.rows[0].total);

  } catch (error) {
    console.error('Error getting trial count:', error);
    return 0;
  } finally {
    client.release();
  }
}

/**
 * Get detailed information for a specific trial
 */
export async function getTrialDetails(nctId) {
  const client = await getPool().connect();
  
  try {
    const query = `
      SELECT 
        s.*,
        bd.description as brief_summary,
        dd.description as detailed_description,
        de.*
      FROM studies s
      LEFT JOIN brief_summaries bd ON s.nct_id = bd.nct_id
      LEFT JOIN detailed_descriptions dd ON s.nct_id = dd.nct_id
      LEFT JOIN eligibilities de ON s.nct_id = de.nct_id
      WHERE s.nct_id = $1
    `;

    const result = await client.query(query, [nctId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];

  } catch (error) {
    console.error('Error getting trial details:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    const client = await getPool().connect();
    const result = await client.query('SELECT COUNT(*) as total FROM studies');
    client.release();
    
    console.log(`✅ AACT Database connected successfully! Total studies: ${result.rows[0].total}`);
    return true;
  } catch (error) {
    console.error('❌ AACT Database connection failed:', error.message);
    return false;
  }
}

// Close the pool when the application shuts down
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
