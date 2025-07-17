const axios = require('axios');
const readline = require('readline');
const api = require('../config/api');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const categories = [
  {
    name: "Necklace",
    description: "Artificial Gold color Necklaces"
  },
  {
    name: "Rings",
    description: "Artificial Gold color Rings"
  },
  {
    name: "Earrings",
    description: "Artificial Gold color Earrings"
  },
  {
    name: "Pendants",
    description: "Artificial Gold color Pendants"
  },
  {
    name: "Handcuffs",
    description: "Artificial Gold color Handcuffs"
  },
  {
    name: "Bridal Sets",
    description: "Artificial Gold color Bridal Sets"
  }
];

const addCategories = async (adminToken) => {
  try {
    for (const category of categories) {
      const response = await api.post('http://localhost:5000/api/categories', category, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': adminToken
        }
      });
      console.log(`Added category: ${response.data.name}`);
    }
    
    console.log('All categories added successfully!');
  } catch (error) {
    console.error('Error adding categories:', error.response?.data || error.message);
  } finally {
    rl.close();
  }
};

// Prompt for admin token
rl.question('Please enter your admin token: ', (token) => {
  addCategories(token);
}); 