import NodeCache from 'node-cache';

// In-memory cache for frequently accessed data (taxonomy, etc.)
export const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Better performance, but be careful with mutations
});

// Cache middleware factory - use for GET endpoints that rarely change
export const cacheMiddleware = (duration = 300) => (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') return next();
  
  const key = `__cache__${req.originalUrl}`;
  const cached = cache.get(key);
  
  if (cached) {
    res.set('X-Cache', 'HIT');
    return res.json(cached);
  }
  
  res.set('X-Cache', 'MISS');
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    cache.set(key, body, duration);
    return originalJson(body);
  };
  next();
};

// Clear cache for specific patterns (useful when data is updated)
export const clearCache = (pattern = null) => {
  if (pattern) {
    const keys = cache.keys().filter(k => k.includes(pattern));
    keys.forEach(k => cache.del(k));
  } else {
    cache.flushAll();
  }
};

