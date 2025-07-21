import axios from 'axios';
import { parseHttpError, logError, ERROR_TYPES } from './errorHandler';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://miorah-collections-server.vercel.app/api',
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
    console.error('🚨 API Error:', error.response?.status, error.response?.data || error.message);
    
    // Enhanced error mapping
    const appError = {
      message: error.response?.data?.msg || error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status || 500,
      type: ERROR_TYPES.SERVER_ERROR,
      data: error.response?.data || null,
    };

    // Enhanced error type classification
    if (error.response?.status === 401) {
      appError.type = ERROR_TYPES.AUTHENTICATION;
    } else if (error.response?.status === 403) {
      appError.type = ERROR_TYPES.AUTHORIZATION;
    } else if (error.response?.status === 404) {
      appError.type = ERROR_TYPES.NOT_FOUND;
    } else if (error.response?.status === 400) {
      appError.type = ERROR_TYPES.BAD_REQUEST;
    } else if (error.response?.status === 429) {
      appError.type = ERROR_TYPES.RATE_LIMIT;
    } else if (error.response?.status >= 500) {
      appError.type = ERROR_TYPES.SERVER_ERROR;
    } else if (!error.response) {
      appError.type = ERROR_TYPES.NETWORK_ERROR;
    }

    // Handle authentication errors
    if (appError.type === ERROR_TYPES.AUTHENTICATION || appError.type === ERROR_TYPES.AUTHORIZATION) {
      const currentPath = window.location.pathname;
      
      // Define protected routes that require authentication
      const protectedRoutes = [
        '/user-profile',
        '/profile',
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
        console.warn('🚨 Authentication error on protected route - clearing user data');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('tokenTimestamp');
        
        // Dispatch clearInvalidUser action
        const store = window.__REDUX_STORE__;
        if (store) {
          store.dispatch({ type: 'auth/clearInvalidUser' });
        }
        
        // If we're not already on the login page, redirect
        if (currentPath !== '/login' && currentPath !== '/register') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
    }

    // Handle user deleted/not found errors (404 on user-related endpoints)
    if (appError.type === ERROR_TYPES.NOT_FOUND || appError.type === ERROR_TYPES.BAD_REQUEST) {
      const currentPath = window.location.pathname;
      const requestUrl = error.config?.url || '';
      
      // User-related endpoints that would fail if user is deleted
      const userRelatedEndpoints = [
        '/auth',
        '/users/',
        '/cart/',
        '/orders/',
        '/address/',
        '/user/'
      ];
      
      // Check if this is a user-related endpoint
      const isUserRelatedEndpoint = userRelatedEndpoints.some(endpoint => 
        requestUrl.includes(endpoint)
      );
      
      // User-protected routes
      const userProtectedRoutes = [
        '/profile',
        '/user-profile',
        '/checkout',
        '/orders',
        '/addresses',
        '/notifications',
        '/password',
        '/settings'
      ];
      
      const isUserProtectedRoute = userProtectedRoutes.some(route => 
        currentPath.startsWith(route)
      );
      
      // Special handling for auth endpoint failures
      const isAuthEndpoint = requestUrl.includes('/auth');
      
      // If user-related endpoint fails AND we're on a user-protected route
      // OR if the auth endpoint fails with 404/400 (user doesn't exist)
      if ((isUserRelatedEndpoint && isUserProtectedRoute) || (isAuthEndpoint && appError.status === 400)) {
        console.warn('🚨 User-related endpoint failed - user may have been deleted from database');
        console.warn('Request URL:', requestUrl);
        console.warn('Error status:', appError.status);
        console.warn('Error message:', appError.message);
        
        // Clear all user data
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('tokenTimestamp');
        
        // Dispatch clearInvalidUser action
        const store = window.__REDUX_STORE__;
        if (store) {
          console.warn('🚨 Dispatching clearInvalidUser action');
          store.dispatch({ type: 'auth/clearInvalidUser' });
        }
        
        // Don't redirect immediately for non-auth endpoints
        // Let the component handle the error state first
        if (isAuthEndpoint) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
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

// Function to clear invalid user data manually
export const clearInvalidUserData = () => {
  console.warn('Clearing invalid user data');
  
  // Clear localStorage
  localStorage.removeItem('userToken');
  localStorage.removeItem('userInfo');
  localStorage.removeItem('tokenTimestamp');
  
  // Clear Redux state
  const store = window.__REDUX_STORE__;
  if (store) {
    store.dispatch({ type: 'auth/clearInvalidUser' });
  }
  
  // Redirect to login if not already there
  const currentPath = window.location.pathname;
  if (currentPath !== '/login' && currentPath !== '/register') {
    window.location.href = '/login?message=Your account is no longer valid. Please log in again.';
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

export default axiosInstance; 