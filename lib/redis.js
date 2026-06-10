import { Redis } from '@upstash/redis';
import IoRedis from 'ioredis';

let redisClient;
let isUpstash = false;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  isUpstash = true;
  console.log('Redis Client Initialized with Upstash');
} else {
  // Fallback to local Redis via ioredis
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  redisClient = new IoRedis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('Local Redis retry limit reached, disabling retries.');
        return null; // stop retrying
      }
      return Math.min(times * 100, 2000);
    }
  });
  
  redisClient.on('error', (err) => {
    console.error('Local Redis Connection Error:', err.message);
  });
  
  redisClient.on('connect', () => {
    console.log('Connected to Local Redis');
  });

  isUpstash = false;
  console.log(`Redis Client Initialized with Local Redis at ${redisUrl}`);
}

// Cache utilities
export const cache = {
  async get(key) {
    try {
      if (isUpstash) {
        const data = await redisClient.get(key);
        return data;
      } else {
        const data = await redisClient.get(key);
        if (!data) return null;
        try {
          return JSON.parse(data);
        } catch {
          return data; // Return raw string if not valid JSON
        }
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, value, expirationInSeconds = 3600) {
    try {
      if (isUpstash) {
        await redisClient.set(key, value, { ex: expirationInSeconds });
      } else {
        const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
        if (expirationInSeconds) {
          await redisClient.set(key, serializedValue, 'EX', expirationInSeconds);
        } else {
          await redisClient.set(key, serializedValue);
        }
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  async clear(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  },
};

export default redisClient;

