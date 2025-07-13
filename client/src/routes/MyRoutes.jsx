import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home/Home'
import Products from '../pages/Products'
import ProductPage from '../pages/ProductPage'
import Collections from '../pages/Collections'
import Categories from '../pages/Categories'
import About from '../pages/About'
import Contact from '../pages/Contact'
import Login from '../pages/User/Login'
import Register from '../pages/User/Register'
import ResetPassword from '../pages/User/ResetPassword'
import EmailVerification from '../pages/User/EmailVerification'
import UserProfile from '../pages/User/UserProfile'
import MyAccount from '../pages/User/Profile/MyAccount'
import MyOrders from '../pages/User/Profile/MyOrders'
import MyAddress from '../pages/User/Profile/MyAddress'
import Notifications from '../pages/User/Profile/Notifications'
import Password from '../pages/User/Profile/Password'
import Settings from '../pages/User/Profile/Settings'
import Layout from '../components/layout/Layout'
import { useSelector } from 'react-redux'
import Dashboard from '../pages/Admin/Dashboard'
import NotFound from '../pages/NotFound'
import Checkout from '../pages/Checkout'
import CheckboxTest from '../pages/CheckboxTest'

const MyRoutes = () => {
  const { userInfo, userToken } = useSelector(state => state.auth)

  return (
    <Layout>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/collections/:category" element={<Categories />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<EmailVerification />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/test" element={<CheckboxTest />} />
        
        {/* Protected routes - require both token and userInfo */}
        {userToken && userInfo && (
          <>
            <Route path="/profile" element={<UserProfile />}>
              <Route index element={<MyAccount />} />
              <Route path="orders" element={<MyOrders />} />
              <Route path="addresses" element={<MyAddress />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="password" element={<Password />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Legacy route for backward compatibility */}
            <Route path="/user-profile" element={<UserProfile />}>
              <Route index element={<MyAccount />} />
              <Route path="orders" element={<MyOrders />} />
              <Route path="addresses" element={<MyAddress />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="password" element={<Password />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Admin routes */}
            {userInfo.isAdmin && (
              <Route path="/dashboard" element={<Dashboard />} />
            )}
          </>
        )}
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}

export default MyRoutes
