import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from '../../utils/axiosConfig';

import api from '../../config/api';

export const getAllProducts = createAsyncThunk(
  'product/getAllProducts',
  async (thunkAPI) => {
    let res = await api.get('/products/')
    let products = res.data
    return products
  })

export const getProductsByCollection = createAsyncThunk(
  'product/getProductsByCollection',
  async (collection, thunkAPI) => {
    let res = await api.get(`/products/?category=${collection}`)
    let productsCollection = res.data
    return productsCollection
  })

export const getCategories = createAsyncThunk(
  'product/getCategories',
  async (thunkAPI) => {
    let res = await api.get('/categories/')
    return res.data
  })

// Inventory Management Actions
export const getAdminProducts = createAsyncThunk('product/getAdminProducts', async (params, { rejectWithValue }) => {
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

    const queryParams = new URLSearchParams(params).toString()
    let { data } = await api.get(`/products/admin/all?${queryParams}`, config)
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
})

export const updateProduct = createAsyncThunk('product/updateProduct', async ({ productId, productData }, { rejectWithValue }) => {
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

    let { data } = await api.put(`/products/${productId}`, productData, config)
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
})

export const deleteProduct = createAsyncThunk('product/deleteProduct', async (productId, { rejectWithValue }) => {
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

    let { data } = await api.delete(`/products/${productId}`, config)
    return { productId, message: data.msg }

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
})

export const getLowStockProducts = createAsyncThunk('product/getLowStockProducts', async (threshold = 10, { rejectWithValue }) => {
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

    let { data } = await api.get(`/products/inventory/low-stock?threshold=${threshold}`, config)
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
})

export const getInventoryStats = createAsyncThunk('product/getInventoryStats', async (_, { rejectWithValue }) => {
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

    let { data } = await api.get('/products/inventory/stats', config)
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
})

export const bulkUpdateProducts = createAsyncThunk('product/bulkUpdateProducts', async ({ productIds, updates, operation }, { rejectWithValue }) => {
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

    let { data } = await api.put('/products/inventory/bulk-update', { productIds, updates, operation }, config)
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
})

