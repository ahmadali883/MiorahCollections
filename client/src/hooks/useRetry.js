import { useState, useCallback, useRef } from 'react';
import { ERROR_TYPES } from '../utils/errorHandler';

// Default retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
  retryOn: [ERROR_TYPES.NETWORK, ERROR_TYPES.SERVER, ERROR_TYPES.TIMEOUT],
};

/**
 * Custom hook for implementing retry logic with exponential backoff
 */
export const useRetry = (config = {}) => {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const [isRetrying, setIsRetrying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastError, setLastError] = useState(null);
  const timeoutRef = useRef(null);

  const shouldRetry = useCallback((error, currentAttempt) => {
    // Check if we've exceeded max attempts
    if (currentAttempt >= retryConfig.maxAttempts) {
      return false;
    }

    // Check if error type is retryable
    if (error.type && !retryConfig.retryOn.includes(error.type)) {
      return false;
    }

    // Check for specific error conditions that shouldn't be retried
    if (
      error.type === ERROR_TYPES.AUTHENTICATION ||
      error.type === ERROR_TYPES.AUTHORIZATION ||
      error.type === ERROR_TYPES.VALIDATION ||
      error.type === ERROR_TYPES.NOT_FOUND
    ) {
      return false;
    }

    return true;
  }, [retryConfig]);

  const calculateDelay = useCallback((attemptNumber) => {
    const baseDelay = retryConfig.initialDelay * Math.pow(retryConfig.backoffFactor, attemptNumber - 1);
    const cappedDelay = Math.min(baseDelay, retryConfig.maxDelay);
    
    if (retryConfig.jitter) {
      // Add random jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * cappedDelay;
      return cappedDelay + jitter;
    }
    
    return cappedDelay;
  }, [retryConfig]);

  const executeWithRetry = useCallback(async (asyncFunction, onRetry = null) => {
    setIsRetrying(false);
    setAttemptCount(0);
    setLastError(null);

    let currentAttempt = 0;

    while (currentAttempt < retryConfig.maxAttempts) {
      currentAttempt++;
      setAttemptCount(currentAttempt);

      try {
        const result = await asyncFunction();
        setIsRetrying(false);
        setLastError(null);
        return result;
      } catch (error) {
        setLastError(error);

        if (!shouldRetry(error, currentAttempt)) {
          setIsRetrying(false);
          throw error;
        }

        if (currentAttempt < retryConfig.maxAttempts) {
          setIsRetrying(true);
          const delay = calculateDelay(currentAttempt);
          
          // Call onRetry callback if provided
          if (onRetry) {
            onRetry(error, currentAttempt, delay);
          }

          console.log(`Retrying in ${delay}ms... (attempt ${currentAttempt + 1}/${retryConfig.maxAttempts})`);

          // Wait for the calculated delay
          await new Promise(resolve => {
            timeoutRef.current = setTimeout(resolve, delay);
          });
        } else {
          setIsRetrying(false);
          throw error;
        }
      }
    }
  }, [retryConfig, shouldRetry, calculateDelay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsRetrying(false);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    executeWithRetry,
    isRetrying,
    attemptCount,
    lastError,
    cancel,
  };
};

/**
 * Hook for API requests with automatic retry
 */
export const useApiRetry = (config = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  const { executeWithRetry, isRetrying, attemptCount, cancel } = useRetry(config);

  const execute = useCallback(async (apiCall, onRetry = null) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await executeWithRetry(apiCall, onRetry);
      setData(result.data);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [executeWithRetry]);

  const retry = useCallback(async (apiCall, onRetry = null) => {
    return execute(apiCall, onRetry);
  }, [execute]);

  return {
    execute,
    retry,
    loading,
    error,
    data,
    isRetrying,
    attemptCount,
    cancel,
  };
};

/**
 * Hook for form submissions with retry logic
 */
export const useFormRetry = (config = {}) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const { executeWithRetry, isRetrying, attemptCount } = useRetry(config);

  const submitWithRetry = useCallback(async (submitFunction, onRetry = null) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const result = await executeWithRetry(submitFunction, onRetry);
      setSubmitSuccess(true);
      return result;
    } catch (err) {
      setSubmitError(err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [executeWithRetry]);

  const resetForm = useCallback(() => {
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  return {
    submitWithRetry,
    submitting,
    submitError,
    submitSuccess,
    isRetrying,
    attemptCount,
    resetForm,
  };
};

/**
 * Higher-order component for adding retry functionality
 */
export const withRetry = (Component, retryConfig = {}) => {
  return function WithRetryComponent(props) {
    const retryProps = useRetry(retryConfig);
    
    return <Component {...props} retry={retryProps} />;
  };
};

/**
 * Utility function for manual retry logic
 */
export const retryOperation = async (operation, config = {}) => {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (
        attempt === retryConfig.maxAttempts ||
        (error.type && !retryConfig.retryOn.includes(error.type)) ||
        error.type === ERROR_TYPES.AUTHENTICATION ||
        error.type === ERROR_TYPES.AUTHORIZATION ||
        error.type === ERROR_TYPES.VALIDATION ||
        error.type === ERROR_TYPES.NOT_FOUND
      ) {
        throw error;
      }

      // Calculate delay
      const baseDelay = retryConfig.initialDelay * Math.pow(retryConfig.backoffFactor, attempt - 1);
      const cappedDelay = Math.min(baseDelay, retryConfig.maxDelay);
      const finalDelay = retryConfig.jitter ? 
        cappedDelay + (Math.random() * 0.1 * cappedDelay) : 
        cappedDelay;

      console.log(`Retrying operation in ${finalDelay}ms... (attempt ${attempt + 1}/${retryConfig.maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError;
};

export default useRetry; 