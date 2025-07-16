import { createAsyncThunk, createSlice, } from "@reduxjs/toolkit";
import axios from "../../utils/axiosConfig";
import api from "../../config/api";

// Helper function to validate cart item structure
const validateCartItem = (item) => {
  return (
    item &&
    typeof item === 'object' &&
    item.id &&
    item.product &&
    typeof item.quantity === 'number' &&
    item.quantity > 0 &&
    typeof item.itemTotal === 'number' &&
    item.itemTotal >= 0
  );
};

// Helper function to clean and validate cart data
const cleanCartData = (cartItems) => {
  if (!Array.isArray(cartItems)) return [];
  
  return cartItems
    .filter(validateCartItem)
    .map(item => {
      const cappedQuantity = Math.min(100, Math.max(1, Math.floor(item.quantity))); // Cap at 100, minimum 1
      return {
        id: item.id,
        product: item.product,
        quantity: cappedQuantity,
        itemTotal: parseFloat((getProductPrice(item.product) * cappedQuantity).toFixed(2))
      };
    });
};

// Helper function to merge guest cart with user cart
const mergeCartItems = (guestItems, userItems) => {
  const cleanedGuestItems = cleanCartData(guestItems);
  const cleanedUserItems = cleanCartData(userItems);
  
  if (cleanedGuestItems.length === 0) return cleanedUserItems;
  if (cleanedUserItems.length === 0) return cleanedGuestItems;
  
  const mergedItems = [...cleanedUserItems];
  const userItemIds = new Set(cleanedUserItems.map(item => item.id));
  
  cleanedGuestItems.forEach(guestItem => {
    const existingItemIndex = mergedItems.findIndex(item => item.id === guestItem.id);
    
    if (existingItemIndex !== -1) {
      // Item exists in both carts - combine quantities
      const existingItem = mergedItems[existingItemIndex];
      const combinedQuantity = existingItem.quantity + guestItem.quantity;
      const itemPrice = getProductPrice(existingItem.product);
      
      mergedItems[existingItemIndex] = {
        ...existingItem,
        quantity: Math.min(combinedQuantity, 100), // Cap at 100 items
        itemTotal: parseFloat((itemPrice * Math.min(combinedQuantity, 100)).toFixed(2))
      };
    } else {
      // New item from guest cart
      mergedItems.push(guestItem);
    }
  });
  
  return mergedItems;
};

// Enhanced cart creation with guest cart merging
export const createUserCart = createAsyncThunk('cart/createUserCart', async ({ products, _id, guestCartItems = [] }, { getState, rejectWithValue }) => {
  try {
    const userToken = localStorage.getItem('userToken')
      ? localStorage.getItem('userToken')
      : null
      
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': userToken,
      },
    }

    // GET THE USER'S EXISTING CART
    // let res = await axios.get(`/cart/${_id}`, config)
    let res = await api.get(`/cart/${_id}`, config)
    let existingUserCart = res.data ? res.data.products : [];

    // Merge guest cart with user cart if guest cart has items
    let finalCartItems = guestCartItems.length > 0 
      ? mergeCartItems(guestCartItems, existingUserCart)
      : existingUserCart;

    // If no cart exists in DB or we need to merge, create/update cart
    if (res.data === null || guestCartItems.length > 0) {
      await api.post(`/cart/`, { userId: _id, products: finalCartItems }, config)
      // Get the updated cart
      // res = await axios.get(`/cart/${_id}`, config)
      res = await api.get(`/cart/${_id}`, config)
      finalCartItems = res.data ? res.data.products : [];
    }
    
    return {
      products: cleanCartData(finalCartItems),
      merged: guestCartItems.length > 0,
      mergedItemCount: guestCartItems.length
    };
  } catch (err) {
    // Enhanced error handling
    let errorMessage = 'Failed to load cart.';
    
    if (err.response?.status === 401) {
      errorMessage = 'Session expired. Please login again.';
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
    } else if (err.response?.status === 404) {
      errorMessage = 'Cart not found. Creating new cart.';
    } else if (err.response?.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (!err.response) {
      errorMessage = 'Network error. Please check your connection.';
    }
    
    console.error('Error in createUserCart:', err);
    return rejectWithValue({
      msg: errorMessage,
      status: err.response?.status,
      type: 'CART_LOAD_ERROR'
    });
  }
});