const productSlice = createSlice({
  name: 'product',
  initialState: {
    products: [],
    filteredProducts: [],
    images: [],
    curIndex: 0,
    slideIndex: 0,
    productId: 0,
    product: {},
    loading: true,
    error: false,
    errMsg: '',
    filter: { category: '', color: '' },
    containFilters: [],
    sort: 'newest',
    colors: [],
    categories: [],
    brands: [],
    collection: [],
    lastRefresh: null, // Add this to track last refresh time
    // Inventory management state
    adminProducts: [],
    lowStockProducts: [],
    inventoryStats: null,
    productsPagination: null,
    inventoryLoading: false,
    inventoryError: false,
    inventoryErrorMsg: '',
    bulkUpdateLoading: false,
    selectedProducts: [],
  },
  reducers: {
    getProducts: (state, action) => {
      state.products = action.payload.products
      state.loading = false
    },
    // Inventory management reducers
    toggleProductSelection: (state, action) => {
      const productId = action.payload;
      const index = state.selectedProducts.indexOf(productId);
      if (index > -1) {
        state.selectedProducts.splice(index, 1);
      } else {
        state.selectedProducts.push(productId);
      }
    },
    selectAllProducts: (state) => {
      state.selectedProducts = state.adminProducts.map(product => product._id);
    },
    clearProductSelection: (state) => {
      state.selectedProducts = [];
    },
    clearInventoryError: (state) => {
      state.inventoryError = false;
      state.inventoryErrorMsg = '';
    },
    setError: (state, action) => {
      state.loading = false
      state.error = true
      state.errMsg = action.payload.err
    },
    getFilteredProducts: (state, action) => {
      state.filteredProducts = state.products.filter((item) =>
        item.categories?.at(-1)?.gender?.includes(action.payload.gender)
      )
    },
    changeImage: (state, action) => {
      // CHANGE PREVIEW IMG ON CLICK
      state.curIndex = action.payload.index
    },
    prevPreview: (state, action) => {
      if (state.curIndex < 1) {
        state.curIndex = 0
      } else {
        state.curIndex -= 1
      }
    },
    nextPreview: (state, action) => {
      if (state.curIndex > (state.images.length - 2)) {
        state.curIndex = state.images.length - 1
      } else {
        state.curIndex += 1
      }
    },
    prevSlide: (state, action) => {
      if (state.slideIndex < 1) {
        state.slideIndex = 0
      } else {
        state.slideIndex -= 1
      }
    },
    nextSlide: (state, action) => {
      if (state.slideIndex > (state.images.length - 2)) {
        state.slideIndex = state.images.length - 1
      } else if ((state.slideIndex > (state.images.length - 3) && window.innerWidth > 640)) {
        state.slideIndex = state.images.length - 2
      }
      else {
        state.slideIndex += 1
      }
    },
    getProductItem: (state, action) => {
      state.productId = action.payload.productId
      state.product = state.products.filter((item) => item._id === state.productId)[0] || {}
      state.images = state.error || !state.product.images ? [] : state.product.images
    },
    getFilters: (state, action) => {
      // GET LIST OF ALL COLORS
      // This is simplified for now - you may need to adapt based on your data
      state.colors = Array.from(new Set(['black', 'white', 'red', 'blue', 'green', 'brown', 'yellow'])).sort()

      // GET LIST OF CATEGORIES - ensure they're properly formatted
      if (state.categories.length > 0) {
        // Categories might already be loaded from API with proper structure
        // Just ensure they're in the right format for the filter
        state.categories = state.categories.map(cat =>
          typeof cat === 'object' ? cat : { name: cat }
        );
      } else {
        // If no categories exist yet, try to extract them from products
        state.categories = Array.from(new Set(
          (state.filteredProducts.length > 0 ? state.filteredProducts : state.products)
            .map(item => item.category_id?.name)
            .filter(Boolean)
        )).sort().map(name => ({ name }));
      }

      // GET LIST OF ALL BRANDS (ASSUMING IT'S STORED IN A CUSTOM FIELD)
      // This is a placeholder - you'll need to adapt based on your actual data structure
      state.brands = Array.from(new Set(['Nike', 'Adidas', 'Puma', 'New Balance'])).sort()
    },
    selectFilters: (state, action) => {
      state.filter = action.payload.filter

      // Return an array of true and false based on if the product contains a filter
      if (state.filter.category === '' && state.filter.color === '') {
        state.containFilters = (state.filteredProducts.length < 1 ? state.products : state.filteredProducts).map(item => true)
      } else if (state.filter.category !== '' && state.filter.color === '') {
        state.containFilters = (state.filteredProducts.length < 1 ? state.products : state.filteredProducts).map(item =>
          item.category_id?.name === state.filter.category
        )
      } else {
        // This is simplified - you'll need to adapt color filtering based on your data
        state.containFilters = (state.filteredProducts.length < 1 ? state.products : state.filteredProducts).map(item =>
          (state.filter.category === '' || item.category_id?.name === state.filter.category)
        )
      }
    },
    selectSort: (state, action) => {
      state.sort = action.payload.sort
      let items = state.filteredProducts.length < 1 ? state.products : state.filteredProducts

      switch (action.payload.sort) {
        case 'newest':
          items = (state.filteredProducts.length < 1 ? state.products : state.filteredProducts).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          break;
        case 'asc':
          items = (state.filteredProducts.length < 1 ? state.products : state.filteredProducts).sort((a, b) => a.discountPrice - b.discountPrice)
          break;
        case 'desc':
          items = (state.filteredProducts.length < 1 ? state.products : state.filteredProducts).sort((a, b) => b.discountPrice - a.discountPrice)
          break;
        default:
          // eslint-disable-next-line
          items = (state.filteredProducts.length < 1 ? state.products : state.filteredProducts).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          break;
      }
    }
  },
  extraReducers: {
    [getAllProducts.pending]: (state) => {
      state.loading = true
    },
    [getAllProducts.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.products = payload
      state.containFilters = state.products.map(item => true)
      state.lastRefresh = Date.now() // Update last refresh timestamp
    },
    [getAllProducts.rejected]: (state, action) => {
      state.loading = false
      state.error = true
      state.errMsg = action.error.message
    },
    [getProductsByCollection.pending]: (state) => {
      state.loading = true
    },
    [getProductsByCollection.fulfilled]: (state, { payload, meta, collection }) => {
      state.loading = false
      state.collection = payload
    },
    [getProductsByCollection.rejected]: (state, action) => {
      state.loading = false
      state.error = true
      state.errMsg = action.error.message
    },
    [getCategories.pending]: (state) => {
      state.loading = true
    },
    [getCategories.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.categories = payload
      state.lastRefresh = Date.now() // Update last refresh timestamp
    },
    [getCategories.rejected]: (state, action) => {
      state.loading = false
      state.error = true
      state.errMsg = action.error.message
    },
    // Inventory Management Extra Reducers
    [getAdminProducts.pending]: (state) => {
      state.inventoryLoading = true
      state.inventoryError = false
    },
    [getAdminProducts.fulfilled]: (state, { payload }) => {
      state.inventoryLoading = false
      state.adminProducts = payload.products
      state.productsPagination = payload.pagination
      state.inventoryErrorMsg = ''
    },
    [getAdminProducts.rejected]: (state, { payload }) => {
      state.inventoryLoading = false
      state.inventoryError = true
      state.inventoryErrorMsg = payload.msg || payload
    },
    [updateProduct.pending]: (state) => {
      state.inventoryLoading = true
      state.inventoryError = false
    },
    [updateProduct.fulfilled]: (state, { payload }) => {
      state.inventoryLoading = false
      // Update the product in the admin products list
      const productIndex = state.adminProducts.findIndex(product => product._id === payload._id)
      if (productIndex !== -1) {
        state.adminProducts[productIndex] = payload
      }
      // Also update in regular products if it exists
      const regularProductIndex = state.products.findIndex(product => product._id === payload._id)
      if (regularProductIndex !== -1) {
        state.products[regularProductIndex] = payload
      }
      state.inventoryErrorMsg = ''
    },
    [updateProduct.rejected]: (state, { payload }) => {
      state.inventoryLoading = false
      state.inventoryError = true
      state.inventoryErrorMsg = payload.msg || payload
    },
    [deleteProduct.pending]: (state) => {
      state.inventoryLoading = true
      state.inventoryError = false
    },
    [deleteProduct.fulfilled]: (state, { payload }) => {
      state.inventoryLoading = false
      // Remove from admin products
      state.adminProducts = state.adminProducts.filter(product => product._id !== payload.productId)
      // Update in regular products (mark as inactive)
      const regularProductIndex = state.products.findIndex(product => product._id === payload.productId)
      if (regularProductIndex !== -1) {
        state.products[regularProductIndex].is_active = false
      }
      state.inventoryErrorMsg = ''
    },
    [deleteProduct.rejected]: (state, { payload }) => {
      state.inventoryLoading = false
      state.inventoryError = true
      state.inventoryErrorMsg = payload.msg || payload
    },
    [getLowStockProducts.pending]: (state) => {
      state.inventoryLoading = true
      state.inventoryError = false
    },
    [getLowStockProducts.fulfilled]: (state, { payload }) => {
      state.inventoryLoading = false
      state.lowStockProducts = payload
      state.inventoryErrorMsg = ''
    },
    [getLowStockProducts.rejected]: (state, { payload }) => {
      state.inventoryLoading = false
      state.inventoryError = true
      state.inventoryErrorMsg = payload.msg || payload
    },
    [getInventoryStats.pending]: (state) => {
      state.inventoryLoading = true
      state.inventoryError = false
    },
    [getInventoryStats.fulfilled]: (state, { payload }) => {
      state.inventoryLoading = false
      state.inventoryStats = payload
      state.inventoryErrorMsg = ''
    },
    [getInventoryStats.rejected]: (state, { payload }) => {
      state.inventoryLoading = false
      state.inventoryError = true
      state.inventoryErrorMsg = payload.msg || payload
    },
    [bulkUpdateProducts.pending]: (state) => {
      state.bulkUpdateLoading = true
      state.inventoryError = false
    },
    [bulkUpdateProducts.fulfilled]: (state, { payload }) => {
      state.bulkUpdateLoading = false
      state.inventoryErrorMsg = ''
      // Optionally refresh the admin products list after bulk update
    },
    [bulkUpdateProducts.rejected]: (state, { payload }) => {
      state.bulkUpdateLoading = false
      state.inventoryError = true
      state.inventoryErrorMsg = payload.msg || payload
    }
  }
})

export const {
  getProducts, setError, getFilteredProducts, changeImage,
  prevPreview, nextPreview, prevSlide, nextSlide,
  getProductItem, quantityCount, selectFilters, selectSort, getFilters,
  toggleProductSelection, selectAllProducts, clearProductSelection, clearInventoryError
} = productSlice.actions;

export default productSlice.reducer;