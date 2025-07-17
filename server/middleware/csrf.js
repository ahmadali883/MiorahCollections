const crypto = require('crypto');

// Store CSRF tokens in memory (for production, use Redis or database)
const tokenStore = new Map();

// CSRF token configuration
const CSRF_CONFIG = {
  tokenLength: 32,
  tokenExpiry: 60 * 60 * 1000, // 1 hour
  saltLength: 16,
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  exemptMethods: ['GET', 'HEAD', 'OPTIONS'],
  exemptPaths: [
    '/api/auth/login',
    '/api/user',
    '/api/products',
    '/api/categories',
    '/api/orders/guest'
  ]
};

/**
 * Generate a cryptographically secure CSRF token
 */
const generateCSRFToken = () => {
  const token = crypto.randomBytes(CSRF_CONFIG.tokenLength).toString('hex');
  const salt = crypto.randomBytes(CSRF_CONFIG.saltLength).toString('hex');
  const hash = crypto.createHmac('sha256', salt).update(token).digest('hex');
  
  return {
    token,
    salt,
    hash,
    timestamp: Date.now()
  };
};

/**
 * Validate CSRF token
 */
const validateCSRFToken = (token, salt, hash, timestamp) => {
  // Check if token has expired
  if (Date.now() - timestamp > CSRF_CONFIG.tokenExpiry) {
    return false;
  }

  // Validate token hash
  const expectedHash = crypto.createHmac('sha256', salt).update(token).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
};

/**
 * Clean up expired tokens
 */
const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [sessionId, tokenData] of tokenStore.entries()) {
    if (now - tokenData.timestamp > CSRF_CONFIG.tokenExpiry) {
      tokenStore.delete(sessionId);
    }
  }
};

// Clean up expired tokens every 15 minutes
setInterval(cleanupExpiredTokens, 15 * 60 * 1000);

/**
 * Get session ID from request
 */
const getSessionId = (req) => {
  // Use session ID if available, otherwise use user ID, otherwise use IP
  return req.session?.id || 
         req.user?.id || 
         req.ip || 
         req.connection.remoteAddress;
};

/**
 * CSRF Token Generation Middleware
 */
const generateCSRFMiddleware = (req, res, next) => {
  const sessionId = getSessionId(req);
  
  // Generate new token for this session
  const csrfData = generateCSRFToken();
  tokenStore.set(sessionId, csrfData);
  
  // Set token in cookie (httpOnly for security)
  res.cookie(CSRF_CONFIG.cookieName, csrfData.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_CONFIG.tokenExpiry
  });

  // Also provide token in response for SPA usage
  res.locals.csrfToken = csrfData.token;
  
  next();
};

/**
 * CSRF Protection Middleware
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF check for exempt methods
  if (CSRF_CONFIG.exemptMethods.includes(req.method)) {
    return next();
  }

  // Skip CSRF check for exempt paths
  if (CSRF_CONFIG.exemptPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  const sessionId = getSessionId(req);
  const storedTokenData = tokenStore.get(sessionId);
  
  if (!storedTokenData) {
    return res.status(403).json({
      error: 'CSRF_TOKEN_MISSING',
      message: 'CSRF token not found. Please refresh the page.'
    });
  }

  // Get token from header or body
  const submittedToken = req.headers[CSRF_CONFIG.headerName] || 
                        req.body._csrf || 
                        req.query._csrf;

  if (!submittedToken) {
    return res.status(403).json({
      error: 'CSRF_TOKEN_REQUIRED',
      message: 'CSRF token is required for this request.'
    });
  }

  // Validate token
  if (!validateCSRFToken(
    submittedToken, 
    storedTokenData.salt, 
    storedTokenData.hash, 
    storedTokenData.timestamp
  )) {
    return res.status(403).json({
      error: 'CSRF_TOKEN_INVALID',
      message: 'Invalid or expired CSRF token. Please refresh the page.'
    });
  }

  // Token is valid, proceed with request
  next();
};

/**
 * Get CSRF token endpoint
 */
const getCSRFToken = (req, res) => {
  const sessionId = getSessionId(req);
  const tokenData = tokenStore.get(sessionId);
  
  if (!tokenData) {
    // Generate new token if none exists
    const csrfData = generateCSRFToken();
    tokenStore.set(sessionId, csrfData);
    
    return res.json({
      csrfToken: csrfData.token,
      expires: Date.now() + CSRF_CONFIG.tokenExpiry
    });
  }

  res.json({
    csrfToken: tokenData.token,
    expires: tokenData.timestamp + CSRF_CONFIG.tokenExpiry
  });
};

/**
 * Double Submit Cookie Pattern for SPAs
 */
const doubleSubmitCookieProtection = (req, res, next) => {
  // Skip for exempt methods and paths
  if (CSRF_CONFIG.exemptMethods.includes(req.method) || 
      CSRF_CONFIG.exemptPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  const cookieToken = req.cookies[CSRF_CONFIG.cookieName];
  const headerToken = req.headers[CSRF_CONFIG.headerName];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      error: 'CSRF_TOKEN_MISSING',
      message: 'CSRF token is required for this request.'
    });
  }

  // Tokens must match
  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    return res.status(403).json({
      error: 'CSRF_TOKEN_MISMATCH',
      message: 'CSRF token mismatch. Please refresh the page.'
    });
  }

  next();
};

/**
 * Enhanced CSRF middleware with rate limiting
 */
const rateLimitedCSRFProtection = (req, res, next) => {
  const sessionId = getSessionId(req);
  const now = Date.now();
  
  // Rate limiting for failed CSRF attempts
  if (!req.session.csrfAttempts) {
    req.session.csrfAttempts = [];
  }

  // Clean old attempts (older than 15 minutes)
  req.session.csrfAttempts = req.session.csrfAttempts.filter(
    attempt => now - attempt < 15 * 60 * 1000
  );

  // Check if too many failed attempts
  if (req.session.csrfAttempts.length >= 5) {
    return res.status(429).json({
      error: 'TOO_MANY_CSRF_FAILURES',
      message: 'Too many CSRF failures. Please wait before trying again.'
    });
  }

  // Wrap the original CSRF protection
  const originalNext = next;
  const wrappedNext = (error) => {
    if (error && error.statusCode === 403) {
      // Log failed attempt
      req.session.csrfAttempts.push(now);
    }
    originalNext(error);
  };

  csrfProtection(req, res, wrappedNext);
};

module.exports = {
  generateCSRFMiddleware,
  csrfProtection,
  getCSRFToken,
  doubleSubmitCookieProtection,
  rateLimitedCSRFProtection,
  CSRF_CONFIG
}; 