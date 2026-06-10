import { cache } from '../lib/redis.js';

async function testRedis() {
  try {
    console.log('Testing Redis connection and caching...');
    
    const testKey = 'test:ping';
    const testVal = { ok: true, msg: 'Hello from local Redis fallback!' };
    
    console.log(`Setting key "${testKey}"...`);
    const setSuccess = await cache.set(testKey, testVal, 10);
    console.log('Set success:', setSuccess);
    
    console.log(`Retrieving key "${testKey}"...`);
    const getVal = await cache.get(testKey);
    console.log('Retrieved value:', getVal);
    
    if (getVal && getVal.ok === true && getVal.msg === testVal.msg) {
      console.log('✅ Redis Cache Test PASSED!');
    } else {
      console.error('❌ Redis Cache Test FAILED! Mismatch or empty value.');
    }
  } catch (error) {
    console.error('❌ Redis Cache Test FAILED with error:', error);
  } finally {
    process.exit(0);
  }
}

testRedis();
