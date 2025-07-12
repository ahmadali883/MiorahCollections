import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'
import { store, persistor } from "./redux/store";
import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/lib/integration/react';
import axios from 'axios';

// Add axios interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Only redirect to login if user is trying to access protected routes
      const currentPath = window.location.pathname;
      
      // Define protected routes that require authentication
      const protectedRoutes = [
        '/user-profile',
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
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        
        // If we're not already on the login page, redirect
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);
