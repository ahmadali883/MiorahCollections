/**
 * Security headers middleware for enhanced application security
 */

const securityHeaders = (req, res, next) => {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.* wss://ws.*",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');

  // Set comprehensive security headers
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Strict Transport Security (HTTPS only)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
};

/**
 * CORS configuration middleware
 */
const corsConfig = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://yourdomain.com',
    // Add your production domains here
  ];

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, x-csrf-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '3600');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

/**
 * Request sanitization middleware
 */
const sanitizeRequest = (req, res, next) => {
  // Remove null bytes from all string inputs
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value.replace(/\0/g, '');
    }
    if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        value[key] = sanitizeValue(value[key]);
      }
    }
    return value;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

/**
 * Request size limiting middleware
 */
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          error: 'REQUEST_TOO_LARGE',
          message: 'Request size exceeds maximum allowed size',
          maxSize: maxSize
        });
      }
    }
    
    next();
  };
};

/**
 * IP filtering middleware
 */
const ipFilter = (options = {}) => {
  const { whitelist = [], blacklist = [], trustProxy = false } = options;
  
  return (req, res, next) => {
    const clientIp = trustProxy ? 
      req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress :
      req.connection.remoteAddress;

    // Check blacklist first
    if (blacklist.length > 0 && blacklist.includes(clientIp)) {
      return res.status(403).json({
        error: 'IP_BLOCKED',
        message: 'Access denied from this IP address'
      });
    }

    // Check whitelist if defined
    if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
      return res.status(403).json({
        error: 'IP_NOT_WHITELISTED',
        message: 'Access denied from this IP address'
      });
    }

    next();
  };
};

/**
 * Request logging middleware with security context
 */
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id || null,
    sessionId: req.sessionID || null
  };

  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//,  // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /exec\s*\(/i, // Command injection
    /eval\s*\(/i, // Code injection
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(req.url) || 
    pattern.test(JSON.stringify(req.body)) ||
    pattern.test(JSON.stringify(req.query))
  );

  if (isSuspicious) {
    console.warn('🚨 Suspicious request detected:', logData);
  }

  // Log response when complete
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    if (res.statusCode >= 400) {
      console.warn('❌ Request failed:', {
        ...logData,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    } else if (process.env.NODE_ENV === 'development') {
      console.log('✅ Request completed:', {
        ...logData,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    }
    
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Brute force protection middleware
 */
const bruteForceProtection = (options = {}) => {
  const { 
    maxAttempts = 5, 
    windowMs = 15 * 60 * 1000, // 15 minutes
    blockDuration = 60 * 60 * 1000 // 1 hour
  } = options;
  
  const attempts = new Map();
  const blockedIps = new Map();

  // Clean up old entries
  setInterval(() => {
    const now = Date.now();
    
    for (const [ip, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(ip);
      }
    }
    
    for (const [ip, blockTime] of blockedIps.entries()) {
      if (now - blockTime > blockDuration) {
        blockedIps.delete(ip);
      }
    }
  }, 5 * 60 * 1000); // Clean every 5 minutes

  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Check if IP is blocked
    if (blockedIps.has(clientIp)) {
      const blockTime = blockedIps.get(clientIp);
      const timeLeft = blockDuration - (now - blockTime);
      
      return res.status(429).json({
        error: 'IP_BLOCKED',
        message: 'Too many failed attempts. IP temporarily blocked.',
        retryAfter: Math.ceil(timeLeft / 1000)
      });
    }

    // Track failed attempts
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      if (res.statusCode === 401 || res.statusCode === 403) {
        let attemptData = attempts.get(clientIp) || {
          count: 0,
          firstAttempt: now
        };
        
        attemptData.count++;
        attempts.set(clientIp, attemptData);
        
        if (attemptData.count >= maxAttempts) {
          blockedIps.set(clientIp, now);
          attempts.delete(clientIp);
          console.warn(`🚨 IP ${clientIp} blocked for ${blockDuration/1000}s after ${maxAttempts} failed attempts`);
        }
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        // Clear attempts on successful request
        attempts.delete(clientIp);
      }
      
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

/**
 * Utility function to parse size strings
 */
const parseSize = (size) => {
  if (typeof size === 'number') return size;
  
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return value * units[unit];
};

/**
 * Combined security middleware
 */
const applySecurity = (app, options = {}) => {
  const {
    enableCors = true,
    enableSizeLimit = true,
    enableBruteForce = true,
    enableIpFilter = false,
    enableSecurityLogger = true,
    maxRequestSize = '10mb',
    ipWhitelist = [],
    ipBlacklist = [],
    bruteForceOptions = {}
  } = options;

  // Apply security headers
  app.use(securityHeaders);

  // Apply CORS if enabled
  if (enableCors) {
    app.use(corsConfig);
  }

  // Apply request sanitization
  app.use(sanitizeRequest);

  // Apply size limiting if enabled
  if (enableSizeLimit) {
    app.use(requestSizeLimit(maxRequestSize));
  }

  // Apply IP filtering if enabled
  if (enableIpFilter) {
    app.use(ipFilter({ whitelist: ipWhitelist, blacklist: ipBlacklist }));
  }

  // Apply brute force protection if enabled
  if (enableBruteForce) {
    app.use(bruteForceProtection(bruteForceOptions));
  }

  // Apply security logging if enabled
  if (enableSecurityLogger) {
    app.use(securityLogger);
  }
};

module.exports = {
  securityHeaders,
  corsConfig,
  sanitizeRequest,
  requestSizeLimit,
  ipFilter,
  securityLogger,
  bruteForceProtection,
  applySecurity
}; 