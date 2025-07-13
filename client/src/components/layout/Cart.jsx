import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { 
  decrementItem, 
  decrementUserCartItem, 
  deleteItem, 
  deleteUserCartItem, 
  emptyCart, 
  clearUserCart,
  clearError
} from "../../redux/reducers/cartSlice";
import { motion, AnimatePresence } from "framer-motion"

const variants = {
  open: { opacity: 1, x: 0 },
  closed: { opacity: 0, x: "150%" },
}

// Helper function to get the correct price for display
const getDisplayPrice = (product) => {
  // Always show the regular price, not the discounted price
  return product?.price || 0;
};

const Cart = () => {
  const dispatch = useDispatch();
  const { 
    userCartItems, 
    cartItems, 
    amountTotal, 
    showCart, 
    loading, 
    error, 
    errMsg,
    success,
    cartMerged,
    optimisticUpdates,
    lastSynced
  } = useSelector((state) => state.cart);
  const { userInfo } = useSelector((state) => state.auth);

  const handleClearCart = () => {
    if (userInfo) {
      dispatch(clearUserCart({ _id: userInfo._id }));
    } else {
      dispatch(emptyCart());
    }
  };

  const handleDecrementItem = (itemId) => {
    if (userInfo) {
      // For logged-in users, update the database
      dispatch(decrementUserCartItem({ itemId, _id: userInfo._id }));
    } else {
      // For guest users, update local state
      dispatch(decrementItem(itemId));
    }
  };

  const handleDeleteItem = (itemId) => {
    if (userInfo) {
      // For logged-in users, update the database
      dispatch(deleteUserCartItem({ itemId, _id: userInfo._id }));
    } else {
      // For guest users, update local state
      dispatch(deleteItem(itemId));
    }
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  // Defensive approach to handle null or undefined values
  const items = userInfo ? (userCartItems || []) : (cartItems || []);
  const hasItems = items.length > 0;
  const isOptimistic = optimisticUpdates.length > 0;

  return (
    <motion.div
      animate={showCart ? "open" : "closed"}
      initial={{ opacity: 0 }}
      variants={variants}
      className="fixed top-20 lg:top-24 right-2 lg:right-8 xl:right-16 z-50 w-full max-w-sm"
    >
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Cart Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Cart ({items.length})
            </h3>
            {isOptimistic && (
              <div className="flex items-center space-x-1 text-xs text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span>Syncing...</span>
              </div>
            )}
          </div>
          
          {/* Success/Merge Notification */}
          {typeof success === 'string' && (
            <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded text-sm text-green-800">
              {success}
            </div>
          )}
        </div>
        
        {/* Error Display */}
        {error && errMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm text-red-800">{errMsg}</span>
              </div>
              <button
                onClick={handleClearError}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Cart Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : hasItems ? (
            <div className="divide-y divide-gray-200">
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.product?.images?.[0]?.image_url || '/placeholder-image.jpg'}
                          alt={item.product?.name || 'Product'}
                          className="w-16 h-16 object-cover rounded-md border border-gray-200"
                          onError={(e) => {
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.product?.name || 'Unknown Product'}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-500">
                            Rs {getDisplayPrice(item.product).toFixed(2)}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            Rs {(item.itemTotal || 0).toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDecrementItem(item.id)}
                              className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                              disabled={loading}
                            >
                              <span className="text-sm font-medium">-</span>
                            </button>
                            <span className="text-sm font-medium min-w-[2rem] text-center">
                              {item.quantity || 0}
                            </span>
                            <button
                              onClick={() => {
                                // Add item (increment quantity) - reuse addToCart logic
                                // This would need to be implemented in the cart slice
                              }}
                              className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                              disabled={loading || (item.quantity || 0) >= 100}
                            >
                              <span className="text-sm font-medium">+</span>
                            </button>
                          </div>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            disabled={loading}
                            title="Remove item from cart"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                Add some beautiful jewelry pieces to get started
              </p>
              <Link
                to="/products"
                className="px-4 py-2 bg-orange text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                Browse Products
              </Link>
            </div>
          )}
        </div>
        
        {/* Cart Footer */}
        {hasItems && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            {/* Total */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-orange">
                Rs {(amountTotal || 0).toFixed(2)}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-2">
              <Link
                to="/checkout"
                className="w-full bg-orange text-white py-3 px-4 rounded-md hover:bg-orange-600 transition-colors font-medium text-center block"
              >
                Checkout
              </Link>
              
              <div className="flex space-x-2">
                <Link
                  to="/products"
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium text-center text-sm"
                >
                  Continue Shopping
                </Link>
                <button
                  onClick={handleClearCart}
                  disabled={loading}
                  className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-md hover:bg-red-200 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  Clear Cart
                </button>
              </div>
            </div>
            
            {/* Sync Status */}
            {lastSynced && userInfo && (
              <div className="mt-3 text-xs text-gray-500 text-center">
                Last synced: {new Date(lastSynced).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Cart;
