import { useState, useEffect, useCallback } from 'react';
import axios from '../utils/axiosConfig';

const useAvailabilityCheck = () => {
  const [availability, setAvailability] = useState({
    username: { checking: false, available: null, message: '' },
    email: { checking: false, available: null, message: '' }
  });

  // Debounced check function
  const checkAvailability = useCallback(
    debounce(async (field, value) => {
      if (!value || value.length < 3) {
        setAvailability(prev => ({
          ...prev,
          [field]: { checking: false, available: null, message: '' }
        }));
        return;
      }

      setAvailability(prev => ({
        ...prev,
        [field]: { ...prev[field], checking: true }
      }));

      try {
        const requestData = { [field]: value };
        // const response = await axios.post('/auth/check-availability', requestData);
        const response = await api.post('/auth/check-availability', requestData);
        
        if (response.data.field === field && !response.data.available) {
          setAvailability(prev => ({
            ...prev,
            [field]: {
              checking: false,
              available: false,
              message: response.data.message
            }
          }));
        } else {
          setAvailability(prev => ({
            ...prev,
            [field]: {
              checking: false,
              available: true,
              message: ''
            }
          }));
        }
      } catch (error) {
        console.error(`Error checking ${field} availability:`, error);
        setAvailability(prev => ({
          ...prev,
          [field]: {
            checking: false,
            available: null,
            message: 'Unable to verify availability. Please try again.'
          }
        }));
      }
    }, 800), // 800ms delay
    []
  );

  const checkUsername = useCallback((value) => {
    checkAvailability('username', value);
  }, [checkAvailability]);

  const checkEmail = useCallback((value) => {
    checkAvailability('email', value);
  }, [checkAvailability]);

  const resetAvailability = useCallback((field) => {
    setAvailability(prev => ({
      ...prev,
      [field]: { checking: false, available: null, message: '' }
    }));
  }, []);

  const resetAllAvailability = useCallback(() => {
    setAvailability({
      username: { checking: false, available: null, message: '' },
      email: { checking: false, available: null, message: '' }
    });
  }, []);

  return {
    availability,
    checkUsername,
    checkEmail,
    resetAvailability,
    resetAllAvailability
  };
};

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default useAvailabilityCheck; 