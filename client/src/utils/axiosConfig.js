import axios from 'axios';
import { parseHttpError, logError, ERROR_TYPES } from './errorHandler';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Map to track active requests for cancellation
const activeRequests = new Map();

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers['x-auth-token'] = token;
    }

    // Create cancel token for this request
    const cancelToken = axios.CancelToken.source();
    config.cancelToken = cancelToken.token;

    // Store cancel token for potential cancellation
    const requestKey = `${config.method}_${config.url}`;
    activeRequests.set(requestKey, cancelToken);

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error) => {
    logError(error, { context: 'Request Interceptor' });
    return Promise.reject(parseHttpError(error));
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Remove request from active requests
    const requestKey = `${response.config.method}_${response.config.url}`;
    activeRequests.delete(requestKey);

    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    return response;
  },
  (error) => {
    // Remove request from active requests
    if (error.config) {
      const requestKey = `${error.config.method}_${error.config.url}`;
      activeRequests.delete(requestKey);
    }

    // Handle cancelled requests
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
      return Promise.reject(new Error('Request cancelled'));
    }

    // Parse and log error
    const appError = parseHttpError(error);
    logError(appError, { 
      context: 'Response Interceptor',
      url: error.config?.url,
      method: error.config?.method 
    });

    // Handle authentication errors
    if (appError.type === ERROR_TYPES.AUTHENTICATION || appError.type === ERROR_TYPES.AUTHORIZATION) {
      const currentPath = window.location.pathname;
      
      // Define protected routes that require authentication
      const protectedRoutes = [
        '/user-profile',
        '/checkout',
        '/admin',
        '/orders',
        '/addresses',
        '/notifications',
        '/password',
        '/settings'
      ];
      
      // Check if current path is a protected route
      const isProtectedRoute = protectedRoutes.some(route => 
        currentPath.startsWith(route)
      );
      
      // Only clear storage and redirect if accessing protected routes
      if (isProtectedRoute) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        
        // If we're not already on the login page, redirect
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(appError);
  }
);

// Function to cancel all active requests
export const cancelAllRequests = () => {
  activeRequests.forEach((cancelToken, requestKey) => {
    cancelToken.cancel(`Request ${requestKey} cancelled`);
  });
  activeRequests.clear();
};

// Function to cancel specific request
export const cancelRequest = (method, url) => {
  const requestKey = `${method}_${url}`;
  const cancelToken = activeRequests.get(requestKey);
  if (cancelToken) {
    cancelToken.cancel(`Request ${requestKey} cancelled`);
    activeRequests.delete(requestKey);
  }
};

// Enhanced API methods with retry logic
export const apiRequest = async (config, retryCount = 3, retryDelay = 1000) => {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      return await axiosInstance(config);
    } catch (error) {
      // Don't retry on certain error types
      if (
        error.type === ERROR_TYPES.AUTHENTICATION ||
        error.type === ERROR_TYPES.AUTHORIZATION ||
        error.type === ERROR_TYPES.VALIDATION ||
        error.type === ERROR_TYPES.NOT_FOUND ||
        attempt === retryCount
      ) {
        throw error;
      }

      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1)));
      
      console.log(`Retrying request (attempt ${attempt + 1}/${retryCount})`);
    }
  }
};

// Convenience methods
export const get = (url, config = {}) => apiRequest({ method: 'get', url, ...config });
export const post = (url, data = {}, config = {}) => apiRequest({ method: 'post', url, data, ...config });
export const put = (url, data = {}, config = {}) => apiRequest({ method: 'put', url, data, ...config });
export const patch = (url, data = {}, config = {}) => apiRequest({ method: 'patch', url, data, ...config });
export const deleteRequest = (url, config = {}) => apiRequest({ method: 'delete', url, ...config });

// Hook for component cleanup
export const useRequestCancellation = () => {
  const cancelTokensRef = React.useRef([]);

  const createCancelToken = () => {
    const cancelToken = axios.CancelToken.source();
    cancelTokensRef.current.push(cancelToken);
    return cancelToken;
  };

  const cancelAllRequests = () => {
    cancelTokensRef.current.forEach(cancelToken => {
      cancelToken.cancel('Component unmounted');
    });
    cancelTokensRef.current = [];
  };

  React.useEffect(() => {
    return () => {
      cancelAllRequests();
    };
  }, []);

  return { createCancelToken, cancelAllRequests };
};

export default axiosInstance; 