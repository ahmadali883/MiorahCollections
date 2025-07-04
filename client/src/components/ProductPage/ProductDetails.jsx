import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, addToUserCart, quantityCount } from "../../redux/reducers/cartSlice";

const ProductDetails = () => {
  const dispatch = useDispatch();
  const product = useSelector((state) => state.product.product);
  const quantity = useSelector((state) => state.cart.quantity);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const { userInfo } = useSelector((state) => state.auth);
  document.title = `${product.name || "Product Details"}`

  useEffect(() => {
    dispatch(quantityCount(1));
    // eslint-disable-next-line
  }, [cartItems]);

  const handleAddToCart = () => {
    if (userInfo) {
      // For logged-in users, use the async thunk
      dispatch(addToUserCart({ product, quantity, _id: userInfo._id }));
    } else {
      // For guest users, use the local reducer
      dispatch(addToCart({ product, quantity }));
    }
  };

  return (
    <>
      <h2 className="company uppercase text-orange font-bold text-sm sm:text-md tracking-wider pb-3 sm:pb-5">
        {product.category_id?.name || "Unknown Category"}
      </h2>
      <h3 className="product capitalize text-very-dark-blue font-bold text-3xl sm:text-4xl sm:leading-none pb-3">
        {product.name}
      </h3>
      <p className="text-dark-grayish-blue pb-6 lg:py-7 lg:leading-6">
        {product.description}
      </p>
      <div className="amount flex items-center justify-between lg:flex-col lg:items-start mb-6">
        <div className="price items-center flex lg:w-1/3 justify-between">
          <div className="price text-3xl font-normal">Rs. {product.price}</div>
        </div>
      </div>
      <div className="sm:flex lg:mt-8 w-full">
        <div className="quantity-container w-full bg-light-grayish-blue rounded-lg h-14 mb-4 flex items-center justify-between px-6 lg:px-3 font-bold sm:mr-3 lg:mr-5 lg:w-1/3">
          <button
            onClick={() => dispatch(quantityCount("decrease"))}
            className="text-orange text-2xl leading-none font-bold mb-1 lg:mb-2 lg:text-3xl hover:opacity-60"
          >
            -
          </button>
          <input
            min={0}
            max={100}
            onChange={(e) => dispatch(quantityCount(e.target.value))}
            className="quantity focus:outline-none text-dark-blue bg-light-grayish-blue font-bold flex text-center w-full"
            type="number"
            name="quantity"
            value={quantity}
            aria-label="quantity of products"
          />
          <button
            onClick={() => dispatch(quantityCount("increase"))}
            className="text-orange text-2xl leading-none font-bold mb-1 lg:mb-2 lg:text-3xl hover:opacity-60"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          className="cart w-full h-14 bg-orange rounded-lg lg:rounded-xl mb-2 shadow-orange-shadow shadow-2xl text-white flex items-center justify-center lg:w-3/5 hover:opacity-60"
          disabled={product.stock_quantity <= 0}
        >
          <i className="cursor-pointer text-white text-xl leading-0 pr-3">
            <ion-icon name="cart-outline"></ion-icon>
          </i>
          {product.stock_quantity > 0 ? "Add to cart" : "Out of stock"}
        </button>
      </div>
      {product.sku && (
        <div className="mt-4 text-dark-grayish-blue">
          <p>SKU: {product.sku}</p>
        </div>
      )}
    </>
  );
};

export default ProductDetails;
