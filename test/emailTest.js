const { sendOrderConfirmationEmail, sendEmail } = require('../utils/emailService');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/config.env') });

// Test data
const testOrder = {
  _id: 'TEST_ORDER_123',
  products: [
    {
      product: {
        name: 'Test Product 1',
        price: 29.99
      },
      quantity: 2,
      itemTotal: 59.98
    },
    {
      product: {
        name: 'Test Product 2', 
        price: 15.50
      },
      quantity: 1,
      itemTotal: 15.50
    }
  ],
  amount: 75.48,
  address: {
    firstname: 'John',
    lastname: 'Doe',
    streetAddress: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    zipcode: '12345',
    country: 'Test Country',
    phone: '+1234567890'
  },
  createdAt: new Date()
};

const testUser = {
  firstname: 'John',
  lastname: 'Doe',
  email: 'khahmadalikhan@gmail.com' // Replace with your test email
};

// Test function
async function testEmailFunctionality() {
  console.log('🧪 Testing Email Functionality...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not Set'}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not Set'}`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n❌ Email credentials not configured. Please update config/config.env with:');
    console.log('EMAIL_USER=your-email@gmail.com');
    console.log('EMAIL_PASS=your-app-password');
    return;
  }
  
  console.log('\n📧 Sending test order confirmation email...');
  
  try {
    const result = await sendOrderConfirmationEmail(testOrder, testUser);
    console.log('✅ Email sent successfully!');
    console.log(`📬 Message ID: ${result.messageId}`);
    console.log(`📨 Sent to: ${testUser.email}`);
    console.log('\n🎉 Email functionality is working correctly!');
    console.log('👀 Check the recipient email for the order confirmation.');
  } catch (error) {
    console.log('❌ Email sending failed:');
    console.error(error.message);
    
    // Provide helpful troubleshooting hints
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('- Make sure 2-factor authentication is enabled on your Gmail account');
      console.log('- Use an App Password instead of your regular password');
      console.log('- Check that EMAIL_USER contains the correct email address');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('- Check your internet connection');
      console.log('- Verify SMTP settings if using custom provider');
      console.log('- Ensure firewall allows SMTP connections');
    }
  }
}

// Simple email test
async function testSimpleEmail() {
  console.log('\n📧 Testing simple email functionality...');
  
  try {
    const result = await sendEmail(
      testUser.email,
      'Test Email - Miorah Collections',
      '<h1>Test Email</h1><p>This is a test email from Miorah Collections.</p>',
      'Test Email - This is a test email from Miorah Collections.'
    );
    console.log('✅ Simple email sent successfully!');
    console.log(`📬 Message ID: ${result.messageId}`);
  } catch (error) {
    console.log('❌ Simple email sending failed:');
    console.error(error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Email Functionality Tests\n');
  console.log('=' .repeat(50));
  
  await testEmailFunctionality();
  
  console.log('\n' + '=' .repeat(50));
  
  await testSimpleEmail();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Email tests completed!');
}

// Handle command line execution
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testEmailFunctionality,
  testSimpleEmail,
  runTests
}; 