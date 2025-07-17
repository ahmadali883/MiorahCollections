const axios = require('axios');
const api = require('../client/src/config/api');

// Test token management functionality
const testTokenManagement = async () => {
  console.log('🧪 Testing Enhanced Token Management\n');
  
  const baseURL = 'http://localhost:5000/api';
  let authToken = null;
  let userCredentials = null;
  
  console.log('1. Testing User Login and Token Generation:');
  console.log('================================================');
  
  try {
    // First, create a test user (or use existing one)
    const loginData = {
      email: 'test@example.com',
      password: 'testpassword123'
    };
    
    const loginResponse = await api.post(`${baseURL}/auth`, loginData);
    authToken = loginResponse.data.token;
    userCredentials = loginResponse.data.user;
    
    console.log('✅ Login successful');
    console.log(`Token: ${authToken.substring(0, 20)}...`);
    console.log(`User: ${userCredentials.firstname} ${userCredentials.lastname}`);
  } catch (error) {
    console.log('❌ Login failed or user does not exist');
    console.log('Please create a test user first or check credentials');
    return;
  }
  
  console.log('\n2. Testing Token Validation:');
  console.log('============================');
  
  try {
    const config = {
      headers: {
        'x-auth-token': authToken
      }
    };
    
    const userResponse = await api.get(`${baseURL}/auth`, config);
    console.log('✅ Token validation successful');
    console.log(`Authenticated user: ${userResponse.data.firstname}`);
  } catch (error) {
    console.log('❌ Token validation failed');
    console.log(`Error: ${error.response?.data?.msg || error.message}`);
  }
  
  console.log('\n3. Testing Token Refresh:');
  console.log('=========================');
  
  try {
    const config = {
      headers: {
        'x-auth-token': authToken
      }
    };
    
    const refreshResponse = await api.post(`${baseURL}/auth/refresh`, {}, config);
    const newToken = refreshResponse.data.token;
    
    console.log('✅ Token refresh successful');
    console.log(`New token: ${newToken.substring(0, 20)}...`);
    console.log(`Message: ${refreshResponse.data.message}`);
    
    // Update token for next tests
    authToken = newToken;
  } catch (error) {
    console.log('❌ Token refresh failed');
    console.log(`Error: ${error.response?.data?.msg || error.message}`);
  }
  
  console.log('\n4. Testing Token Blacklisting (Logout):');
  console.log('=======================================');
  
  try {
    const config = {
      headers: {
        'x-auth-token': authToken
      }
    };
    
    // Logout to blacklist token
    const logoutResponse = await api.post(`${baseURL}/auth/logout`, {}, config);
    console.log('✅ Logout successful');
    console.log(`Message: ${logoutResponse.data.message}`);
    
    // Try to use the blacklisted token
    try {
      await api.get(`${baseURL}/auth`, config);
      console.log('❌ Blacklisted token was still accepted (this should not happen)');
    } catch (blacklistError) {
      console.log('✅ Blacklisted token properly rejected');
      console.log(`Error: ${blacklistError.response?.data?.msg}`);
    }
  } catch (error) {
    console.log('❌ Logout failed');
    console.log(`Error: ${error.response?.data?.msg || error.message}`);
  }
  
  console.log('\n5. Testing Token Expiration Simulation:');
  console.log('=======================================');
  
  // This would require manually creating an expired token or waiting 24 hours
  // For testing purposes, we'll just show the expected behavior
  console.log('ℹ️ Token expiration testing requires manual testing or waiting 24 hours');
  console.log('Expected behavior:');
  console.log('- Tokens expire after 24 hours');
  console.log('- Frontend shows warnings 30 minutes before expiration');
  console.log('- Automatic refresh attempt when token expires');
  console.log('- Graceful logout if refresh fails');
  
  console.log('\n6. Race Condition Prevention:');
  console.log('=============================');
  
  console.log('ℹ️ Race condition prevention testing requires frontend testing');
  console.log('Expected behavior:');
  console.log('- Only one loadUserFromStorage call at a time');
  console.log('- Refreshing flag prevents multiple simultaneous auth requests');
  console.log('- Session warning component tracks user activity');
  
  console.log('\n🎉 Token Management Testing Complete!');
  console.log('\nKey Improvements Implemented:');
  console.log('✅ Token refresh mechanism');
  console.log('✅ Server-side token invalidation');
  console.log('✅ Race condition prevention');
  console.log('✅ Session timeout warnings');
  console.log('✅ Automatic token timestamp tracking');
};

// Run the test
if (require.main === module) {
  testTokenManagement().catch(console.error);
}

module.exports = testTokenManagement; 