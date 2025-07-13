import React from 'react';
import { formatErrorForUI, getErrorColorClasses, ERROR_SEVERITY } from '../utils/errorHandler';

const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss, 
  className = '', 
  showRetry = true,
  showDismiss = true,
  inline = false 
}) => {
  if (!error) return null;

  const errorInfo = formatErrorForUI(error);
  const colorClasses = getErrorColorClasses(errorInfo.severity);
  
  const getIcon = () => {
    switch (errorInfo.severity) {
      case ERROR_SEVERITY.LOW:
        return (
          <svg className={`w-5 h-5 ${colorClasses.icon}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case ERROR_SEVERITY.HIGH:
      case ERROR_SEVERITY.CRITICAL:
        return (
          <svg className={`w-5 h-5 ${colorClasses.icon}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className={`w-5 h-5 ${colorClasses.icon}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const containerClasses = inline 
    ? `flex items-center space-x-2 p-3 rounded-md ${colorClasses.bg} ${colorClasses.border} border ${className}`
    : `p-4 rounded-md ${colorClasses.bg} ${colorClasses.border} border ${className}`;

  return (
    <div className={containerClasses}>
      <div className={inline ? 'flex items-center space-x-2 flex-1' : 'flex'}>
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className={inline ? 'flex-1' : 'ml-3'}>
          <h3 className={`text-sm font-medium ${colorClasses.text}`}>
            {errorInfo.title}
          </h3>
          <div className={`mt-1 text-sm ${colorClasses.text}`}>
            {errorInfo.message}
          </div>
        </div>
        
        {(showRetry || showDismiss) && (
          <div className={`${inline ? 'flex items-center space-x-2' : 'mt-4'}`}>
            {showRetry && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className={`text-sm font-medium ${colorClasses.text} hover:opacity-75 underline`}
              >
                Try Again
              </button>
            )}
            
            {showDismiss && onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className={`${inline ? 'ml-2' : 'ml-3'} text-sm font-medium ${colorClasses.text} hover:opacity-75`}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Toast notification variant
export const ErrorToast = ({ error, onDismiss, duration = 5000 }) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const errorInfo = formatErrorForUI(error);
  const colorClasses = getErrorColorClasses(errorInfo.severity);

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm rounded-lg shadow-lg ${colorClasses.bg} ${colorClasses.border} border`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className={`w-5 h-5 ${colorClasses.icon}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${colorClasses.text}`}>
              {errorInfo.title}
            </p>
            <p className={`mt-1 text-sm ${colorClasses.text}`}>
              {errorInfo.message}
            </p>
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onDismiss}
              className={`rounded-md inline-flex ${colorClasses.text} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Form field error variant
export const FieldError = ({ error, className = '' }) => {
  if (!error) return null;

  const errorInfo = formatErrorForUI(error);
  
  return (
    <p className={`mt-1 text-sm text-red-600 ${className}`}>
      {errorInfo.message}
    </p>
  );
};

export default ErrorDisplay; 