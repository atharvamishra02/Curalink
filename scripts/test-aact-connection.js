// Quick test to verify AACT connection
// Run with: node scripts/test-aact-connection.js

import { testConnection } from '../lib/aact.js';

console.log('🧪 Testing AACT Database Connection...\n');
console.log('Credentials:');
console.log('  Username:', process.env.AACT_USERNAME || 'NOT SET');
console.log('  Password:', process.env.AACT_PASSWORD ? '***' + process.env.AACT_PASSWORD.slice(-3) : 'NOT SET');
console.log('');

testConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ SUCCESS! AACT database is connected and working!');
      console.log('Your WHO ICTRP and EU Clinical Trials sources should work now.');
      process.exit(0);
    } else {
      console.log('\n❌ FAILED! Could not connect to AACT database.');
      console.log('Please check your credentials in .env file.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  });
