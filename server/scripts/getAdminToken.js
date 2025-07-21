const axios = require('axios');
const readline = require('readline');
const api = require('../client/src/config/api');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const getAdminToken = async () => {
  try {
    // Prompt for admin credentials
    rl.question('Enter admin email: ', async (email) => {
      rl.question('Enter admin password: ', async (password) => {
        try {
          const response = await api.post(`${process.env.SERVER_BASE_URL || 'https://miorah-collections-server.vercel.app'}/api/auth`, {
            email,
            password
          });
          
          console.log('\nYour admin token is:');
          console.log(response.data.token);
          console.log('\nCopy this token and use it when running the addCategories script.');
        } catch (error) {
          console.error('Login failed:', error.response?.data?.msg || error.message);
        } finally {
          rl.close();
        }
      });
    });
  } catch (error) {
    console.error('Error:', error.message);
    rl.close();
  }
};

getAdminToken(); 