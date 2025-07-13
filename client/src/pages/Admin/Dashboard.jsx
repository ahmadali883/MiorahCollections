import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import CategoryForm from '../../components/admin/CategoryForm';
import ProductUploadForm from '../../components/admin/ProductUploadForm';
import OrderManager from '../../components/admin/OrderManager';
import InventoryManager from '../../components/admin/InventoryManager';
import { loadUserFromStorage } from '../../redux/reducers/authSlice';
import { getAllProducts, getCategories } from '../../redux/reducers/productSlice';
import AdminManager from '../../components/admin/AdminManager';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const { userInfo, userToken, loading } = useSelector(state => state.auth);
  const { loading: productLoading } = useSelector(state => state.product);
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  
  // Clean up old data status localStorage entries
  useEffect(() => {
    localStorage.removeItem('lastDataRefresh');
  }, []);
  
  // If we have a token but no user info, load the user info
  useEffect(() => {
    if (userToken && !userInfo) {
      dispatch(loadUserFromStorage());
    }
  }, [dispatch, userToken, userInfo]);

  // Function to refresh all data
  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      // Refresh products 
      await dispatch(getAllProducts()).unwrap();
      
      // Refresh categories
      await dispatch(getCategories()).unwrap();
      
      // Show success message
      alert('Data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange"></div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!userToken) {
    return <Navigate to="/login" />;
  }
  
  // Redirect if not admin
  if (userInfo && !userInfo.isAdmin) {
    return (
      <div className="min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-6">Access Denied</h1>
          <p className="text-xl">You do not have administrator privileges.</p>
        </div>
      </div>
    );
  }
  
  // If we have a token but still don't have user info after attempting to load
  if (!userInfo) {
    return (
      <div className="min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-orange mb-6">Loading User Information</h1>
          <p className="text-xl">Please wait while we verify your credentials...</p>
          <button
            onClick={() => dispatch(loadUserFromStorage())}
            className="mt-4 px-6 py-2 bg-orange text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-grayish-blue pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-very-dark-blue">Admin Dashboard</h1>
          
          {/* Refresh button */}
          <button
            onClick={handleRefreshData}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-500 text-white bg-orange rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center transition-colors"
          >
            {refreshing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </>
            )}
          </button>
        </div>
        
        {/* Tab navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'orders' 
                  ? 'border-b-2 border-orange text-orange' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'inventory' 
                  ? 'border-b-2 border-orange text-orange' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('inventory')}
            >
              Inventory
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'products' 
                  ? 'border-b-2 border-orange text-orange' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('products')}
            >
              Add Products
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'categories' 
                  ? 'border-b-2 border-orange text-orange' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('categories')}
            >
              Categories
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'admins' 
                  ? 'border-b-2 border-orange text-orange' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('admins')}
            >
              Admins
            </button>
          </div>
        </div>
        
        {/* Tab content */}
        <div className="mt-6">
          {activeTab === 'orders' && (
            <OrderManager />
          )}
          
          {activeTab === 'inventory' && (
            <InventoryManager />
          )}
          
          {activeTab === 'products' && (
            <ProductUploadForm />
          )}
          
          {activeTab === 'categories' && (
            <CategoryForm />
          )}
          
          {activeTab === 'admins' && (
            <AdminManager />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
