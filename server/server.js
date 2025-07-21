const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars - this must come before importing any config that uses env vars
dotenv.config({ path: path.join(__dirname, 'config/config.env') });

const connectDB = require('./config/db');

// Initialize Express
const app = express();

// Connect to database
connectDB();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://miorah-collections-l11t.vercel.app', 'https://miorah-collections-l11t.vercel.app']
    : 'http://localhost:3000', // React development server
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ extended: false }));

const PORT = process.env.PORT || 5000;

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ROUTES
app.use('/api/auth', require("./routes/auth"));
app.use("/api/users", require("./routes/user"));
app.use("/api/products", require("./routes/product"));
app.use("/api/products", require("./routes/product-upload")); // Add new upload routes
app.use("/api/categories", require("./routes/category"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/order"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/address", require("./routes/address"));

// Serve Ionicons locally
app.use('/ionicons', express.static(path.join(__dirname, 'node_modules/ionicons/dist')));

if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, 'client/build')));

  // Route all other requests to the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
  });
}

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