// Optimistic cart update
export const updateUserCartOptimistic = createAsyncThunk('cart/updateUserCartOptimistic', async ({ products, _id }, { getState, rejectWithValue }) => {
  try {
    const cleanedProducts = cleanCartData(products);
    
    const userToken = localStorage.getItem('userToken')
      ? localStorage.getItem('userToken')
      : null
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': userToken,
      },
    }
    
    // Return optimistic update first (for immediate UI response)
    const optimisticReturn = {
      products: cleanedProducts,
      optimistic: true
    };
    
    // Then update server in background
    setTimeout(async () => {
      try {
        // await axios.put(`/cart/${_id}`, { products: cleanedProducts }, config);
        await api.put(`/cart/${_id}`, { products: cleanedProducts }, config);
      } catch (error) {
        console.error('Background cart sync failed:', error);
        // Could dispatch a separate action to handle sync failures
      }
    }, 0);
    
    return optimisticReturn;
  } catch (err) {
    console.error('Error in updateUserCartOptimistic:', err.response?.data || err.message);
    return rejectWithValue(err.response?.data || 'Error updating cart')
  }
});

export const updateUserCart = createAsyncThunk('cart/updateUserCart', async ({ products, _id }, { getState, rejectWithValue }) => {
  try {
    const cleanedProducts = cleanCartData(products);
    
    const userToken = localStorage.getItem('userToken')
      ? localStorage.getItem('userToken')
      : null
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': userToken,
      },
    }
    
    // UPDATE USER'S CART
    // let res = await axios.put(`/cart/${_id}`, { products: cleanedProducts }, config)
    let res = await api.put(`/cart/${_id}`, { products: cleanedProducts }, config)
    let data = res.data
    
    // Ensure we return cleaned array of products
    return cleanCartData(data && data.products ? data.products : []);
  } catch (err) {
    console.error('Error in updateUserCart:', err.response?.data || err.message);
    return rejectWithValue(err.response?.data || 'Error updating cart')
  }
});

export const clearUserCart = createAsyncThunk('cart/clearUserCart', async ({ _id }, { getState, rejectWithValue }) => {
  try {
    const userToken = localStorage.getItem('userToken')
      ? localStorage.getItem('userToken')
      : null
    
    if (!userToken) return rejectWithValue('User not authenticated');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': userToken,
      },
    }
    
    // Update cart with empty products array
    // await axios.put(`/cart/${_id}`, { products: [] }, config)
    await api.put(`/cart/${_id}`, { products: [] }, config)
    
    // Return empty array to clear the cart
    return []
  } catch (err) {
    console.error('Error in clearUserCart:', err.response?.data || err.message);
    return rejectWithValue(err.response?.data || 'Error clearing cart')
  }
});

export const decrementUserCartItem = createAsyncThunk('cart/decrementUserCartItem', async ({ itemId, _id }, { getState, rejectWithValue }) => {
  try {
    const userToken = localStorage.getItem('userToken')
      ? localStorage.getItem('userToken')
      : null
    
    if (!userToken) return rejectWithValue('User not authenticated');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': userToken,
      },
    }
    
    // Get current cart
    let currentCart = await api.get(`/cart/${_id}`, config)
    currentCart = currentCart.data
    
    if (!currentCart || !currentCart.products) {
      return rejectWithValue('Cart not found');
    }
    
    // Find the item to decrement
    const itemIndex = currentCart.products.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return rejectWithValue('Item not found in cart');
    }
    
    const item = currentCart.products[itemIndex];
    let updatedProducts = [...currentCart.products];
    
    if (item.quantity > 1) {
      // Decrement quantity by 1
      const itemPrice = getProductPrice(item.product);
      updatedProducts[itemIndex] = {
        ...item,
        quantity: item.quantity - 1,
        itemTotal: parseFloat((itemPrice * (item.quantity - 1)).toFixed(2))
      };
    } else {
      // Remove item if quantity would become 0
      updatedProducts = updatedProducts.filter(item => item.id !== itemId);
    }
    
    // Clean and validate data
    updatedProducts = cleanCartData(updatedProducts);
    
    // Update cart in database
    // const updateRes = await axios.put(`/cart/${_id}`, { products: updatedProducts }, config)
    const updateRes = await api.put(`/cart/${_id}`, { products: updatedProducts }, config)
    
    return cleanCartData(updateRes.data.products || []);
  } catch (err) {
    console.error('Error in decrementUserCartItem:', err.response?.data || err.message);
    return rejectWithValue(err.response?.data || 'Error decrementing item')
  }
});

