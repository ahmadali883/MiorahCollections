const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load env variables correctly
const envPath = path.join(__dirname, '../config/config.env');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`Warning: Config file not found at ${envPath}`);
  // Look for .env file in root directory as fallback
  dotenv.config();
}

// Import User model
const User = require('../models/User');

// Connect to the database - trying multiple possible environment variable names
const dbURI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URI;

if (!dbURI) {
  console.error('Error: No MongoDB connection URI found in environment variables.');
  console.error('Make sure MONGO_URI, MONGODB_URI or DB_URI is defined in your .env file.');
  process.exit(1);
}

console.log('Attempting to connect to MongoDB...');
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully!'))
.catch(err => {
  console.error('Failed to connect to MongoDB:', err.message);
  console.error('Please check your connection string and network connection.');
  process.exit(1);
});

// Function to make a user admin
async function makeUserAdmin(userId) {
  try {
    // First, check if the user exists
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Display current user information
    console.log('\n===== Current User Information =====');
    console.log(`ID: ${user._id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`First Name: ${user.firstname}`);
    console.log(`Last Name: ${user.lastname}`);
    console.log(`Admin Status: ${user.isAdmin ? '✅ Yes' : '❌ No'}`);
    console.log(`Email Verified: ${user.isEmailVerified ? '✅ Yes' : '❌ No'}`);
    console.log(`Created: ${user.createdAt}`);
    console.log(`Updated: ${user.updatedAt}`);
    
    // Check if user is already an admin
    if (user.isAdmin) {
      console.log('\n⚠️  User is already an admin. No changes needed.');
      return user;
    }
    
    // Update user to admin
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isAdmin: true },
      { new: true }
    );
    
    console.log('\n===== Updated User Information =====');
    console.log(`ID: ${updatedUser._id}`);
    console.log(`Username: ${updatedUser.username}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`First Name: ${updatedUser.firstname}`);
    console.log(`Last Name: ${updatedUser.lastname}`);
    console.log(`Admin Status: ${updatedUser.isAdmin ? '✅ Yes' : '❌ No'}`);
    console.log(`Email Verified: ${updatedUser.isEmailVerified ? '✅ Yes' : '❌ No'}`);
    console.log(`Updated: ${updatedUser.updatedAt}`);
    
    console.log(`\n✅ Successfully made ${updatedUser.username} (${updatedUser.email}) an admin!`);
    console.log('They can now access admin features in the application.');
    
    return updatedUser;
    
  } catch (error) {
    console.error('Error making user admin:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Get user ID from command line arguments
    const userId = process.argv[2];
    
    if (!userId) {
      console.log('\n=== Make User Admin ===');
      console.log('Usage: node scripts/makeUserAdmin.js <userId>');
      console.log('Example: node scripts/makeUserAdmin.js 6873a71afd2e24efbb327b7f');
      console.log('\nThis script will update an existing user to admin status');
      process.exit(1);
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('❌ Invalid User ID format');
      console.log('Please provide a valid MongoDB ObjectId');
      process.exit(1);
    }
    
    console.log(`\n=== Making User Admin ===`);
    console.log(`User ID: ${userId}`);
    
    // Make user admin
    await makeUserAdmin(userId);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    console.log('\nDisconnecting from database...');
    setTimeout(() => {
      mongoose.connection.close();
      console.log('Done!');
      process.exit(0);
    }, 1000);
  }
}

// Run the script
main(); 