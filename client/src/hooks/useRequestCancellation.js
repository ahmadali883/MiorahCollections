import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook for managing request cancellation to prevent memory leaks
 */
export const useRequestCancellation = () => {
  const cancelTokensRef = useRef(new Set());
  const abortControllersRef = useRef(new Set());

  // Create a new cancel token for axios requests
  const createCancelToken = useCallback(() => {
    const source = axios.CancelToken.source();
    cancelTokensRef.current.add(source);
    return source;
  }, []);

  // Create a new AbortController for fetch requests
  const createAbortController = useCallback(() => {
    const controller = new AbortController();
    abortControllersRef.current.add(controller);
    return controller;
  }, []);

  // Cancel a specific request
  const cancelRequest = useCallback((source, reason = 'Request cancelled') => {
    if (source && typeof source.cancel === 'function') {
      source.cancel(reason);
      cancelTokensRef.current.delete(source);
    }
  }, []);

  // Abort a specific request
  const abortRequest = useCallback((controller, reason = 'Request aborted') => {
    if (controller && typeof controller.abort === 'function') {
      controller.abort(reason);
      abortControllersRef.current.delete(controller);
    }
  }, []);

  // Cancel all active requests
  const cancelAllRequests = useCallback((reason = 'Component unmounted') => {
    // Cancel axios requests
    cancelTokensRef.current.forEach(source => {
      if (source && typeof source.cancel === 'function') {
        source.cancel(reason);
      }
    });
    cancelTokensRef.current.clear();

    // Abort fetch requests
    abortControllersRef.current.forEach(controller => {
      if (controller && typeof controller.abort === 'function') {
        controller.abort(reason);
      }
    });
    abortControllersRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAllRequests('Component unmounted');
    };
  }, [cancelAllRequests]);

  return {
    createCancelToken,
    createAbortController,
    cancelRequest,
    abortRequest,
    cancelAllRequests
  };
};

/**
 * Hook for making cancellable API requests
 */
export const useCancellableRequest = () => {
  const { createCancelToken, cancelAllRequests } = useRequestCancellation();

  const makeRequest = useCallback(async (requestConfig) => {
    const source = createCancelToken();
    
    try {
      const response = await axios({
        ...requestConfig,
        cancelToken: source.token
      });
      return response;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        return null;
      }
      throw error;
    }
  }, [createCancelToken]);

  return { makeRequest, cancelAllRequests };
};

/**
 * Hook for making cancellable fetch requests
 */
export const useCancellableFetch = () => {
  const { createAbortController, cancelAllRequests } = useRequestCancellation();

  const makeFetch = useCallback(async (url, options = {}) => {
    const controller = createAbortController();
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch request aborted:', error.message);
        return null;
      }
      throw error;
    }
  }, [createAbortController]);

  return { makeFetch, cancelAllRequests };
};

/**
 * Higher-order component for automatic request cancellation
 */
export const withRequestCancellation = (Component) => {
  return function WithRequestCancellationComponent(props) {
    const requestCancellation = useRequestCancellation();
    
    return (
      <Component 
        {...props} 
        requestCancellation={requestCancellation}
      />
    );
  };
};

/**
 * Hook for managing multiple concurrent requests
 */