export const deleteUserCartItem = createAsyncThunk('cart/deleteUserCartItem', async ({ itemId, _id }, { getState, rejectWithValue }) => {
  try {
    const userToken = localStorage.getItem('userToken')
      ? localStorage.getItem('userToken')
      : null
    
    if (!userToken) return rejectWithValue('User not authenticated');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': userToken,
      },
    }
    
    // Get current cart
    let res = await api.get(`/cart/${_id}`, config)
    let currentCart = res.data
    
    if (!currentCart || !currentCart.products) {
      return rejectWithValue('Cart not found');
    }
    
    // Remove the item completely
    const updatedProducts = cleanCartData(currentCart.products.filter(item => item.id !== itemId));
    
    // Update cart in database
    // const updateRes = await axios.put(`/cart/${_id}`, { products: updatedProducts }, config)
    const updateRes = await api.put(`/cart/${_id}`, { products: updatedProducts }, config)
    
    return cleanCartData(updateRes.data.products || []);
  } catch (err) {
    console.error('Error in deleteUserCartItem:', err.response?.data || err.message);
    return rejectWithValue(err.response?.data || 'Error deleting item')
  }
});

export const addToUserCart = createAsyncThunk('cart/addToUserCart', async ({ product, quantity, _id }, { getState, rejectWithValue }) => {
  try {
    const userToken = localStorage.getItem('userToken')
      ? localStorage.getItem('userToken')
      : null
    
    if (!userToken) return rejectWithValue('User not authenticated');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': userToken,
      },
    }
    
    // Get current cart
    let res = await api.get(`/cart/${_id}`, config)
    let currentCart = res.data
    
    let currentProducts = currentCart ? cleanCartData(currentCart.products) : [];
    
    // Check if item already exists in cart
    const existingItemIndex = currentProducts.findIndex(item => item.id === product._id);
    
    if (existingItemIndex !== -1) {
      // Update existing item quantity
      const itemPrice = getProductPrice(product);
      const newQuantity = Math.min(currentProducts[existingItemIndex].quantity + quantity, 100); // Cap at 100
      currentProducts[existingItemIndex] = {
        ...currentProducts[existingItemIndex],
        quantity: newQuantity,
        itemTotal: parseFloat((itemPrice * newQuantity).toFixed(2))
      };
    } else {
      // Add new item
      const itemPrice = getProductPrice(product);
      const cappedQuantity = Math.min(quantity, 100); // Cap at 100
      currentProducts.push({
        id: product._id,
        product: product,
        quantity: cappedQuantity,
        itemTotal: parseFloat((itemPrice * cappedQuantity).toFixed(2))
      });
    }
    
    // Clean and validate final data
    currentProducts = cleanCartData(currentProducts);
    
    // Update cart in database
    // const updateRes = await axios.put(`/cart/${_id}`, { products: currentProducts }, config)
    const updateRes = await api.put(`/cart/${_id}`, { products: currentProducts }, config)
    
    return cleanCartData(updateRes.data.products || []);
  } catch (err) {
    console.error('Error in addToUserCart:', err.response?.data || err.message);
    return rejectWithValue(err.response?.data || 'Error adding item to cart')
  }
});

