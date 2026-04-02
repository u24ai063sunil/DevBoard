const Redis = require('ioredis');

const redisConfig = {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  },
};

// Upstash uses rediss:// (with TLS), Docker uses redis:// (no TLS)
if (process.env.REDIS_URL?.startsWith('rediss://')) {
  redisConfig.tls = { rejectUnauthorized: false };
}

const redis = new Redis(process.env.REDIS_URL, redisConfig);

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

module.exports = redis;