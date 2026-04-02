const redis = require('../config/redis');

const DEFAULT_EXPIRY = 60 * 5; // 5 minutes

const setCache = async (key, data, expiry = DEFAULT_EXPIRY) => {
  try {
    await redis.setex(key, expiry, JSON.stringify(data));
  } catch (err) {
    console.error('Cache set error:', err.message);
  }
};

const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Cache get error:', err.message);
    return null;
  }
};

const deleteCache = async (key) => {
  try {
    await redis.del(key);
  } catch (err) {
    console.error('Cache delete error:', err.message);
  }
};

const deletePattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('Cache pattern delete error:', err.message);
  }
};

module.exports = { setCache, getCache, deleteCache, deletePattern };