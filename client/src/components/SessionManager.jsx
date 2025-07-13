import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  checkTokenExpiration, 
  refreshToken, 
  clearSessionWarning, 
  updateLastActivity 
} from '../redux/reducers/authSlice';

const SessionManager = () => {
  const dispatch = useDispatch();
  const { userToken, sessionWarning, refreshing } = useSelector(state => state.auth);

  // Check token expiration every 5 minutes
  useEffect(() => {
    if (!userToken) return;

    const checkInterval = setInterval(() => {
      dispatch(checkTokenExpiration());
    }, 5 * 60 * 1000); // 5 minutes

    // Initial check
    dispatch(checkTokenExpiration());

    return () => clearInterval(checkInterval);
  }, [userToken, dispatch]);

  // Track user activity to reset session warnings
  const handleUserActivity = useCallback(() => {
    if (userToken) {
      dispatch(updateLastActivity());
    }
  }, [userToken, dispatch]);

  // Add activity listeners
  useEffect(() => {
    if (!userToken) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [handleUserActivity, userToken]);

  const handleRefreshToken = () => {
    dispatch(refreshToken());
  };

  const handleDismissWarning = () => {
    dispatch(clearSessionWarning());
  };

  if (!sessionWarning) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <div>
            <p className="font-semibold">Session Warning</p>
            <p className="text-sm">{sessionWarning.message}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {sessionWarning.type === 'warning' && (
            <button
              onClick={handleRefreshToken}
              disabled={refreshing}
              className="px-4 py-2 bg-yellow-800 text-white rounded hover:bg-yellow-900 disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Extend Session'}
            </button>
          )}
          
          <button
            onClick={handleDismissWarning}
            className="px-3 py-2 bg-yellow-700 text-white rounded hover:bg-yellow-800"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionManager; 