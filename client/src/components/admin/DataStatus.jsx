import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const DataStatus = () => {
  const [lastRefresh, setLastRefresh] = useState(null);
  const { loading: productLoading } = useSelector(state => state.product);
  
  useEffect(() => {
    // Load the last refresh timestamp from localStorage
    const storedRefresh = localStorage.getItem('lastDataRefresh');
    if (storedRefresh) {
      setLastRefresh(new Date(parseInt(storedRefresh)));
    }
  }, []);
  
  // Update last refresh time when productLoading changes from true to false
  useEffect(() => {
    if (!productLoading) {
      const storedRefresh = localStorage.getItem('lastDataRefresh');
      if (storedRefresh) {
        setLastRefresh(new Date(parseInt(storedRefresh)));
      }
    }
  }, [productLoading]);
  
  // Format time difference between now and last refresh
  const getTimeSinceRefresh = () => {
    if (!lastRefresh) return 'Never';
    
    const now = new Date();
    const diffMs = now - lastRefresh;
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec} seconds ago`;
    
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Data Status</h3>
          <p className="text-xs text-gray-500 mt-1">
            Last synchronized: {getTimeSinceRefresh()}
          </p>
        </div>
        
        {lastRefresh && (
          <div className="mt-2 sm:mt-0 text-xs text-gray-500">
            {lastRefresh.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataStatus;
