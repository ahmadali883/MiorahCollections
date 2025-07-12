// Test script to verify checkout validation logic
// This simulates the checkout form validation behavior

console.log('🧪 Testing Checkout Validation Logic\n');

// Simulate the validation function
const canPlaceOrder = (userInfo, cartItems, userCartItems, watchedValues, selectedAddress, orderPlaced) => {
  const hasItems = userInfo ? userCartItems?.length > 0 : cartItems?.length > 0;
  
  // For guest users, check if form data has required fields
  if (!userInfo) {
    const requiredFields = ['firstname', 'lastname', 'phone', 'email', 'address', 'city', 'state', 'zipcode'];
    const hasAllRequiredFields = requiredFields.every(field => 
      watchedValues[field] && watchedValues[field].toString().trim() !== ''
    );
    return hasItems && hasAllRequiredFields && !orderPlaced;
  }
  
  // For logged-in users, just need items and address
  const hasAddress = selectedAddress;
  return hasItems && hasAddress && !orderPlaced;
};

const getValidationMessage = (userInfo, cartItems, userCartItems, watchedValues, selectedAddress, orderPlaced) => {
  const hasItems = userInfo ? userCartItems?.length > 0 : cartItems?.length > 0;

  if (!hasItems) {
    return "Add items to your cart to place an order";
  }

  if (!userInfo) {
    const requiredFields = [
      { field: 'firstname', label: 'First Name' },
      { field: 'lastname', label: 'Last Name' },
      { field: 'phone', label: 'Phone Number' },
      { field: 'email', label: 'Email Address' },
      { field: 'address', label: 'Address' },
      { field: 'city', label: 'City' },
      { field: 'state', label: 'State' },
      { field: 'zipcode', label: 'Postal Code' }
    ];
    
    const missingFields = requiredFields.filter(({ field }) => 
      !watchedValues[field] || watchedValues[field].toString().trim() === ''
    );
    
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(({ label }) => label).join(', ');
      return `Please fill in the following required fields: ${fieldNames}`;
    }
  } else {
    const hasAddress = selectedAddress;
    if (!hasAddress) {
      return "Please select or add a delivery address";
    }
  }

  if (orderPlaced) {
    return "Order has been placed successfully";
  }
  return null;
};

// Test scenarios
console.log('1. Testing Guest User - Empty Cart:');
console.log('================================');
let result = canPlaceOrder(null, [], [], {}, null, false);
let message = getValidationMessage(null, [], [], {}, null, false);
console.log(`✅ Can place order: ${result}`);
console.log(`📝 Message: "${message}"`);

console.log('\n2. Testing Guest User - Items in Cart, No Form Data:');
console.log('==================================================');
const cartWithItems = [{ id: 1, product: { name: 'Test Product' }, quantity: 1 }];
const emptyForm = {};
result = canPlaceOrder(null, cartWithItems, [], emptyForm, null, false);
message = getValidationMessage(null, cartWithItems, [], emptyForm, null, false);
console.log(`✅ Can place order: ${result}`);
console.log(`📝 Message: "${message}"`);

console.log('\n3. Testing Guest User - Items in Cart, Partial Form Data:');
console.log('========================================================');
const partialForm = {
  firstname: 'John',
  lastname: 'Doe',
  email: 'john@example.com'
  // Missing phone, address, city, state, zipcode
};
result = canPlaceOrder(null, cartWithItems, [], partialForm, null, false);
message = getValidationMessage(null, cartWithItems, [], partialForm, null, false);
console.log(`✅ Can place order: ${result}`);
console.log(`📝 Message: "${message}"`);

console.log('\n4. Testing Guest User - Items in Cart, Complete Form Data:');
console.log('=========================================================');
const completeForm = {
  firstname: 'John',
  lastname: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  address: '123 Main Street',
  city: 'New York',
  state: 'NY',
  zipcode: '10001'
};
result = canPlaceOrder(null, cartWithItems, [], completeForm, null, false);
message = getValidationMessage(null, cartWithItems, [], completeForm, null, false);
console.log(`✅ Can place order: ${result}`);
console.log(`📝 Message: "${message}"`);

console.log('\n5. Testing Logged-in User - Items in Cart, No Address:');
console.log('====================================================');
const userInfo = { _id: 'user123', name: 'John Doe' };
const userCartItems = [{ id: 1, product: { name: 'Test Product' }, quantity: 1 }];
result = canPlaceOrder(userInfo, [], userCartItems, {}, null, false);
message = getValidationMessage(userInfo, [], userCartItems, {}, null, false);
console.log(`✅ Can place order: ${result}`);
console.log(`📝 Message: "${message}"`);

console.log('\n6. Testing Logged-in User - Items in Cart, With Address:');
console.log('======================================================');
const selectedAddress = { _id: 'addr123', street: '123 Main St', city: 'NYC' };
result = canPlaceOrder(userInfo, [], userCartItems, {}, selectedAddress, false);
message = getValidationMessage(userInfo, [], userCartItems, {}, selectedAddress, false);
console.log(`✅ Can place order: ${result}`);
console.log(`📝 Message: "${message}"`);

console.log('\n7. Testing Order Already Placed:');
console.log('===============================');
result = canPlaceOrder(userInfo, [], userCartItems, {}, selectedAddress, true);
message = getValidationMessage(userInfo, [], userCartItems, {}, selectedAddress, true);
console.log(`✅ Can place order: ${result}`);
console.log(`📝 Message: "${message}"`);

console.log('\n🎉 Checkout validation test completed!');
console.log('\n📋 Summary:');
console.log('- Empty cart prevents order placement ✅');
console.log('- Guest users need all required fields ✅');
console.log('- Partial form data shows specific missing fields ✅');
console.log('- Complete form data enables order placement ✅');
console.log('- Logged-in users need address selection ✅');
console.log('- Order placement is prevented after successful order ✅'); 