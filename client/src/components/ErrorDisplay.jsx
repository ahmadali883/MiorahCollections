import React from 'react';

const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss, 
  showRetry = true, 
  showDismiss = true,
  className = "",
  size = "default" 
}) => {
  if (!error) return null;

  // Handle different error formats
  const errorMessage = error?.msg || error?.message || error || 'An unexpected error occurred';
  const errorType = error?.type || 'UNKNOWN_ERROR';
  const errorStatus = error?.status;

  // Determine error severity and styling
  const getErrorStyles = () => {
    if (errorStatus >= 500) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-500'
      };
    } else if (errorStatus === 429) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        icon: 'text-yellow-500'
      };
    } else if (errorStatus === 401 || errorStatus === 403) {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-500'
      };
    } else {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-500'
      };
    }
  };

  const styles = getErrorStyles();
  const sizeClasses = size === 'small' ? 'p-3 text-sm' : 'p-4';

  // Get appropriate icon based on error type
  const getIcon = () => {
    if (errorStatus === 429) {
      return (
        <svg className={`w-5 h-5 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (errorStatus === 401 || errorStatus === 403) {
      return (
        <svg className={`w-5 h-5 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    } else if (!navigator.onLine) {
      return (
        <svg className={`w-5 h-5 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12l.01.01M12 12l.01.01M12 12l.01.01M12 12l.01.01" />
        </svg>
      );
    } else {
      return (
        <svg className={`w-5 h-5 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }
  };

  // Get retry button text based on error type
  const getRetryText = () => {
    if (errorStatus === 429) return 'Try Again Later';
    if (errorStatus >= 500) return 'Retry';
    if (!navigator.onLine) return 'Retry when Online';
    return 'Try Again';
  };

  return (
    <div className={`rounded-md ${styles.bg} ${styles.border} border ${sizeClasses} ${className}`} role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className={`${styles.text} font-medium`}>
            {errorMessage}
          </p>
          
          {/* Show additional context for specific errors */}
          {errorStatus === 429 && (
            <p className={`mt-1 text-xs ${styles.text} opacity-75`}>
              Please wait a moment before trying again.
            </p>
          )}
          
          {!navigator.onLine && (
            <p className={`mt-1 text-xs ${styles.text} opacity-75`}>
              Please check your internet connection.
            </p>
          )}
          
          {errorStatus >= 500 && (
            <p className={`mt-1 text-xs ${styles.text} opacity-75`}>
              Our team has been notified about this issue.
            </p>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="ml-4 flex space-x-2">
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              disabled={!navigator.onLine && errorType === 'NETWORK'}
              className={`text-xs font-medium ${styles.text} hover:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {getRetryText()}
            </button>
          )}
          
          {showDismiss && onDismiss && (
            <button
              onClick={onDismiss}
              className={`text-xs ${styles.text} hover:opacity-75`}
              aria-label="Dismiss error"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay; 