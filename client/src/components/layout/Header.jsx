import { useEffect, useRef, useState } from "react";
import logo from "../../assets/logo.svg";
import menu from "../../assets/icon-menu.svg";
import avatar from "../../assets/image-avatar.png";
import Cart from "./Cart";
import { NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  createUserCart,
  cartDisplay,
  setTotals,
  cleanupCart,
} from "../../redux/reducers/cartSlice";
import { getUserAddress } from "../../redux/reducers/addressSlice";
import { getUserOrder } from "../../redux/reducers/orderSlice";
import { getCategories } from "../../redux/reducers/productSlice";

const Header = () => {
  const dispatch = useDispatch();
  const showCart = useSelector((state) => state.cart.showCart);
  const total = useSelector((state) => state.cart.total);
  const { cartItems, userCartItems, cartMerged } = useSelector((state) => state.cart);
  const { userInfo, refreshing } = useSelector((state) => state.auth);
  const { categories } = useSelector((state) => state.product);
  const [showCategories, setShowCategories] = useState(false);
  const cartInitialized = useRef(false);

  // Calculate totals when cart items change
  useEffect(() => {
    dispatch(setTotals());
  }, [cartItems, userCartItems, dispatch]);

  // One-time initialization on component mount
  useEffect(() => {
    dispatch(getCategories());
    dispatch(cleanupCart());
  }, [dispatch]);

  // Remove the duplicate getUserDetails call since App.js handles user loading
  // This prevents race conditions

  useEffect(() => {
    if (userInfo && !refreshing && !cartInitialized.current) {
      // For logged-in users, fetch the current cart from database and merge with guest cart
      const guestCartItems = cartItems.length > 0 ? cartItems : [];
      
      dispatch(createUserCart({ 
        products: [], 
        _id: userInfo._id,
        guestCartItems: guestCartItems // Pass guest cart for merging
      }));
      
      cartInitialized.current = true;
    }
    // eslint-disable-next-line
  }, [userInfo, refreshing]);

  // Reset cart initialization flag when user logs out
  useEffect(() => {
    if (!userInfo) {
      cartInitialized.current = false;
    }
  }, [userInfo]);

  useEffect(() => {
    if (userInfo) {
      // Fetch user-related data
      dispatch(getUserAddress({ user: userInfo._id }));
      dispatch(getUserOrder({ user: userInfo._id }));
    }
    // eslint-disable-next-line
  }, [userInfo]);

  const displayMenu = () => {
    const menu = document.querySelector("#menu");
    menu.classList.toggle("hidden");
  };

  const displayCart = () => {
    dispatch(cartDisplay(!showCart));
  };

  const hideCategories = () => {
    setShowCategories(false);
  };

  return (
    <section className="w-full relative">
      <header className="max-w-screen-2xl mx-auto z-30 px-4 md:px-6 relative">
        <nav className="flex justify-between items-center relative py-4 md:py-8">
          <div className="flex items-center space-x-4 md:space-x-16">
            <button className="lg:hidden" onClick={displayMenu}>
              <img src={menu} alt="" />
            </button>

            <NavLink to="/">
              <img src={logo} alt="" className="w-32 md:w-40" />
            </NavLink>

            <ul className="hidden lg:flex lg:items-center lg:space-x-8">
              <li>
                <NavLink
                  to="/"
                  className="text-dark-grayish-blue hover:text-very-dark-blue border-b-4 border-transparent hover:border-orange py-8 duration-200"
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/products"
                  className="text-dark-grayish-blue hover:text-very-dark-blue border-b-4 border-transparent hover:border-orange py-8 duration-200"
                >
                  Products
                </NavLink>
              </li>
              <li>
                <div className="relative">
                  <button
                    onClick={() => setShowCategories(!showCategories)}
                    className="text-dark-grayish-blue hover:text-very-dark-blue border-b-4 border-transparent hover:border-orange py-8 duration-200 flex items-center"
                  >
                    Categories
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </button>
                  
                  {showCategories && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-40 border">
                      <div className="py-1">
                        <NavLink
                          to="/categories"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium border-b"
                          onClick={hideCategories}
                        >
                          All Categories
                        </NavLink>
                        {categories.map((category, index) => (
                          <NavLink
                            key={index}
                            to={`/collections?category=${category._id}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={hideCategories}
                          >
                            {category.name}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
              <li>
                <NavLink
                  to="/about"
                  className="text-dark-grayish-blue hover:text-very-dark-blue border-b-4 border-transparent hover:border-orange py-8 duration-200"
                >
                  About
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/contact"
                  className="text-dark-grayish-blue hover:text-very-dark-blue border-b-4 border-transparent hover:border-orange py-8 duration-200"
                >
                  Contact
                </NavLink>
              </li>
            </ul>
          </div>

          <div className="flex items-center space-x-4 md:space-x-7">
            <button className="relative" onClick={displayCart}>
              <svg
                width="22"
                height="20"
                xmlns="http://www.w3.org/2000/svg"
                className="text-dark-grayish-blue hover:text-very-dark-blue duration-200"
              >
                <path
                  d="M20.925 3.641H3.863L3.61.816A.896.896 0 0 0 2.717 0H.897a.896.896 0 1 0 0 1.792h1l1.031 11.483c.073.828.52 1.726 1.291 2.336C2.83 17.385 4.099 20 6.359 20c1.875 0 3.197-1.87 2.554-3.642h4.905c-.642 1.77.677 3.642 2.555 3.642a2.72 2.72 0 0 0 2.717-2.717 2.72 2.72 0 0 0-2.717-2.717H6.365c-.681 0-1.274-.41-1.53-1.009l14.321-.842a.896.896 0 0 0 .817-.677l1.821-7.283a.897.897 0 0 0-.87-1.114ZM6.358 18.208a.926.926 0 0 1 0-1.85.926.926 0 0 1 0 1.85Zm10.015 0a.926.926 0 0 1 0-1.85.926.926 0 0 1 0 1.85Zm2.021-7.243-13.8.81-.57-6.341h15.753l-1.383 5.53Z"
                  fill="currentColor"
                  fillRule="nonzero"
                />
              </svg>
              {total > 0 && (
                <div className="bg-orange text-white text-xs rounded-full h-6 w-6 flex items-center justify-center absolute -top-2 -right-2">
                  {total}
                </div>
              )}
            </button>

            <div className="flex items-center space-x-2">
              {userInfo ? (
                <div className="flex items-center space-x-2">
                  <NavLink
                    to="/user-profile"
                    className="flex items-center space-x-2 hover:opacity-75 duration-200"
                  >
                    <img
                      src={avatar}
                      alt=""
                      className="w-8 h-8 md:w-12 md:h-12 rounded-full border-2 border-transparent hover:border-orange duration-200"
                    />
                    <span className="hidden md:block text-sm text-dark-grayish-blue">
                      {userInfo.firstname}
                    </span>
                  </NavLink>
                  
                  {/* Show cart merge notification */}
                  {cartMerged && (
                    <div className="hidden md:block text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
                      Cart items merged!
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <NavLink
                    to="/login"
                    className="text-sm text-dark-grayish-blue hover:text-very-dark-blue duration-200"
                  >
                    Login
                  </NavLink>
                  <span className="text-dark-grayish-blue">|</span>
                  <NavLink
                    to="/register"
                    className="text-sm text-dark-grayish-blue hover:text-very-dark-blue duration-200"
                  >
                    Register
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* MOBILE MENU */}
        <div
          id="menu"
          className="bg-black bg-opacity-75 absolute top-0 left-0 right-0 bottom-0 z-40 hidden"
        >
          <aside className="bg-white w-3/5 h-screen p-6">
            <button
              onClick={displayMenu}
              className="mb-16"
            >
              <svg width="14" height="15" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="m11.596.782 2.122 2.122L9.12 7.499l4.597 4.597-2.122 2.122L7 9.62l-4.595 4.597-2.122-2.122L4.878 7.5.282 2.904 2.404.782l4.595 4.596L11.596.782Z"
                  fill="#69707D"
                  fillRule="evenodd"
                />
              </svg>
            </button>

            <ul className="space-y-6">
              <li>
                <NavLink
                  to="/"
                  className="text-very-dark-blue font-bold text-lg"
                  onClick={displayMenu}
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/products"
                  className="text-very-dark-blue font-bold text-lg"
                  onClick={displayMenu}
                >
                  Products
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/categories"
                  className="text-very-dark-blue font-bold text-lg"
                  onClick={displayMenu}
                >
                  Categories
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/about"
                  className="text-very-dark-blue font-bold text-lg"
                  onClick={displayMenu}
                >
                  About
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/contact"
                  className="text-very-dark-blue font-bold text-lg"
                  onClick={displayMenu}
                >
                  Contact
                </NavLink>
              </li>
            </ul>
          </aside>
        </div>
      </header>

      {/* CART */}
      <Cart />
    </section>
  );
};

export default Header;
