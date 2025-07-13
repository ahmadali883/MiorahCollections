/**
 * Centralized error handling utility for consistent error messages
 */

// Error types enum
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT: 'RATE_LIMIT',
  UNKNOWN: 'UNKNOWN'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Standard error messages
const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK_ERROR]: {
    title: 'Connection Error',
    message: 'Please check your internet connection and try again.',
    severity: ERROR_SEVERITY.MEDIUM
  },
  [ERROR_TYPES.VALIDATION]: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
    severity: ERROR_SEVERITY.LOW
  },
  [ERROR_TYPES.AUTHENTICATION]: {
    title: 'Authentication Required',
    message: 'Please log in to continue.',
    severity: ERROR_SEVERITY.MEDIUM
  },
  [ERROR_TYPES.AUTHORIZATION]: {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    severity: ERROR_SEVERITY.HIGH
  },
  [ERROR_TYPES.SERVER_ERROR]: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    severity: ERROR_SEVERITY.HIGH
  },
  [ERROR_TYPES.NOT_FOUND]: {
    title: 'Not Found',
    message: 'The requested resource could not be found.',
    severity: ERROR_SEVERITY.MEDIUM
  },
  [ERROR_TYPES.BAD_REQUEST]: {
    title: 'Bad Request',
    message: 'Invalid request. Please check your input and try again.',
    severity: ERROR_SEVERITY.MEDIUM
  },
  [ERROR_TYPES.TIMEOUT]: {
    title: 'Request Timeout',
    message: 'The request took too long to process. Please try again.',
    severity: ERROR_SEVERITY.MEDIUM
  },
  [ERROR_TYPES.RATE_LIMIT]: {
    title: 'Too Many Requests',
    message: 'You\'re making too many requests. Please wait a moment and try again.',
    severity: ERROR_SEVERITY.MEDIUM
  },
  [ERROR_TYPES.UNKNOWN]: {
    title: 'Unknown Error',
    message: 'An unexpected error occurred. Please try again.',
    severity: ERROR_SEVERITY.MEDIUM
  }
};

/**
 * Standardized error class
 */
export class AppError extends Error {
  constructor(type, message, originalError = null, context = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();
    
    const errorInfo = ERROR_MESSAGES[type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
    this.title = errorInfo.title;
    this.severity = errorInfo.severity;
    this.userMessage = message || errorInfo.message;
  }
}

/**
 * Parse HTTP error response and convert to AppError
 */
export const parseHttpError = (error) => {
  if (!error.response) {
    // Network error
    return new AppError(
      ERROR_TYPES.NETWORK_ERROR,
      'Unable to connect to server. Please check your internet connection.',
      error
    );
  }

  const { status, data } = error.response;
  let errorType = ERROR_TYPES.UNKNOWN;
  let message = 'An unexpected error occurred.';

  switch (status) {
    case 400:
      errorType = ERROR_TYPES.BAD_REQUEST;
      message = data?.msg || data?.message || 'Invalid request data.';
      break;
    case 401:
      errorType = ERROR_TYPES.AUTHENTICATION;
      message = data?.msg || data?.message || 'Please log in to continue.';
      break;
    case 403:
      errorType = ERROR_TYPES.AUTHORIZATION;
      message = data?.msg || data?.message || 'You don\'t have permission to perform this action.';
      break;
    case 404:
      errorType = ERROR_TYPES.NOT_FOUND;
      message = data?.msg || data?.message || 'The requested resource was not found.';
      break;
    case 408:
      errorType = ERROR_TYPES.TIMEOUT;
      message = data?.msg || data?.message || 'Request timeout. Please try again.';
      break;
    case 429:
      errorType = ERROR_TYPES.RATE_LIMIT;
      message = data?.msg || data?.message || 'Too many requests. Please wait and try again.';
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      errorType = ERROR_TYPES.SERVER_ERROR;
      message = data?.msg || data?.message || 'Server error. Please try again later.';
      break;
    default:
      errorType = ERROR_TYPES.UNKNOWN;
      message = data?.msg || data?.message || 'An unexpected error occurred.';
  }

  return new AppError(errorType, message, error, { status });
};

/**
 * Format error for display in UI components
 */
export const formatErrorForUI = (error) => {
  if (error instanceof AppError) {
    return {
      title: error.title,
      message: error.userMessage,
      type: error.type,
      severity: error.severity,
      timestamp: error.timestamp
    };
  }

  // Handle regular Error objects
  if (error instanceof Error) {
    return {
      title: 'Error',
      message: error.message || 'An unexpected error occurred.',
      type: ERROR_TYPES.UNKNOWN,
      severity: ERROR_SEVERITY.MEDIUM,
      timestamp: new Date().toISOString()
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      title: 'Error',
      message: error,
      type: ERROR_TYPES.UNKNOWN,
      severity: ERROR_SEVERITY.MEDIUM,
      timestamp: new Date().toISOString()
    };
  }

  // Fallback for unknown error types
  return {
    title: 'Unknown Error',
    message: 'An unexpected error occurred.',
    type: ERROR_TYPES.UNKNOWN,
    severity: ERROR_SEVERITY.MEDIUM,
    timestamp: new Date().toISOString()
  };
};

/**
 * Get error color classes for UI styling
 */
export const getErrorColorClasses = (severity) => {
  switch (severity) {
    case ERROR_SEVERITY.LOW:
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        icon: 'text-yellow-400'
      };
    case ERROR_SEVERITY.MEDIUM:
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        icon: 'text-orange-400'
      };
    case ERROR_SEVERITY.HIGH:
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-400'
      };
    case ERROR_SEVERITY.CRITICAL:
      return {
        bg: 'bg-red-100',
        border: 'border-red-300',
        text: 'text-red-900',
        icon: 'text-red-500'
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-800',
        icon: 'text-gray-400'
      };
  }
};

/**
 * Log error to console with proper formatting
 */
export const logError = (error, context = {}) => {
  const errorInfo = formatErrorForUI(error);
  
  console.group(`🚨 ${errorInfo.title} (${errorInfo.severity})`);
  console.error('Message:', errorInfo.message);
  console.error('Type:', errorInfo.type);
  console.error('Timestamp:', errorInfo.timestamp);
  
  if (context && Object.keys(context).length > 0) {
    console.error('Context:', context);
  }
  
  if (error instanceof AppError && error.originalError) {
    console.error('Original Error:', error.originalError);
  }
  
  console.groupEnd();
};

/**
 * Create user-friendly error messages for common scenarios
 */
export const createUserFriendlyError = (type, customMessage = null) => {
  const errorInfo = ERROR_MESSAGES[type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
  return new AppError(type, customMessage || errorInfo.message);
};

/**
 * Validate and sanitize error messages
 */
export const sanitizeErrorMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return 'An error occurred.';
  }

  // Remove sensitive information patterns
  const sanitized = message
    .replace(/password/gi, '***')
    .replace(/token/gi, '***')
    .replace(/secret/gi, '***')
    .replace(/key/gi, '***')
    .replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '****-****-****-****'); // Credit card numbers

  return sanitized.length > 200 ? sanitized.substring(0, 200) + '...' : sanitized;
};

export default {
  ERROR_TYPES,
  ERROR_SEVERITY,
  AppError,
  parseHttpError,
  formatErrorForUI,
  getErrorColorClasses,
  logError,
  createUserFriendlyError,
  sanitizeErrorMessage
}; 