export const useConcurrentRequests = () => {
  const { createCancelToken } = useRequestCancellation();
  const activeRequestsRef = useRef(new Map());

  const addRequest = useCallback((key, promise, cancelToken) => {
    activeRequestsRef.current.set(key, { promise, cancelToken });
  }, []);

  const removeRequest = useCallback((key) => {
    activeRequestsRef.current.delete(key);
  }, []);

  const cancelRequest = useCallback((key, reason = 'Request cancelled') => {
    const request = activeRequestsRef.current.get(key);
    if (request && request.cancelToken) {
      request.cancelToken.cancel(reason);
      activeRequestsRef.current.delete(key);
    }
  }, []);

  const makeRequest = useCallback(async (key, requestConfig) => {
    // Cancel existing request with same key
    cancelRequest(key, 'Replaced by new request');

    const source = createCancelToken();
    
    try {
      const promise = axios({
        ...requestConfig,
        cancelToken: source.token
      });
      
      addRequest(key, promise, source);
      const response = await promise;
      removeRequest(key);
      
      return response;
    } catch (error) {
      removeRequest(key);
      
      if (axios.isCancel(error)) {
        console.log(`Request ${key} cancelled:`, error.message);
        return null;
      }
      throw error;
    }
  }, [createCancelToken, addRequest, removeRequest, cancelRequest]);

  const cancelAllRequests = useCallback(() => {
    activeRequestsRef.current.forEach(({ cancelToken }, key) => {
      if (cancelToken) {
        cancelToken.cancel(`Request ${key} cancelled`);
      }
    });
    activeRequestsRef.current.clear();
  }, []);

  return {
    makeRequest,
    cancelRequest,
    cancelAllRequests,
    activeRequestsCount: activeRequestsRef.current.size
  };
};

/**
 * Hook for debounced requests with cancellation
 */
export const useDebouncedRequest = (delay = 300) => {
  const { createCancelToken } = useRequestCancellation();
  const timeoutRef = useRef(null);
  const currentRequestRef = useRef(null);

  const debouncedRequest = useCallback(async (requestConfig) => {
    // Cancel previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Cancel previous request
    if (currentRequestRef.current) {
      currentRequestRef.current.cancel('Replaced by new request');
    }

    return new Promise((resolve, reject) => {
      timeoutRef.current = setTimeout(async () => {
        const source = createCancelToken();
        currentRequestRef.current = source;

        try {
          const response = await axios({
            ...requestConfig,
            cancelToken: source.token
          });
          currentRequestRef.current = null;
          resolve(response);
        } catch (error) {
          currentRequestRef.current = null;
          
          if (axios.isCancel(error)) {
            console.log('Debounced request cancelled:', error.message);
            resolve(null);
          } else {
            reject(error);
          }
        }
      }, delay);
    });
  }, [createCancelToken, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (currentRequestRef.current) {
        currentRequestRef.current.cancel('Component unmounted');
      }
    };
  }, []);

  return debouncedRequest;
};

/**
 * Hook for request queuing with cancellation
 */
export const useRequestQueue = (maxConcurrent = 3) => {
  const { createCancelToken } = useRequestCancellation();
  const queueRef = useRef([]);
  const activeRequestsRef = useRef(new Set());

  const processQueue = useCallback(async () => {
    if (activeRequestsRef.current.size >= maxConcurrent || queueRef.current.length === 0) {
      return;
    }

    const { requestConfig, resolve, reject, cancelToken } = queueRef.current.shift();
    activeRequestsRef.current.add(cancelToken);

    try {
      const response = await axios({
        ...requestConfig,
        cancelToken: cancelToken.token
      });
      resolve(response);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Queued request cancelled:', error.message);
        resolve(null);
      } else {
        reject(error);
      }
    } finally {
      activeRequestsRef.current.delete(cancelToken);
      processQueue(); // Process next item in queue
    }
  }, [maxConcurrent]);

  const queueRequest = useCallback(async (requestConfig) => {
    const source = createCancelToken();
    
    return new Promise((resolve, reject) => {
      queueRef.current.push({
        requestConfig,
        resolve,
        reject,
        cancelToken: source
      });
      
      processQueue();
    });
  }, [createCancelToken, processQueue]);

  const clearQueue = useCallback(() => {
    // Cancel all queued requests
    queueRef.current.forEach(({ cancelToken }) => {
      cancelToken.cancel('Queue cleared');
    });
    queueRef.current = [];

    // Cancel all active requests
    activeRequestsRef.current.forEach(cancelToken => {
      cancelToken.cancel('Queue cleared');
    });
    activeRequestsRef.current.clear();
  }, []);

  return {
    queueRequest,
    clearQueue,
    queueLength: queueRef.current.length,
    activeRequestsCount: activeRequestsRef.current.size
  };
};

export default useRequestCancellation; 