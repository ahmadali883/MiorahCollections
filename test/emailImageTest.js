const { generateOrderConfirmationHTML } = require('../utils/emailService');

// Test data to verify image URL conversion
const testOrder = {
  _id: '507f1f77bcf86cd799439011',
  products: [
    {
      product: {
        _id: '507f1f77bcf86cd799439012',
        name: 'Gold Plated Necklace',
        price: 1200,
        images: [
          {
            _id: '507f1f77bcf86cd799439013',
            image_url: '/uploads/products/1743800750177-507070803.JPG',
            is_primary: true
          }
        ]
      },
      quantity: 1,
      itemTotal: 1200
    },
    {
      product: {
        _id: '507f1f77bcf86cd799439014',
        name: 'Silver Earrings',
        price: 800,
        images: [] // Test product without images
      },
      quantity: 2,
      itemTotal: 1600
    }
  ],
  amount: 2800,
  address: {
    street: '123 Main Street',
    city: 'Karachi',
    state: 'Sindh',
    postalCode: '75000',
    country: 'Pakistan'
  },
  createdAt: new Date()
};

const testUser = {
  firstname: 'John',
  lastname: 'Doe',
  email: 'john.doe@example.com'
};

console.log('🧪 Testing Email Image Functionality\n');

// Test 1: Check if SERVER_BASE_URL is set
console.log('1. Environment Check:');
console.log(`   SERVER_BASE_URL: ${process.env.SERVER_BASE_URL || 'Not set (will use default)'}`);

// Test 2: Generate HTML and check for absolute URLs
console.log('\n2. Generating Email HTML...');
const htmlContent = generateOrderConfirmationHTML(testOrder, testUser);

// Test 3: Check if relative URLs are converted to absolute URLs
console.log('\n3. Checking Image URL Conversion:');
const baseUrl = process.env.SERVER_BASE_URL || 'http://localhost:5000';
const expectedImageUrl = `${baseUrl}/uploads/products/1743800750177-507070803.JPG`;
const hasAbsoluteUrl = htmlContent.includes(expectedImageUrl);

console.log(`   Expected URL: ${expectedImageUrl}`);
console.log(`   ✅ Absolute URL found: ${hasAbsoluteUrl ? 'Yes' : 'No'}`);

// Test 4: Check if fallback for missing images works
console.log('\n4. Checking Missing Image Fallback:');
const hasPlaceholderIcon = htmlContent.includes('📷');
console.log(`   ✅ Placeholder icon for missing images: ${hasPlaceholderIcon ? 'Yes' : 'No'}`);

// Test 5: Check if user notice about images is included
console.log('\n5. Checking User Notice:');
const hasImageNotice = htmlContent.includes('If product images don\'t load');
console.log(`   ✅ User notice about image loading: ${hasImageNotice ? 'Yes' : 'No'}`);

// Test 6: Validate HTML structure
console.log('\n6. HTML Structure Validation:');
console.log(`   ✅ Contains product name: ${htmlContent.includes('Gold Plated Necklace') ? 'Yes' : 'No'}`);
console.log(`   ✅ Contains order total: ${htmlContent.includes('Rs 2800.00') ? 'Yes' : 'No'}`);
console.log(`   ✅ Contains delivery address: ${htmlContent.includes('123 Main Street') ? 'Yes' : 'No'}`);

console.log('\n🎉 Email image functionality test completed!');
console.log('\nTo test with actual email sending:');
console.log('1. Ensure your email credentials are set in config.env');
console.log('2. Place a test order through the application');
console.log('3. Check the received email for proper image display');
console.log('4. Try enabling/disabling images in your email client'); 