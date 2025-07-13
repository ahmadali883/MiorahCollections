import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  addToCart, 
  addToUserCart, 
  updateUserCartOptimistic,
  quantityCount 
} from "../../redux/reducers/cartSlice";

const ProductDetails = () => {
  const dispatch = useDispatch();
  const product = useSelector((state) => state.product.product);
  const quantity = useSelector((state) => state.cart.quantity);
  const { cartItems, userCartItems, loading } = useSelector((state) => state.cart);
  const { userInfo } = useSelector((state) => state.auth);
  document.title = `${product.name || "Product Details"}`

  useEffect(() => {
    dispatch(quantityCount(1));
    // eslint-disable-next-line
  }, [cartItems]);

  const handleAddToCart = () => {
    if (!product || !product._id) {
      console.error('Product information is missing');
      return;
    }

    if (userInfo) {
      // For logged-in users, use optimistic update for better UX
      dispatch(addToUserCart({ product, quantity, _id: userInfo._id }));
    } else {
      // For guest users, use the local reducer (already optimistic)
      dispatch(addToCart({ product, quantity }));
    }
  };

  // Check if product is already in cart and get current quantity
  const getCartQuantity = () => {
    const items = userInfo ? userCartItems : cartItems;
    const cartItem = items.find(item => item.id === product._id);
    return cartItem ? cartItem.quantity : 0;
  };

  const cartQuantity = getCartQuantity();
  const isInCart = cartQuantity > 0;
  const maxQuantity = 100; // Maximum allowed quantity
  const canAddMore = cartQuantity + quantity <= maxQuantity;

  if (!product || !product._id) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="details flex-1 lg:max-w-md lg:pt-14">
      <div className="p-6 lg:p-0">
        {/* Brand/Company */}
        <p className="text-orange text-xs font-bold tracking-widest mb-3 uppercase">
          {product.category_id?.name || 'Jewelry'}
        </p>
        
        {/* Product Name */}
        <h2 className="text-very-dark-blue text-3xl lg:text-4xl font-bold mb-6 leading-tight">
          {product.name || product.title}
        </h2>
        
        {/* Description */}
        {product.description && (
          <p className="text-dark-grayish-blue text-base leading-relaxed mb-8">
            {product.description}
          </p>
        )}
        
        {/* Price Section */}
        <div className="price-section mb-8">
          <div className="flex items-center space-x-4 mb-2">
            <span className="text-very-dark-blue text-3xl font-bold">
              Rs {(product.price || 0).toFixed(2)}
            </span>
            {product.discountedPrice && product.discountedPrice < product.price && (
              <div className="flex items-center space-x-2">
                <span className="bg-pale-orange text-orange text-sm font-bold px-2 py-1 rounded">
                  -{Math.round(((product.price - product.discountedPrice) / product.price) * 100)}%
                </span>
              </div>
            )}
          </div>
          {product.discountedPrice && product.discountedPrice < product.price && (
            <span className="text-grayish-blue text-lg line-through">
              Rs {product.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="mb-6">
          {product.stock_quantity > 0 ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-600 text-sm font-medium">
                In Stock ({product.stock_quantity} available)
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-red-600 text-sm font-medium">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Cart Status */}
        {isInCart && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L9 12.586l4.293-4.293z" clipRule="evenodd"/>
              </svg>
              <span className="text-green-800 text-sm font-medium">
                {cartQuantity} item{cartQuantity > 1 ? 's' : ''} in your cart
              </span>
            </div>
          </div>
        )}

        {/* Quantity and Add to Cart */}
        {product.stock_quantity > 0 && (
          <div className="cart-section">
            <div className="flex flex-col lg:flex-row lg:space-x-4 space-y-4 lg:space-y-0">
              {/* Quantity Selector */}
              <div className="quantity-selector flex items-center justify-between bg-light-grayish-blue rounded-lg px-4 py-3 lg:flex-1">
                <button
                  className="text-orange font-bold text-xl hover:opacity-50 transition-opacity"
                  onClick={() => dispatch(quantityCount("decrease"))}
                  disabled={quantity <= 1}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                  </svg>
                </button>
                
                <span className="font-bold text-lg text-very-dark-blue min-w-[2rem] text-center">
                  {quantity}
                </span>
                
                <button
                  className="text-orange font-bold text-xl hover:opacity-50 transition-opacity"
                  onClick={() => dispatch(quantityCount("increase"))}
                  disabled={quantity >= maxQuantity || cartQuantity + quantity >= maxQuantity}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                className={`flex-1 lg:flex-2 py-4 px-6 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all ${
                  canAddMore
                    ? 'bg-orange text-white hover:bg-orange-600 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={handleAddToCart}
                disabled={!canAddMore || loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                    </svg>
                    <span>
                      {canAddMore ? 'Add to Cart' : 'Maximum Quantity Reached'}
                    </span>
                  </>
                )}
              </button>
            </div>
            
            {/* Quantity Warning */}
            {!canAddMore && cartQuantity > 0 && (
              <p className="text-yellow-600 text-sm mt-2">
                Maximum quantity limit reached ({maxQuantity} items max)
              </p>
            )}
          </div>
        )}

        {/* Product Features */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
            </svg>
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
            </svg>
            <span>Fast Delivery</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd"/>
            </svg>
            <span>Quality Guaranteed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
