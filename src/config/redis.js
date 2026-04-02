const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  tls: {
    rejectUnauthorized: false, // required for Upstash TLS
  },
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  },
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

module.exports = redis;