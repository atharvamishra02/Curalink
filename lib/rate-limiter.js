// Rate limiter for API calls
// Ensures we don't exceed rate limits (e.g., 1 request per second for SerpAPI)

class RateLimiter {
  constructor(requestsPerSecond = 1) {
    this.minInterval = 1000 / requestsPerSecond; // milliseconds between requests
    this.lastRequestTime = 0;
    this.queue = [];
    this.processing = false;
  }

  async throttle(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minInterval) {
        // Wait for the remaining time
        await new Promise(resolve => 
          setTimeout(resolve, this.minInterval - timeSinceLastRequest)
        );
      }

      const { fn, resolve, reject } = this.queue.shift();
      this.lastRequestTime = Date.now();

      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }
}

// Create a singleton instance for SerpAPI (1 request per second)
export const serpApiLimiter = new RateLimiter(1);

// Create a singleton instance for ORCID (24 requests per second)
export const orcidLimiter = new RateLimiter(24);

// Create a singleton instance for arXiv (3 seconds between requests as per their policy)
export const arxivLimiter = new RateLimiter(0.33); // 1 request per 3 seconds
