# Miorah Collections

A full-stack e-commerce platform for artificial jewellery, built with modern web technologies.

## 🚀 Features

- **Product Categories**
  - Bracelets
  - Necklaces
  - Rings
  - Earrings
  - Pendants
  - Handcuffs
  - Bridal Sets

- **User Authentication**
  - Secure registration and login system
  - User profile management
  - Password protection and validation

- **Product Management**
  - Browse through various jewellery collections
  - Detailed product views with multiple images
  - Filter products by categories, colors, and brands
  - Search functionality

- **Shopping Experience**
  - Shopping cart functionality
  - Wishlist feature
  - Secure checkout process
  - Order tracking

- **Admin Features**
  - Product management
  - Order management
  - User management
  - Analytics dashboard

## 🛠️ Tech Stack

### Frontend
- React.js
- Redux for state management
- Tailwind CSS for styling
- React Router for navigation
- Framer Motion for animations

### Backend
- Node.js
- Express.js
- MongoDB for database
- JWT for authentication
- Multer for file uploads

## 📋 Prerequisites

Before running this project, make sure you have the following installed:
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd sneakers-ecommerce-website
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   npm install

   # Install client dependencies
   npm run clientinstall
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. **Run the development server**
   ```bash
   # Run both frontend and backend concurrently
   npm run dev

   # Or run them separately:
   # Backend only
   npm run server
   # Frontend only
   npm run client
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🧪 Testing

The application includes several test scripts to verify functionality:

```bash
# Test email functionality
npm run test:email

# Test email image handling
npm run test:email-images

# Test authentication flow
npm run test:auth-flow
```

### Authentication Flow
- **Unregistered users** can browse all public pages without login prompts
- **Protected routes** (user profile, checkout, admin) require authentication
- **Cart functionality** works for both registered and unregistered users

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   └── src/               # React source files
│       ├── assets/        # Images and other static assets
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       ├── redux/         # Redux store and reducers
│       └── utils/         # Utility functions
├── server/                # Backend Node.js application
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/           # Database models
│   └── routes/           # API routes
└── uploads/              # File upload directory
```

## 🔒 Security Features

- JWT-based authentication
- Password encryption
- Protected routes with selective enforcement
- Input validation
- XSS protection
- CORS enabled
- Public browsing for unregistered users

## 🛍️ Shopping Features

- Product filtering and sorting
- Shopping cart management
- Wishlist functionality
- Order tracking
- Secure payment integration

## 👥 User Roles

- **Customer**
  - Browse products
  - Add to cart
  - Place orders
  - Track orders
  - Manage profile

- **Admin**
  - Manage products
  - Handle orders
  - Manage users
  - View analytics

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile devices

## 🔄 API Endpoints

### Authentication
- POST /api/users/register
- POST /api/users/login
- GET /api/users/profile

### Products
- GET /api/products
- GET /api/products/:id
- POST /api/products (admin only)
- PUT /api/products/:id (admin only)
- DELETE /api/products/:id (admin only)

### Orders
- POST /api/orders
- GET /api/orders/:id
- GET /api/orders/user/:userId

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Ahmad Ali - Initial work

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community for the amazing tools and libraries

## 📞 Support

For support, email support@miorahcollections.com or create an issue in the repository.
