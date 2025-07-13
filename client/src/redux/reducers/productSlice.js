import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from '../../utils/axiosConfig';

export const getAllProducts = createAsyncThunk(
  'product/getAllProducts',
  async (thunkAPI) => {
    let res = await axios.get('/products/')
    let products = res.data
    return products
  })

export const getProductsByCollection = createAsyncThunk(
  'product/getProductsByCollection',
  async (collection, thunkAPI) => {
    let res = await axios.get(`/products/?category=${collection}`)
    let productsCollection = res.data
    return productsCollection
  })

export const getCategories = createAsyncThunk(
  'product/getCategories',
  async (thunkAPI) => {
    let res = await axios.get('/categories/')
    return res.data
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
    lastRefresh: null // Add this to track last refresh time
  },
  reducers: {
    getProducts: (state, action) => {
      state.products = action.payload.products
      state.loading = false
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
    }
  }
})

export const {
  getProducts, setError, getFilteredProducts, changeImage,
  prevPreview, nextPreview, prevSlide, nextSlide,
  getProductItem, quantityCount, selectFilters, selectSort, getFilters
} = productSlice.actions;

export default productSlice.reducer;