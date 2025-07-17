const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const readline = require('readline');
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

// Setup readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Function to create a new admin user
async function createAdminUser(userData) {
  try {
    console.log('\nChecking if user exists...');
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      console.log(`User found: ${existingUser.username} (${existingUser.email})`);
      console.log(`Current admin status: ${existingUser.isAdmin ? 'Admin' : 'Not Admin'}`);
      
      if (existingUser.isAdmin) {
        console.log('This user is already an admin.');
        return existingUser;
      }
      
      console.log('Updating to admin status...');
      existingUser.isAdmin = true;
      await existingUser.save();
      console.log(`✅ Successfully updated ${existingUser.username} to admin status!`);
      return existingUser;
    }
    
    console.log('\nCreating new admin user...');
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Create the new admin user
    const newUser = new User({
      firstname: userData.firstname,
      lastname: userData.lastname,
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      isAdmin: true // Set as admin
    });
    
    await newUser.save();
    console.log(`✅ Admin user ${newUser.username} created successfully!`);
    console.log(`Email: ${newUser.email}`);
    return newUser;
  } catch (error) {
    console.error('Error creating/updating admin user:');
    if (error.name === 'ValidationError') {
      // Handle Mongoose validation errors
      for (let field in error.errors) {
        console.error(`- ${field}: ${error.errors[field].message}`);
      }
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

// Function to prompt for user details
function getUserInput() {
  const userData = {};
  
  console.log('\n===== Create Admin User =====\n');
  
  return new Promise((resolve) => {
    rl.question('Email: ', (email) => {
      userData.email = email;
      
      // Check if user exists to decide whether to ask for all details
      User.findOne({ email })
        .then(existingUser => {
          if (existingUser) {
            console.log(`\nUser ${existingUser.username} found. Will be upgraded to admin status.`);
            resolve(userData);
            return;
          }
          
          // If user doesn't exist, ask for all details
          rl.question('First Name: ', (firstname) => {
            userData.firstname = firstname;
            
            rl.question('Last Name: ', (lastname) => {
              userData.lastname = lastname;
              
              rl.question('Username: ', (username) => {
                userData.username = username;
                
                rl.question('Password (min 6 characters): ', (password) => {
                  userData.password = password;
                  
                  if (password.length < 6) {
                    console.log('\n⚠️ Warning: Password is less than 6 characters. This might fail validation.');
                  }
                  
                  resolve(userData);
                });
              });
            });
          });
        })
        .catch(err => {
          console.error('Error checking for existing user:', err.message);
          rl.close();
          process.exit(1);
        });
    });
  });
}

// Main function
async function main() {
  try {
    const userData = await getUserInput();
    const adminUser = await createAdminUser(userData);
    
    console.log('\n===== Summary =====');
    console.log(`User: ${adminUser.username}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Admin: ${adminUser.isAdmin ? 'Yes' : 'No'}`);
    console.log('\nYou can now log in with these credentials in your application.');
  } catch (error) {
    console.error('\n❌ Error in the admin creation process:', error.message);
  } finally {
    rl.close();
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
