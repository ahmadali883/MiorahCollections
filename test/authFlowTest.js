const axios = require('axios');

// Test public routes accessibility for unregistered users
const testPublicRoutes = async () => {
  console.log('🧪 Testing Public Routes Access for Unregistered Users\n');
  
  const baseURL = 'http://localhost:5000/api';
  
  // Test public API endpoints that should work without authentication
  const publicEndpoints = [
    { url: '/products', description: 'Get all products' },
    { url: '/categories', description: 'Get all categories' },
    { url: '/products?featured=true', description: 'Get featured products' },
    { url: '/products?new=true', description: 'Get new products' }
  ];
  
  console.log('1. Testing Public API Endpoints:');
  console.log('================================');
  
  for (const endpoint of publicEndpoints) {
    try {
      const response = await axios.get(`${baseURL}${endpoint.url}`);
      console.log(`✅ ${endpoint.description}: Status ${response.status}`);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log(`❌ ${endpoint.description}: Requires authentication (Status ${error.response.status})`);
      } else {
        console.log(`⚠️  ${endpoint.description}: Other error - Status ${error.response?.status || 'Network Error'}`);
      }
    }
  }
  
  console.log('\n2. Testing Protected API Endpoints (Should Return 401):');
  console.log('=====================================================');
  
  // Test protected endpoints that should require authentication
  const protectedEndpoints = [
    { url: '/auth', description: 'Get current user' },
    { url: '/cart', description: 'Get user cart' },
    { url: '/orders', description: 'Get user orders' }
  ];
  
  for (const endpoint of protectedEndpoints) {
    try {
      const response = await axios.get(`${baseURL}${endpoint.url}`);
      console.log(`⚠️  ${endpoint.description}: Unexpectedly accessible (Status ${response.status})`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`✅ ${endpoint.description}: Correctly requires authentication (Status 401)`);
      } else if (error.response?.status === 403) {
        console.log(`✅ ${endpoint.description}: Correctly forbidden (Status 403)`);
      } else {
        console.log(`❓ ${endpoint.description}: Other error - Status ${error.response?.status || 'Network Error'}`);
      }
    }
  }
  
  console.log('\n3. Client-Side Route Behavior:');
  console.log('===============================');
  
  // Test client-side route behavior
  const clientRoutes = [
    { path: '/', description: 'Home page', shouldBePublic: true },
    { path: '/products', description: 'Products page', shouldBePublic: true },
    { path: '/collections', description: 'Collections page', shouldBePublic: true },
    { path: '/about', description: 'About page', shouldBePublic: true },
    { path: '/contact', description: 'Contact page', shouldBePublic: true },
    { path: '/user-profile', description: 'User profile', shouldBePublic: false },
    { path: '/checkout', description: 'Checkout page', shouldBePublic: false },
    { path: '/admin/dashboard', description: 'Admin dashboard', shouldBePublic: false }
  ];
  
  for (const route of clientRoutes) {
    if (route.shouldBePublic) {
      console.log(`✅ ${route.description} (${route.path}): Should be accessible to unregistered users`);
    } else {
      console.log(`🔒 ${route.description} (${route.path}): Should require authentication`);
    }
  }
  
  console.log('\n4. Expected Behavior Summary:');
  console.log('=============================');
  console.log('✅ Unregistered users can browse:');
  console.log('   - Home page (/)');
  console.log('   - Products (/products)');
  console.log('   - Individual product pages (/products/:id)');
  console.log('   - Collections (/collections)');
  console.log('   - Categories (/categories)');
  console.log('   - About page (/about)');
  console.log('   - Contact page (/contact)');
  console.log('');
  console.log('🔒 These routes should redirect to login:');
  console.log('   - User profile (/user-profile)');
  console.log('   - Checkout (/checkout)');
  console.log('   - Admin dashboard (/admin/dashboard)');
  console.log('');
  console.log('📝 Note: The axios interceptor now only redirects to login');
  console.log('   when accessing protected routes, not when browsing public pages.');
  
  console.log('\n🎉 Authentication flow test completed!');
};

// Run the test
testPublicRoutes().catch(console.error); 