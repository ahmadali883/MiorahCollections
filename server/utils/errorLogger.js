const fs = require('fs');
const path = require('path');

/**
 * Enhanced error logging system
 */

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Log categories
const LOG_CATEGORIES = {
  SECURITY: 'SECURITY',
  API: 'API',
  AUTH: 'AUTH',
  DATABASE: 'DATABASE',
  VALIDATION: 'VALIDATION',
  RATE_LIMIT: 'RATE_LIMIT',
  CSRF: 'CSRF',
  SYSTEM: 'SYSTEM',
  USER: 'USER'
};

/**
 * Format log entry
 */
const formatLogEntry = (level, category, message, metadata = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    category,
    message,
    metadata: {
      ...metadata,
      pid: process.pid,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    }
  };

  return JSON.stringify(logEntry) + '\n';
};

/**
 * Write to log file
 */
const writeToLogFile = (filename, content) => {
  const logFilePath = path.join(logsDir, filename);
  
  try {
    fs.appendFileSync(logFilePath, content);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
};

/**
 * Rotate log files
 */
const rotateLogFile = (filename, maxSize = 10 * 1024 * 1024) => { // 10MB default
  const logFilePath = path.join(logsDir, filename);
  
  try {
    const stats = fs.statSync(logFilePath);
    if (stats.size > maxSize) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveFilename = `${filename}.${timestamp}`;
      fs.renameSync(logFilePath, path.join(logsDir, archiveFilename));
    }
  } catch (error) {
    // File doesn't exist or other error, continue
  }
};

/**
 * Main logging function
 */
const log = (level, category, message, metadata = {}) => {
  const logEntry = formatLogEntry(level, category, message, metadata);
  
  // Console output with colors
  const colors = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[35m'  // Magenta
  };
  
  const reset = '\x1b[0m';
  const color = colors[level] || reset;
  
  console.log(`${color}[${level}]${reset} ${category}: ${message}`, 
    Object.keys(metadata).length > 0 ? metadata : '');
  
  // Write to appropriate log file
  const filename = `${category.toLowerCase()}.log`;
  rotateLogFile(filename);
  writeToLogFile(filename, logEntry);
  
  // Write to general log file
  rotateLogFile('app.log');
  writeToLogFile('app.log', logEntry);
  
  // Write errors to separate error file
  if (level === LOG_LEVELS.ERROR) {
    rotateLogFile('errors.log');
    writeToLogFile('errors.log', logEntry);
  }
};

/**
 * Specific logging functions
 */
const logError = (category, message, metadata = {}) => {
  log(LOG_LEVELS.ERROR, category, message, metadata);
};

const logWarning = (category, message, metadata = {}) => {
  log(LOG_LEVELS.WARN, category, message, metadata);
};

const logInfo = (category, message, metadata = {}) => {
  log(LOG_LEVELS.INFO, category, message, metadata);
};

const logDebug = (category, message, metadata = {}) => {
  if (process.env.NODE_ENV === 'development') {
    log(LOG_LEVELS.DEBUG, category, message, metadata);
  }
};

/**
 * Security-specific logging
 */
const logSecurityEvent = (event, details = {}) => {
  logError(LOG_CATEGORIES.SECURITY, `Security event: ${event}`, details);
};

const logAuthEvent = (event, userId, details = {}) => {
  logInfo(LOG_CATEGORIES.AUTH, `Auth event: ${event}`, { userId, ...details });
};

const logAPIEvent = (method, endpoint, statusCode, duration, details = {}) => {
  const level = statusCode >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
  log(level, LOG_CATEGORIES.API, `${method} ${endpoint} - ${statusCode}`, {
    statusCode,
    duration,
    ...details
  });
};

const logRateLimitEvent = (clientId, endpoint, details = {}) => {
  logWarning(LOG_CATEGORIES.RATE_LIMIT, `Rate limit exceeded: ${clientId} - ${endpoint}`, details);
};

const logCSRFEvent = (event, clientId, details = {}) => {
  logWarning(LOG_CATEGORIES.CSRF, `CSRF event: ${event} - ${clientId}`, details);
};

const logDatabaseEvent = (operation, collection, details = {}) => {
  logInfo(LOG_CATEGORIES.DATABASE, `Database ${operation} on ${collection}`, details);
};

const logValidationError = (field, value, error, details = {}) => {
  logWarning(LOG_CATEGORIES.VALIDATION, `Validation error on ${field}: ${error}`, {
    field,
    value: typeof value === 'string' ? value.substring(0, 100) : value,
    error,
    ...details
  });
};

/**
 * Error aggregation and analysis
 */
const errorStats = new Map();

