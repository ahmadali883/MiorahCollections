import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { decrementItem, decrementUserCartItem, deleteItem, deleteUserCartItem, emptyCart, clearUserCart } from "../../redux/reducers/cartSlice";
import { motion, AnimatePresence } from "framer-motion"

const variants = {
  open: { opacity: 1, x: 0 },
  closed: { opacity: 0, x: "150%" },
}

// Helper function to get the correct price for display
const getDisplayPrice = (product) => {
  if (product.discount_price && product.discount_price < product.price) {
    return product.discount_price;
  }
  return product.price;
};

const Cart = () => {
  const dispatch = useDispatch();
  const { userCartItems, cartItems, amountTotal, showCart, loading, error } = useSelector(
    (state) => state.cart
  );
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

  // Defensive approach to handle null or undefined values
  const items = userInfo ? (userCartItems || []) : (cartItems || []);
  const hasItems = items.length > 0;

  return (
    <motion.div
    animate={showCart ? "open" : "closed"}
    initial={{ opacity: 0 }}
    variants={variants}
    className="absolute top-20 lg:top-24 bottom-40 inset-x-2 lg:left-auto xl:-right-16 lg:-mr-2 p-5 max-w-xl lg:max-w-sm lg:w-full mx-auto min-h-xs h-fit flex flex-col bg-white z-20 shadow-lg lg:shadow-xl rounded-lg">
      <h3 className="font-bold pb-5">Cart</h3>
      <hr className="text-grayish-blue -mx-5" />
      
      {error && (
        <div className="text-red-500 text-sm mb-3 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}
      
      <div
        className={
          "cart-content flex flex-col flex-1 items-center pt-5 " +
          (items.length < 1
            ? "justify-center"
            : "justify-start pt-6")
        }
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
            <span className="ml-2 text-gray-600">Loading cart...</span>
          </div>
        ) : hasItems ? (
          <>
          <AnimatePresence mode= "sync">
            {items.map((item) => (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring" }}
                key={item.id}
                className="item w-full flex items-center justify-between text-grayish-blue pb-5"
              >
                <div className="item-img h-12 w-12 lg:h-14 lg:w-14 rounded-md overflow-hidden">
                  {/* Add defensive check for item.product.images */}
                  {item.product.images && item.product.images.length > 0 ? (
                    <img
                      className="object-cover w-full h-full"
                      src={item.product.images[0].image_url}
                      alt={item.product.name || item.product.title}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">No Image</span>
                    </div>
                  )}
                </div>
                <div className="px-3 flex-1">
                  <div className="flex justify-between">
                    <p className="product capitalize font-bold text-md text-dark-grayish-blue">
                      <Link
                        to={`/products/${item.product._id}`}
                        className="cursor-pointer hover:opacity-70 transition"
                      >
                        {item.product.title || item.product.name}
                      </Link>
                    </p>
                    <div className="flex items-center space-x-2">
                      <i
                        onClick={() => handleDecrementItem(item.id)}
                        className="cursor-pointer hover:text-orange transition-all"
                        title="Remove one item"
                      >
                        <ion-icon name="remove-circle-outline"></ion-icon>
                      </i>
                      <i
                        onClick={() => handleDeleteItem(item.id)}
                        className="cursor-pointer hover:text-red-500 transition-all"
                        title="Remove all items"
                      >
                        <ion-icon name="trash-outline"></ion-icon>
                      </i>
                    </div>
                  </div>
                  <div className="price flex justify-between">
                    <span className="">
                      Rs {item.product.discount_price && item.product.discount_price < item.product.price 
                        ? item.product.discount_price 
                        : item.product.price} x {item.quantity}
                    </span>
                    <span className="font-bold text-very-dark-blue">
                      Rs {(item.itemTotal || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
            <div className="overall-total w-full">
              <hr className="text-grayish-blue -mx-5 mt-8" />
              <div className="font-bold flex h-8 my-5 justify-between px-3">
                <h4 className="text-very-dark-blue text-lg">Total</h4>
                <p className="text-very-dark-blue text-lg">
                  Rs {(amountTotal || 0).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="checkout w-full">
              <Link to="/checkout">
                <button className="w-full h-14 bg-orange rounded-lg lg:rounded-xl mb-2 text-white flex items-center justify-center hover:opacity-60">
                  Checkout
                </button>
              </Link>
              <button 
                onClick={handleClearCart}
                disabled={loading}
                className="w-full h-10 bg-light-grayish-blue rounded-lg lg:rounded-xl mb-2 text-grayish-blue flex items-center justify-center hover:bg-grayish-blue hover:text-white transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Clearing...' : 'Clear Cart'}
              </button>
            </div>
          </>
        ) : (
          <p className="text-dark-grayish-blue font-bold">
            Your cart is empty.
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default Cart;
