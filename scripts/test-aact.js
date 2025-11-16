// Test script for AACT database connection
// Run with: node scripts/test-aact.js

import { testConnection, searchClinicalTrials, getTrialCount } from '../lib/aact.js';

async function runTests() {
  console.log('🧪 Testing AACT Database Connection...\n');

  // Test 1: Connection
  console.log('Test 1: Testing database connection...');
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ Connection failed! Check your credentials in .env');
    process.exit(1);
  }
  console.log('✅ Connection successful!\n');

  // Test 2: Count trials
  console.log('Test 2: Counting cancer trials...');
  try {
    const count = await getTrialCount({ condition: 'cancer' });
    console.log(`✅ Found ${count} cancer trials\n`);
  } catch (error) {
    console.error('❌ Count query failed:', error.message);
  }

  // Test 3: Search trials
  console.log('Test 3: Searching for recruiting diabetes trials...');
  try {
    const trials = await searchClinicalTrials({
      condition: 'diabetes',
      status: 'Recruiting',
      limit: 5
    });
    console.log(`✅ Found ${trials.length} trials:`);
    trials.forEach((trial, index) => {
      console.log(`\n${index + 1}. ${trial.title}`);
      console.log(`   NCT ID: ${trial.nctId}`);
      console.log(`   Status: ${trial.status}`);
      console.log(`   Phase: ${trial.phase || 'N/A'}`);
    });
  } catch (error) {
    console.error('❌ Search query failed:', error.message);
  }

  console.log('\n✅ All tests completed!');
  process.exit(0);
}

runTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
