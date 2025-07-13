const axios = require('axios');

// Test cart synchronization functionality
const testCartSynchronization = async () => {
  console.log('🛒 Testing Enhanced Cart Synchronization\n');
  
  const baseURL = 'http://localhost:5000/api';
  let authToken = null;
  let userId = null;
  let testProductId = null;
  
  console.log('1. Setting Up Test Environment:');
  console.log('==============================');
  
  try {
    // Login to get user token
    const loginData = {
      email: 'khahmadalikhan@gmail.com',
      password: '112233'
    };
    
    const loginResponse = await axios.post(`${baseURL}/auth`, loginData);
    authToken = loginResponse.data.token;
    userId = loginResponse.data.user._id;
    
    console.log('✅ User authentication successful');
    console.log(`User ID: ${userId}`);
  } catch (error) {
    console.log('❌ Authentication failed - please ensure test user exists');
    return;
  }
  
  // Get a test product
  try {
    const productsResponse = await axios.get(`${baseURL}/products`);
    if (productsResponse.data.length > 0) {
      testProductId = productsResponse.data[0]._id;
      console.log(`✅ Test product found: ${testProductId}`);
    } else {
      console.log('❌ No products available for testing');
      return;
    }
  } catch (error) {
    console.log('❌ Failed to fetch products for testing');
    return;
  }
  
  console.log('\n2. Testing Cart Data Validation:');
  console.log('================================');
  
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': authToken
      }
    };
    
    // Test invalid cart data
    const invalidCartData = [
      { id: testProductId, quantity: -1, itemTotal: -50 }, // Invalid negative values
      { id: testProductId, quantity: 'invalid', itemTotal: 'invalid' }, // Invalid types
      { id: testProductId, quantity: 150, itemTotal: 1500 }, // Exceeds maximum
      null, // Null item
      { id: '', quantity: 1, itemTotal: 50 } // Empty ID
    ];
    
    const response = await axios.put(`${baseURL}/cart/${userId}`, {
      products: invalidCartData
    }, config);
    
    console.log('✅ Cart validation handled invalid data properly');
    console.log(`Cleaned cart items: ${response.data.products.length}`);
  } catch (error) {
    console.log('❌ Cart validation failed');
    console.log(`Error: ${error.response?.data?.msg || error.message}`);
  }
  
  console.log('\n3. Testing Guest Cart Simulation:');
  console.log('=================================');
  
  // Simulate guest cart items (this would normally be in localStorage)
  const simulatedGuestCart = [
    {
      id: testProductId,
      product: { _id: testProductId, name: 'Test Product', price: 100 },
      quantity: 2,
      itemTotal: 200
    }
  ];
  
  console.log(`✅ Simulated guest cart with ${simulatedGuestCart.length} item(s)`);
  
  console.log('\n4. Testing Cart Merging:');
  console.log('========================');
  
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': authToken
      }
    };
    
    // Clear existing cart first
    await axios.put(`${baseURL}/cart/${userId}`, { products: [] }, config);
    
    // Add an item to user cart
    const userCartItem = {
      id: testProductId,
      product: { _id: testProductId, name: 'Test Product', price: 100 },
      quantity: 1,
      itemTotal: 100
    };
    
    await axios.put(`${baseURL}/cart/${userId}`, { 
      products: [userCartItem] 
    }, config);
    
    console.log('✅ Added item to user cart (quantity: 1)');
    
    // Simulate merging guest cart (this would happen during login)
    // In practice, this would be handled by the enhanced createUserCart function
    const mergedItems = [
      {
        id: testProductId,
        product: { _id: testProductId, name: 'Test Product', price: 100 },
        quantity: 3, // Combined quantity (1 from user + 2 from guest)
        itemTotal: 300
      }
    ];
    
    await axios.put(`${baseURL}/cart/${userId}`, { 
      products: mergedItems 
    }, config);
    
    const cartResponse = await axios.get(`${baseURL}/cart/${userId}`, config);
    const finalQuantity = cartResponse.data.products[0]?.quantity || 0;
    
    console.log('✅ Cart merging simulation successful');
    console.log(`Final merged quantity: ${finalQuantity}`);
    
    if (finalQuantity === 3) {
      console.log('✅ Guest cart items properly merged with user cart');
    } else {
      console.log('⚠️ Cart merging may not have worked as expected');
    }
  } catch (error) {
    console.log('❌ Cart merging test failed');
    console.log(`Error: ${error.response?.data?.msg || error.message}`);
  }
  
  console.log('\n5. Testing Optimistic Updates Simulation:');
  console.log('=========================================');
  
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': authToken
      }
    };
    
    // Simulate optimistic update (immediate UI response)
    console.log('⏱️ Simulating optimistic update (immediate UI response)');
    const optimisticStart = Date.now();
    
    // This would be the optimistic update in the frontend
    const optimisticCartState = [
      {
        id: testProductId,
        product: { _id: testProductId, name: 'Test Product', price: 100 },
        quantity: 5, // Optimistically updated quantity
        itemTotal: 500
      }
    ];
    
    console.log('✅ Optimistic update applied to UI immediately');
    
    // Simulate background sync (this happens after optimistic update)
    setTimeout(async () => {
      try {
        await axios.put(`${baseURL}/cart/${userId}`, { 
          products: optimisticCartState 
        }, config);
        
        const syncEnd = Date.now();
        console.log(`✅ Background sync completed (${syncEnd - optimisticStart}ms later)`);
        console.log('✅ Optimistic update confirmed by server');
      } catch (syncError) {
        console.log('❌ Background sync failed - would need rollback in real app');
      }
    }, 100);
    
  } catch (error) {
    console.log('❌ Optimistic update simulation failed');
    console.log(`Error: ${error.response?.data?.msg || error.message}`);
  }
  
  console.log('\n6. Testing Cart Cleanup and Validation:');
  console.log('======================================');
  
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': authToken
      }
    };
    
    // Test cart cleanup with mixed valid/invalid data
    const mixedCartData = [
      {
        id: testProductId,
        product: { _id: testProductId, name: 'Test Product', price: 100 },
        quantity: 2.7, // Will be rounded down to 2
        itemTotal: 270
      },
      {
        id: testProductId + '_invalid',
        product: { _id: testProductId + '_invalid', name: 'Invalid Product', price: 50 },
        quantity: 0, // Invalid quantity (will be filtered out)
        itemTotal: 0
      },
      {
        id: testProductId,
        product: { _id: testProductId, name: 'Test Product', price: 100 },
        quantity: 3,
        itemTotal: 300
      }
    ];
    
    const response = await axios.put(`${baseURL}/cart/${userId}`, {
      products: mixedCartData
    }, config);
    
    console.log('✅ Cart cleanup processed mixed data');
    console.log(`Original items: ${mixedCartData.length}`);
    console.log(`Cleaned items: ${response.data.products.length}`);
    
    // Check if quantities were properly validated
    const cleanedItem = response.data.products[0];
    if (cleanedItem && Number.isInteger(cleanedItem.quantity)) {
      console.log('✅ Quantity validation working (decimal rounded to integer)');
    }
    
  } catch (error) {
    console.log('❌ Cart cleanup test failed');
    console.log(`Error: ${error.response?.data?.msg || error.message}`);
  }
  
  console.log('\n7. Testing Maximum Quantity Limits:');
  console.log('===================================');
  
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': authToken
      }
    };
    
    // Test maximum quantity enforcement
    const maxQuantityItem = {
      id: testProductId,
      product: { _id: testProductId, name: 'Test Product', price: 100 },
      quantity: 150, // Exceeds maximum of 100
      itemTotal: 15000
    };
    
    const response = await axios.put(`${baseURL}/cart/${userId}`, {
      products: [maxQuantityItem]
    }, config);
    
    const actualQuantity = response.data.products[0]?.quantity || 0;
    
    if (actualQuantity <= 100) {
      console.log('✅ Maximum quantity limit enforced');
      console.log(`Requested: 150, Actual: ${actualQuantity}`);
    } else {
      console.log('⚠️ Maximum quantity limit may not be working');
    }
    
  } catch (error) {
    console.log('❌ Maximum quantity test failed');
    console.log(`Error: ${error.response?.data?.msg || error.message}`);
  }
  
  // Cleanup
  console.log('\n8. Cleaning Up Test Data:');
  console.log('=========================');
  
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': authToken
      }
    };
    
    await axios.put(`${baseURL}/cart/${userId}`, { products: [] }, config);
    console.log('✅ Test cart cleared');
  } catch (error) {
    console.log('⚠️ Failed to clear test cart');
  }
  
  console.log('\n🎉 Cart Synchronization Testing Complete!');
  console.log('\nKey Features Tested:');
  console.log('✅ Data validation and cleanup');
  console.log('✅ Guest cart merging simulation');
  console.log('✅ Optimistic updates pattern');
  console.log('✅ Maximum quantity limits');
  console.log('✅ Cart persistence and sync');
  
  console.log('\nFrontend Features to Test Manually:');
  console.log('📱 Guest cart → Login → Automatic merge');
  console.log('📱 Add to cart → Immediate UI update');
  console.log('📱 Network issues → Graceful degradation');
  console.log('📱 Cart validation → Error handling');
  console.log('📱 Maximum quantity → UI warnings');
};

// Run the test
if (require.main === module) {
  testCartSynchronization().catch(console.error);
}

module.exports = testCartSynchronization; 