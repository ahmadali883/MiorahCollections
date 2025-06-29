import { createAsyncThunk, createSlice, } from "@reduxjs/toolkit";
import axios from "axios";


export const createUserCart = createAsyncThunk('cart/createUserCart', async ({ products, _id }, { getState, rejectWithValue }) => {
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

    // GET THE USER'S CART
    let res = await axios.get(`/api/cart/${_id}`, config)

    // CHECK IF THE USER HAS A CART IN DB
    if (res.data === null) {
      // IF NO CART, CREATE CART
      await axios.post(`/api/cart/`, { userId: _id, products }, config)
      // Get the newly created cart
      res = await axios.get(`/api/cart/${_id}`, config)
    }
    
    return res.data ? res.data.products : []
  } catch (err) {
    console.error('Error in createUserCart:', err.response?.data || err.message);
    return rejectWithValue(err.response?.data || 'Error fetching cart')
  }
}
)

export const updateUserCart = createAsyncThunk('cart/updateUserCart', async ({ products, _id }, { getState, rejectWithValue }) => {
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
    
    // UPDATE USER'S CART
    let res = await axios.put(`/api/cart/${_id}`, { products }, config)
    let data = res.data
    
    // Ensure we return an array of products
    return data && data.products ? data.products : []
  } catch (err) {
    console.error('Error in updateUserCart:', err.response?.data || err.message);
    return rejectWithValue(err.response?.data || 'Error updating cart')
  }
}
)

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
    await axios.put(`/api/cart/${_id}`, { products: [] }, config)
    
    // Return empty array to clear the cart
    return []
  } catch (err) {
    console.error('Error in clearUserCart:', err.response?.data || err.message);
    return rejectWithValue(err.response?.data || 'Error clearing cart')
  }
})

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
    let currentCart = await axios.get(`/api/cart/${_id}`, config)
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
      updatedProducts[itemIndex] = {
        ...item,
        quantity: item.quantity - 1,
        itemTotal: item.product.price * (item.quantity - 1)
      };
    } else {
      // Remove item if quantity would become 0
      updatedProducts = updatedProducts.filter(item => item.id !== itemId);
    }
    
    // Update cart in database
    const updateRes = await axios.put(`/api/cart/${_id}`, { products: updatedProducts }, config)
    
    return updateRes.data.products || []
  } catch (err) {
    console.error('Error in decrementUserCartItem:', err.response?.data || err.message);
    return rejectWithValue(err.response?.data || 'Error decrementing item')
  }
})

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
    let res = await axios.get(`/api/cart/${_id}`, config)
    let currentCart = res.data
    
    if (!currentCart || !currentCart.products) {
      return rejectWithValue('Cart not found');
    }
    
    // Remove the item completely
    const updatedProducts = currentCart.products.filter(item => item.id !== itemId);
    
    // Update cart in database
    const updateRes = await axios.put(`/api/cart/${_id}`, { products: updatedProducts }, config)
    
    return updateRes.data.products || []
  } catch (err) {
    console.error('Error in deleteUserCartItem:', err.response?.data || err.message);
    return rejectWithValue(err.response?.data || 'Error deleting item')
  }
})

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
    let res = await axios.get(`/api/cart/${_id}`, config)
    let currentCart = res.data
    
    let currentProducts = currentCart ? currentCart.products : [];
    
    // Check if item already exists in cart
    const existingItemIndex = currentProducts.findIndex(item => item.id === product._id);
    
    if (existingItemIndex !== -1) {
      // Update existing item quantity
      const itemPrice = getProductPrice(product);
      currentProducts[existingItemIndex] = {
        ...currentProducts[existingItemIndex],
        quantity: currentProducts[existingItemIndex].quantity + quantity,
        itemTotal: itemPrice * (currentProducts[existingItemIndex].quantity + quantity)
      };
    } else {
      // Add new item
      const itemPrice = getProductPrice(product);
      currentProducts.push({
        id: product._id,
        product: product,
        quantity: quantity,
        itemTotal: itemPrice * quantity
      });
    }
    
    // Update cart in database
    const updateRes = await axios.put(`/api/cart/${_id}`, { products: currentProducts }, config)
    
    return updateRes.data.products || []
  } catch (err) {
    console.error('Error in addToUserCart:', err.response?.data || err.message);
    return rejectWithValue(err.response?.data || 'Error adding item to cart')
  }
})

