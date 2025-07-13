import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ErrorToast = ({ error, onDismiss, duration = 5000, position = 'top-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setIsLeaving(false);
    }
  }, [error]);

  useEffect(() => {
    if (error && duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [error, duration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300); // Animation duration
  };

  if (!error || !isVisible) return null;

  const errorMessage = error?.msg || error?.message || error || 'An error occurred';
  const errorType = error?.type || 'UNKNOWN_ERROR';
  const errorStatus = error?.status;

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  // Error styling based on status
  const getErrorStyles = () => {
    if (errorStatus >= 500) {
      return {
        bg: 'bg-red-500',
        text: 'text-white',
        icon: 'text-red-200'
      };
    } else if (errorStatus === 429) {
      return {
        bg: 'bg-yellow-500',
        text: 'text-white',
        icon: 'text-yellow-200'
      };
    } else if (errorStatus === 401 || errorStatus === 403) {
      return {
        bg: 'bg-blue-500',
        text: 'text-white',
        icon: 'text-blue-200'
      };
    } else {
      return {
        bg: 'bg-red-500',
        text: 'text-white',
        icon: 'text-red-200'
      };
    }
  };

  const styles = getErrorStyles();

  // Animation classes
  const animationClasses = isLeaving 
    ? 'transform transition-all duration-300 ease-in-out translate-x-full opacity-0' 
    : 'transform transition-all duration-300 ease-in-out translate-x-0 opacity-100';

  const toastContent = (
    <div 
      className={`fixed z-50 max-w-sm w-full ${positionClasses[position]} ${animationClasses}`}
      role="alert"
      aria-live="assertive"
    >
      <div className={`rounded-lg shadow-lg ${styles.bg} p-4`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className={`w-5 h-5 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${styles.text}`}>
              {errorMessage}
            </p>
            
            {/* Show additional context for specific errors */}
            {errorStatus === 429 && (
              <p className={`mt-1 text-xs ${styles.text} opacity-75`}>
                Please wait before trying again
              </p>
            )}
            
            {!navigator.onLine && (
              <p className={`mt-1 text-xs ${styles.text} opacity-75`}>
                Check your internet connection
              </p>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className={`rounded-md inline-flex ${styles.text} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white`}
              aria-label="Close notification"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Progress bar for auto-dismiss */}
        {duration > 0 && (
          <div className="mt-3 w-full bg-black bg-opacity-20 rounded-full h-1">
            <div 
              className="bg-white h-1 rounded-full transition-all ease-linear"
              style={{
                width: '100%',
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  // Render to portal for proper z-index management
  return createPortal(toastContent, document.body);
};

// CSS for progress bar animation (add to your global CSS)
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;
document.head.appendChild(style);

export default ErrorToast; 