// Helper function to get product price (moved to top for use in validation)
const getProductPrice = (product) => {
  // Always use the regular price, not discounted price for cart calculations
  return product?.price || 0;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    showCart: false,
    quantity: 0,
    total: 0,
    itemTotal: 0,
    cartItems: [],
    amountTotal: 0,
    loading: false,
    error: false,
    success: false,
    errMsg: '',
    userCartItems: [],
    lastSynced: null, // Track last sync time
    optimisticUpdates: [], // Track optimistic updates
    cartMerged: false, // Track if guest cart was merged
  },
  reducers: {
    cartDisplay: (state, action) => {
      state.showCart = action.payload
    },
    quantityCount: (state, action) => {
      switch (action.payload) {
        case '':
          state.quantity = 0
          break;
        case 'decrease':
          state.quantity = Math.max(state.quantity - 1, 0)
          break;
        case 'increase':
          state.quantity = Math.min(state.quantity + 1, 100)
          break;
        default:
          state.quantity = Math.min(parseInt(action.payload) || 0, 100)
          break;
      }
    },
    addToCart: (state, action) => {
      // INCREASE QUANTITY IF THE STATE IS LESS THAN 1
      state.quantity = state.quantity < 1 ? 1 : state.quantity

      // Clean existing cart items
      state.cartItems = cleanCartData(state.cartItems);

      // IF THE ITEM IS ALREADY IN THE CART
      if (state.cartItems.map(item => item.id).includes(action.payload.product._id)) {
        for (let i = 0; i < state.cartItems.length; i++) {
          // GET THE INDEX OF THE ITEM
          if (state.cartItems[i].id === action.payload.product._id) {
            // UPDATE ITS QUANTITY BY ADDING FROM THE CURRENT QUANTITY & ITEM TOTAL STATE
            const newQuantity = Math.min(state.cartItems[i].quantity + state.quantity, 100);
            state.cartItems[i].quantity = newQuantity;
            // Use the helper function to get correct price
            const itemPrice = getProductPrice(action.payload.product)
            state.cartItems[i].itemTotal = parseFloat((itemPrice * newQuantity).toFixed(2));
          }
        }
      } else {
        // IF ITEM ISN'T IN THE CART
        // Use the helper function to get correct price
        const itemPrice = getProductPrice(action.payload.product)
        const finalQuantity = action.payload.quantity ? Math.min(action.payload.quantity, 100) : Math.min(state.quantity, 100);
        state.cartItems = ([...state.cartItems, {
          'id': action.payload.product._id,
          'product': action.payload.product,
          'quantity': finalQuantity,
          'itemTotal': parseFloat((itemPrice * finalQuantity).toFixed(2))
        }])
      }
      // Update totals after modifying cart
      state.total = state.cartItems.map(item => item.quantity).reduce((a, b) => a + b, 0);
      state.amountTotal = state.cartItems.map(item => item.itemTotal).reduce((a, b) => a + b, 0);
      // Show cart when item is added
      state.showCart = true;
    },
    deleteItem: (state, action) => {
      // Remove item by product ID
      state.cartItems = state.cartItems.filter(item => item.id !== action.payload);
      // Update totals after removing item
      state.total = state.cartItems.map(item => item.quantity).reduce((a, b) => a + b, 0);
      state.amountTotal = state.cartItems.map(item => item.itemTotal).reduce((a, b) => a + b, 0);
    },
    decrementItem: (state, action) => {
      const itemIndex = state.cartItems.findIndex(item => item.id === action.payload);
      if (itemIndex !== -1) {
        const item = state.cartItems[itemIndex];
        if (item.quantity > 1) {
          // Decrement quantity by 1
          state.cartItems[itemIndex].quantity -= 1;
          // Recalculate item total
          const itemPrice = getProductPrice(item.product);
          state.cartItems[itemIndex].itemTotal = parseFloat((itemPrice * state.cartItems[itemIndex].quantity).toFixed(2));
        } else {
          // Remove item if quantity would become 0
          state.cartItems = state.cartItems.filter(item => item.id !== action.payload);
        }
        // Update totals after modifying cart
        state.total = state.cartItems.map(item => item.quantity).reduce((a, b) => a + b, 0);
        state.amountTotal = state.cartItems.map(item => item.itemTotal).reduce((a, b) => a + b, 0);
      }
    },
    setTotals: (state, action) => {
      // Determine which cart items to use for totals
      const itemsToCalculate = state.userCartItems.length > 0 ? state.userCartItems : state.cartItems;
      state.total = itemsToCalculate.map(item => item.quantity).reduce((a, b) => a + b, 0);
      state.amountTotal = itemsToCalculate.map(item => item.itemTotal).reduce((a, b) => a + b, 0);
    },
    emptyCartOnLogoout: (state, action) => {
      state.cartItems = []
      state.userCartItems = []
      state.total = 0
      state.amountTotal = 0
      state.cartMerged = false
      state.optimisticUpdates = []
    },
    emptyCart: (state, action) => {
      state.cartItems = []
      state.userCartItems = []
      state.total = 0
      state.amountTotal = 0
      state.cartMerged = false
      state.optimisticUpdates = []
    },
    cleanupCart: (state, action) => {
      // Clean up and validate cart data
      state.cartItems = cleanCartData(state.cartItems);
      state.userCartItems = cleanCartData(state.userCartItems);
      // Recalculate totals
      const itemsToCalculate = state.userCartItems.length > 0 ? state.userCartItems : state.cartItems;
      state.total = itemsToCalculate.map(item => item.quantity).reduce((a, b) => a + b, 0);
      state.amountTotal = itemsToCalculate.map(item => item.itemTotal).reduce((a, b) => a + b, 0);
    },
    clearError: (state) => {
      state.error = false;
      state.errMsg = '';
    }
  },
  extraReducers: {
    [createUserCart.pending]: (state) => {
      state.loading = true
      state.error = false
    },
    [createUserCart.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.success = true
      state.errMsg = ''
      state.userCartItems = cleanCartData(payload.products || payload)
      state.lastSynced = Date.now()
      
      if (payload.merged) {
        state.cartMerged = true
        // Clear guest cart after successful merge
        state.cartItems = []
        // Show notification about merged items
        if (payload.mergedItemCount > 0) {
          state.success = `Merged ${payload.mergedItemCount} item(s) from your guest cart!`
        }
      }
    },
    [createUserCart.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = true
      state.errMsg = payload.msg ? payload.msg : payload
    },
    
    [updateUserCartOptimistic.pending]: (state) => {
      // Don't show loading for optimistic updates
      state.error = false
    },
    [updateUserCartOptimistic.fulfilled]: (state, { payload }) => {
      state.userCartItems = cleanCartData(payload.products)
      state.errMsg = ''
      if (payload.optimistic) {
        state.optimisticUpdates.push(Date.now())
      }
      state.lastSynced = Date.now()
    },
    [updateUserCartOptimistic.rejected]: (state, { payload }) => {
      state.error = true
      state.errMsg = payload.msg ? payload.msg : payload
    },
    
    [updateUserCart.pending]: (state) => {
      state.loading = true
      state.error = false
    },
    [updateUserCart.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.userCartItems = cleanCartData(payload)
      state.errMsg = ''
      state.lastSynced = Date.now()
      // Clear optimistic updates as server has confirmed
      state.optimisticUpdates = []
    },
    [updateUserCart.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = true
      state.errMsg = payload.msg ? payload.msg : payload
    },
    [clearUserCart.pending]: (state) => {
      state.loading = true
      state.error = false
    },
    [clearUserCart.fulfilled]: (state) => {
      state.loading = false
      state.userCartItems = []
      state.cartItems = []
      state.amountTotal = 0
      state.total = 0
      state.errMsg = ''
      state.lastSynced = Date.now()
    },
    [clearUserCart.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = true
      state.errMsg = payload.msg ? payload.msg : payload
    },
    [decrementUserCartItem.pending]: (state) => {
      // Use optimistic update for better UX
      state.error = false
    },
    [decrementUserCartItem.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.userCartItems = cleanCartData(payload)
      state.errMsg = ''
      state.lastSynced = Date.now()
      // Update totals based on userCartItems
      state.total = payload.map(item => item.quantity).reduce((a, b) => a + b, 0)
      state.amountTotal = payload.map(item => item.itemTotal).reduce((a, b) => a + b, 0)
    },
    [decrementUserCartItem.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = true
      state.errMsg = payload.msg ? payload.msg : payload
    },
    [deleteUserCartItem.pending]: (state) => {
      // Use optimistic update for better UX
      state.error = false
    },
    [deleteUserCartItem.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.userCartItems = cleanCartData(payload)
      state.errMsg = ''
      state.lastSynced = Date.now()
      // Update totals based on userCartItems
      state.total = payload.map(item => item.quantity).reduce((a, b) => a + b, 0)
      state.amountTotal = payload.map(item => item.itemTotal).reduce((a, b) => a + b, 0)
    },
    [deleteUserCartItem.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = true
      state.errMsg = payload.msg ? payload.msg : payload
    },
    [addToUserCart.pending]: (state) => {
      // Use optimistic update for better UX
      state.error = false
    },
    [addToUserCart.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.userCartItems = cleanCartData(payload)
      state.errMsg = ''
      state.lastSynced = Date.now()
      // Update totals based on userCartItems
      state.total = payload.map(item => item.quantity).reduce((a, b) => a + b, 0)
      state.amountTotal = payload.map(item => item.itemTotal).reduce((a, b) => a + b, 0)
      // Show cart when item is added
      state.showCart = true;
    },
    [addToUserCart.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = true
      state.errMsg = payload.msg ? payload.msg : payload
    }
  }
})

export const { 
  cartDisplay, 
  quantityCount, 
  addToCart, 
  deleteItem, 
  decrementItem, 
  setTotals, 
  emptyCartOnLogoout, 
  emptyCart,
  cleanupCart,
  clearError
} = cartSlice.actions

export default cartSlice.reducer