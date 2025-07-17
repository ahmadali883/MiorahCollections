const crypto = require('crypto');

// In-memory store for rate limiting (use Redis for production)
const rateLimitStore = new Map();

// Rate limit configurations for different endpoints
const RATE_LIMIT_CONFIGS = {
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 registration attempts per hour
    message: 'Too many registration attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  orders: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // limit each IP to 10 order creations per 5 minutes
    message: 'Too many order attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 API requests per windowMs
    message: 'Too many API requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // limit each IP to 20 uploads per hour
    message: 'Too many upload attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }
};

/**
 * Get client identifier (IP address with optional user ID)
 */
const getClientId = (req) => {
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userId = req.user?.id;
  
  // If user is authenticated, use user ID, otherwise use IP
  return userId ? `user:${userId}` : `ip:${ip}`;
};

/**
 * Clean up expired entries from rate limit store
 */
const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 0) {
      rateLimitStore.delete(key);
    }
  }
};

// Clean up expired entries every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Basic rate limiter implementation
 */
const createRateLimiter = (config) => {
  const options = { ...RATE_LIMIT_CONFIGS.default, ...config };
  
  return (req, res, next) => {
    const clientId = getClientId(req);
    const key = `${options.name || 'default'}:${clientId}`;
    const now = Date.now();
    
    // Get or create rate limit data
    let rateLimitData = rateLimitStore.get(key);
    
    if (!rateLimitData || now > rateLimitData.resetTime) {
      // Create new window
      rateLimitData = {
        count: 0,
        resetTime: now + options.windowMs,
        firstRequest: now
      };
    }
    
    // Increment request count
    rateLimitData.count++;
    rateLimitStore.set(key, rateLimitData);
    
    // Calculate remaining requests and reset time
    const remaining = Math.max(0, options.max - rateLimitData.count);
    const resetTime = Math.ceil(rateLimitData.resetTime / 1000);
    
    // Set standard headers
    if (options.standardHeaders) {
      res.set({
        'RateLimit-Limit': options.max,
        'RateLimit-Remaining': remaining,
        'RateLimit-Reset': new Date(rateLimitData.resetTime).toISOString(),
        'RateLimit-Policy': `${options.max};w=${options.windowMs / 1000}`
      });
    }
    
    // Set legacy headers for backward compatibility
    if (options.legacyHeaders) {
      res.set({
        'X-RateLimit-Limit': options.max,
        'X-RateLimit-Remaining': remaining,
        'X-RateLimit-Reset': resetTime
      });
    }
    
    // Check if rate limit exceeded
    if (rateLimitData.count > options.max) {
      const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000);
      
      res.set('Retry-After', retryAfter);
      
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: options.message || 'Too many requests',
        retryAfter: retryAfter,
        limit: options.max,
        windowMs: options.windowMs
      });
    }
    
    next();
  };
};

/**
 * Advanced rate limiter with sliding window
 */
const createSlidingWindowRateLimiter = (config) => {
  const options = { ...RATE_LIMIT_CONFIGS.default, ...config };
  
  return (req, res, next) => {
    const clientId = getClientId(req);
    const key = `sliding:${options.name || 'default'}:${clientId}`;
    const now = Date.now();
    
    // Get request log
    let requestLog = rateLimitStore.get(key) || [];
    
    // Remove requests outside the window
    requestLog = requestLog.filter(timestamp => now - timestamp < options.windowMs);
    
    // Add current request
    requestLog.push(now);
    
    // Store updated log
    rateLimitStore.set(key, requestLog);
    
    // Calculate remaining requests
    const remaining = Math.max(0, options.max - requestLog.length);
    
    // Set headers
    if (options.standardHeaders) {
      res.set({
        'RateLimit-Limit': options.max,
        'RateLimit-Remaining': remaining,
        'RateLimit-Reset': new Date(now + options.windowMs).toISOString(),
        'RateLimit-Policy': `${options.max};w=${options.windowMs / 1000};sliding`
      });
    }
    
    // Check if rate limit exceeded
    if (requestLog.length > options.max) {
      const oldestRequest = requestLog[0];
      const retryAfter = Math.ceil((oldestRequest + options.windowMs - now) / 1000);
      
      res.set('Retry-After', retryAfter);
      
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: options.message || 'Too many requests',
        retryAfter: retryAfter,
        limit: options.max,
        windowMs: options.windowMs,
        type: 'sliding-window'
      });
    }
    
    next();
  };
};

/**
 * Token bucket rate limiter
 */