// Helper function to get the correct price
const getProductPrice = (product) => {
  // Always use regular price, not discounted price
  return product.price;
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
          state.quantity = Math.min(parseInt(action.payload), 100)
          break;
      }
    },
    addToCart: (state, action) => {
      // INCREASE QUANTITY IF THE STATE IS LESS THAN 1
      state.quantity = state.quantity < 1 ? 1 : state.quantity

      // IF THE ITEM IS ALREADY IN THE CART
      if (state.cartItems.map(item => item.id).includes(action.payload.product._id)) {
        for (let i = 0; i < state.cartItems.length; i++) {
          // GET THE INDEX OF THE ITEM
          if (state.cartItems[i].id === action.payload.product._id) {
            // UPDATE ITS QUANTITY BY ADDING FROM THE CURRENT QUANTITY & ITEM TOTAL STATE
            state.cartItems[i].quantity += state.quantity
            // Use the helper function to get correct price
            const itemPrice = getProductPrice(action.payload.product)
            state.cartItems[i].itemTotal = itemPrice * state.cartItems[i].quantity
          }
        }
      } else {
        // IF ITEM ISN'T IN THE CART
        // Use the helper function to get correct price
        const itemPrice = getProductPrice(action.payload.product)
        state.cartItems = ([...state.cartItems, {
          'id': action.payload.product._id,
          'product': action.payload.product,
          // IF THERE IS A USER OR IF THE USER CART ITEM IS GREATER THAN ONE, CHANGE TO THAT QUANTITY
          'quantity': action.payload.quantity ? action.payload.quantity : state.quantity,
          'itemTotal': itemPrice * (action.payload.quantity ? action.payload.quantity : state.quantity)
        }])
      }
      // Update totals after modifying cart
      state.total = state.cartItems.map(item => item.quantity).reduce((a, b) => a + b, 0);
      state.amountTotal = state.cartItems.map(item => item.itemTotal).reduce((a, b) => a + b, 0);
      // Show cart when item is added
      state.showCart = true;
    },
    deleteItem: (state, action) => {
      // Remove item by product ID instead of title for more reliability
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
          state.cartItems[itemIndex].itemTotal = itemPrice * state.cartItems[itemIndex].quantity;
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
    },
    emptyCart: (state, action) => {
      state.cartItems = []
      state.userCartItems = []
      state.total = 0
      state.amountTotal = 0
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
      state.userCartItems = payload
    },
    [createUserCart.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = true
      state.errMsg = payload.msg ? payload.msg : payload
    },
    [updateUserCart.pending]: (state) => {
      state.loading = true
      state.error = false
    },
    [updateUserCart.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.userCartItems = payload
      state.errMsg = ''
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
    },
    [clearUserCart.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = true
      state.errMsg = payload.msg ? payload.msg : payload
    },
    [decrementUserCartItem.pending]: (state) => {
      state.loading = true
      state.error = false
    },
    [decrementUserCartItem.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.userCartItems = payload
      state.errMsg = ''
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
      state.loading = true
      state.error = false
    },
    [deleteUserCartItem.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.userCartItems = payload
      state.errMsg = ''
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
      state.loading = true
      state.error = false
    },
    [addToUserCart.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.userCartItems = payload
      state.errMsg = ''
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

export const { cartDisplay, addToCart, quantityCount, deleteItem, decrementItem, setTotals, emptyCartOnLogoout, emptyCart } = cartSlice.actions;
export default cartSlice.reducer;