const trackError = (error, context = {}) => {
  const errorKey = `${error.name || 'UnknownError'}_${error.message || 'No message'}`;
  
  if (!errorStats.has(errorKey)) {
    errorStats.set(errorKey, {
      count: 0,
      firstOccurrence: new Date(),
      lastOccurrence: new Date(),
      contexts: []
    });
  }
  
  const stats = errorStats.get(errorKey);
  stats.count++;
  stats.lastOccurrence = new Date();
  stats.contexts.push({
    timestamp: new Date(),
    context
  });
  
  // Keep only last 10 contexts
  if (stats.contexts.length > 10) {
    stats.contexts = stats.contexts.slice(-10);
  }
  
  // Log high-frequency errors
  if (stats.count > 10 && stats.count % 10 === 0) {
    logError(LOG_CATEGORIES.SYSTEM, `High frequency error detected: ${errorKey}`, {
      totalCount: stats.count,
      firstOccurrence: stats.firstOccurrence,
      lastOccurrence: stats.lastOccurrence,
      recentContexts: stats.contexts.slice(-3)
    });
  }
};

/**
 * Performance monitoring
 */
const performanceMetrics = new Map();

const trackPerformance = (operation, duration, details = {}) => {
  if (!performanceMetrics.has(operation)) {
    performanceMetrics.set(operation, {
      count: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      recentDurations: []
    });
  }
  
  const metrics = performanceMetrics.get(operation);
  metrics.count++;
  metrics.totalDuration += duration;
  metrics.minDuration = Math.min(metrics.minDuration, duration);
  metrics.maxDuration = Math.max(metrics.maxDuration, duration);
  metrics.recentDurations.push(duration);
  
  // Keep only last 100 durations
  if (metrics.recentDurations.length > 100) {
    metrics.recentDurations = metrics.recentDurations.slice(-100);
  }
  
  // Log slow operations
  if (duration > 1000) { // 1 second
    logWarning(LOG_CATEGORIES.SYSTEM, `Slow operation detected: ${operation}`, {
      duration,
      ...details
    });
  }
};

/**
 * Get error statistics
 */
const getErrorStats = () => {
  const stats = {};
  
  for (const [errorKey, data] of errorStats.entries()) {
    stats[errorKey] = {
      count: data.count,
      firstOccurrence: data.firstOccurrence,
      lastOccurrence: data.lastOccurrence,
      recentContexts: data.contexts.slice(-3)
    };
  }
  
  return stats;
};

/**
 * Get performance metrics
 */
const getPerformanceMetrics = () => {
  const metrics = {};
  
  for (const [operation, data] of performanceMetrics.entries()) {
    const avgDuration = data.totalDuration / data.count;
    const recentAvg = data.recentDurations.length > 0 ? 
      data.recentDurations.reduce((a, b) => a + b, 0) / data.recentDurations.length : 0;
    
    metrics[operation] = {
      count: data.count,
      avgDuration: Math.round(avgDuration),
      recentAvgDuration: Math.round(recentAvg),
      minDuration: data.minDuration,
      maxDuration: data.maxDuration
    };
  }
  
  return metrics;
};

/**
 * Health check logging
 */
const logHealthCheck = (service, status, details = {}) => {
  const level = status === 'healthy' ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR;
  log(level, LOG_CATEGORIES.SYSTEM, `Health check: ${service} - ${status}`, details);
};

/**
 * User activity logging
 */
const logUserActivity = (userId, action, details = {}) => {
  logInfo(LOG_CATEGORIES.USER, `User activity: ${action}`, { userId, ...details });
};

/**
 * Cleanup old logs
 */
const cleanupOldLogs = (daysToKeep = 30) => {
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  try {
    const files = fs.readdirSync(logsDir);
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old log file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up old logs:', error);
  }
};

// Clean up old logs daily
setInterval(() => {
  cleanupOldLogs();
}, 24 * 60 * 60 * 1000);

/**
 * Express middleware for automatic API logging
 */
const expressLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logDebug(LOG_CATEGORIES.API, `Request: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    logAPIEvent(req.method, req.path, res.statusCode, duration, {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent')
    });
    
    trackPerformance(`${req.method} ${req.path}`, duration, {
      statusCode: res.statusCode
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = {
  LOG_LEVELS,
  LOG_CATEGORIES,
  log,
  logError,
  logWarning,
  logInfo,
  logDebug,
  logSecurityEvent,
  logAuthEvent,
  logAPIEvent,
  logRateLimitEvent,
  logCSRFEvent,
  logDatabaseEvent,
  logValidationError,
  logHealthCheck,
  logUserActivity,
  trackError,
  trackPerformance,
  getErrorStats,
  getPerformanceMetrics,
  cleanupOldLogs,
  expressLoggingMiddleware
}; 