const createTokenBucketRateLimiter = (config) => {
  const options = { 
    capacity: 10, // bucket capacity
    refillRate: 1, // tokens per second
    ...config 
  };
  
  return (req, res, next) => {
    const clientId = getClientId(req);
    const key = `bucket:${options.name || 'default'}:${clientId}`;
    const now = Date.now();
    
    // Get or create bucket
    let bucket = rateLimitStore.get(key);
    
    if (!bucket) {
      bucket = {
        tokens: options.capacity,
        lastRefill: now
      };
    }
    
    // Refill tokens
    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = timePassed * options.refillRate;
    bucket.tokens = Math.min(options.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    
    // Set headers
    res.set({
      'RateLimit-Limit': options.capacity,
      'RateLimit-Remaining': Math.floor(bucket.tokens),
      'RateLimit-Reset': new Date(now + ((options.capacity - bucket.tokens) / options.refillRate) * 1000).toISOString(),
      'RateLimit-Policy': `${options.capacity};refill=${options.refillRate}`
    });
    
    // Check if enough tokens
    if (bucket.tokens < 1) {
      const retryAfter = Math.ceil((1 - bucket.tokens) / options.refillRate);
      
      res.set('Retry-After', retryAfter);
      
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: options.message || 'Too many requests',
        retryAfter: retryAfter,
        capacity: options.capacity,
        refillRate: options.refillRate,
        type: 'token-bucket'
      });
    }
    
    // Consume token
    bucket.tokens--;
    rateLimitStore.set(key, bucket);
    
    next();
  };
};

/**
 * Adaptive rate limiter that adjusts based on server load
 */
const createAdaptiveRateLimiter = (config) => {
  const options = { 
    baseMax: 100,
    minMax: 10,
    maxMax: 1000,
    loadThreshold: 0.8,
    ...config 
  };
  
  return (req, res, next) => {
    // Simple load calculation (you can replace with actual metrics)
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const load = (memUsage.heapUsed / memUsage.heapTotal) * 0.7 + 
                 (cpuUsage.user / (cpuUsage.user + cpuUsage.system)) * 0.3;
    
    // Adjust max requests based on load
    let adjustedMax = options.baseMax;
    if (load > options.loadThreshold) {
      adjustedMax = Math.max(options.minMax, 
        Math.floor(options.baseMax * (1 - load)));
    } else if (load < options.loadThreshold * 0.5) {
      adjustedMax = Math.min(options.maxMax, 
        Math.floor(options.baseMax * (1 + (options.loadThreshold - load))));
    }
    
    // Use adjusted config
    const adaptiveConfig = { ...options, max: adjustedMax };
    const limiter = createRateLimiter(adaptiveConfig);
    
    limiter(req, res, next);
  };
};

/**
 * IP whitelist bypass
 */
const createWhitelistBypass = (whitelist = []) => {
  const whitelistSet = new Set(whitelist);
  
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    if (whitelistSet.has(clientIp)) {
      return next();
    }
    
    // Continue with normal rate limiting
    next();
  };
};

/**
 * Pre-configured rate limiters
 */
const authRateLimiter = createRateLimiter({
  ...RATE_LIMIT_CONFIGS.auth,
  name: 'auth'
});

const registrationRateLimiter = createRateLimiter({
  ...RATE_LIMIT_CONFIGS.registration,
  name: 'registration'
});

const orderRateLimiter = createRateLimiter({
  ...RATE_LIMIT_CONFIGS.orders,
  name: 'orders'
});

const apiRateLimiter = createRateLimiter({
  ...RATE_LIMIT_CONFIGS.api,
  name: 'api'
});

const uploadRateLimiter = createRateLimiter({
  ...RATE_LIMIT_CONFIGS.upload,
  name: 'upload'
});

const generalRateLimiter = createRateLimiter({
  ...RATE_LIMIT_CONFIGS.default,
  name: 'general'
});

/**
 * Global rate limiter stats
 */
const getRateLimitStats = () => {
  const stats = {
    totalKeys: rateLimitStore.size,
    configs: Object.keys(RATE_LIMIT_CONFIGS),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  return stats;
};

module.exports = {
  createRateLimiter,
  createSlidingWindowRateLimiter,
  createTokenBucketRateLimiter,
  createAdaptiveRateLimiter,
  createWhitelistBypass,
  authRateLimiter,
  registrationRateLimiter,
  orderRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  generalRateLimiter,
  getRateLimitStats,
  RATE_LIMIT_CONFIGS
}; 