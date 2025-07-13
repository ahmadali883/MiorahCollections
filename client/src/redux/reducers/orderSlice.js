import { createAsyncThunk, createSlice, } from "@reduxjs/toolkit";
import axios from "../../utils/axiosConfig";

export const getUserOrder = createAsyncThunk('order/getUserOrder', async ({ user }, { rejectWithValue }) => {
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

    let { data } = await axios.get(`/orders/${user}`, config)
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
})

// Admin order management actions
export const getAdminOrders = createAsyncThunk('order/getAdminOrders', async (params, { rejectWithValue }) => {
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
    let { data } = await axios.get(`/orders/admin?${queryParams}`, config)
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
})

export const getOrderDetails = createAsyncThunk('order/getOrderDetails', async (orderId, { rejectWithValue }) => {
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

    let { data } = await axios.get(`/orders/admin/${orderId}`, config)
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
})

export const updateOrderStatus = createAsyncThunk('order/updateOrderStatus', async ({ orderId, status }, { rejectWithValue }) => {
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

    let { data } = await axios.put(`/orders/admin/${orderId}/status`, { status }, config)
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
})

export const getOrderStats = createAsyncThunk('order/getOrderStats', async (_, { rejectWithValue }) => {
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

    let { data } = await axios.get('/orders/admin/stats', config)
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
})

export const createOrder = createAsyncThunk('order/createOrder', async (orderData, { getState, rejectWithValue }) => {
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
    
    let res = await axios.get(`/orders/${orderData.user}`, config)


    // PREVENT DUPLICATED ORDER
    if (res.data.filter(item => item.paymentID === orderData.paymentID).length > 0) {
      // ORDER ALREADY MADE
    } else {
      await axios.post(`/orders/`,
        (orderData)
        , config)
    }

    let { data } = await axios.get(`/orders/${orderData.user}`, config)
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
}
)

export const createGuestOrder = createAsyncThunk('order/createGuestOrder', async (orderData, { rejectWithValue }) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    
    // For guest orders, just create the order without checking for duplicates
    let res = await axios.post('/orders/guest', orderData, config)
    return res.data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
}
)


const orderSlice = createSlice({
  name: "order",
  initialState: {
    loading: false,
    error: false,
    success: false,
    errMsg: '',
    orders: [],
    // Admin order management state
    adminOrders: [],
    orderDetails: null,
    orderStats: null,
    pagination: null,
    adminLoading: false,
    adminError: false,
    adminErrorMsg: '',
  },
  reducers: {
    clearOrderDetails: (state) => {
      state.orderDetails = null;
    },
    clearAdminError: (state) => {
      state.adminError = false;
      state.adminErrorMsg = '';
    },
  },
  extraReducers: {
    [getUserOrder.pending]: (state) => {
      state.loading = true
      state.error = false
    },
    [getUserOrder.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.orders = payload
      state.errorMsg = ''
    },
    [getUserOrder.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = true
      state.errorMsg = payload
      state.success = false
    },
    [createOrder.pending]: (state) => {
      state.loading = true
      state.error = false
      state.success = false
    },
    [createOrder.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.orders = payload
      state.errorMsg = ''
      state.success = true
    },
    [createOrder.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = true
      state.errorMsg = payload.msg ? payload.msg : payload
      state.success = false
    },
    [createGuestOrder.pending]: (state) => {
      state.loading = true
      state.error = false
      state.success = false
    },
    [createGuestOrder.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.errorMsg = ''
      state.success = true
      // For guest orders, we don't update the orders array since they can't view order history
    },
    [createGuestOrder.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = true
      state.errorMsg = payload.msg ? payload.msg : payload
      state.success = false
    },
    // Admin order management reducers
    [getAdminOrders.pending]: (state) => {
      state.adminLoading = true
      state.adminError = false
    },
    [getAdminOrders.fulfilled]: (state, { payload }) => {
      state.adminLoading = false
      state.adminOrders = payload.orders
      state.pagination = payload.pagination
      state.adminErrorMsg = ''
    },
    [getAdminOrders.rejected]: (state, { payload }) => {
      state.adminLoading = false
      state.adminError = true
      state.adminErrorMsg = payload.msg ? payload.msg : payload
    },
    [getOrderDetails.pending]: (state) => {
      state.adminLoading = true
      state.adminError = false
    },
    [getOrderDetails.fulfilled]: (state, { payload }) => {
      state.adminLoading = false
      state.orderDetails = payload
      state.adminErrorMsg = ''
    },
    [getOrderDetails.rejected]: (state, { payload }) => {
      state.adminLoading = false
      state.adminError = true
      state.adminErrorMsg = payload.msg ? payload.msg : payload
    },
    [updateOrderStatus.pending]: (state) => {
      state.adminLoading = true
      state.adminError = false
    },
    [updateOrderStatus.fulfilled]: (state, { payload }) => {
      state.adminLoading = false
      // Update the order in the list
      const orderIndex = state.adminOrders.findIndex(order => order._id === payload.order._id)
      if (orderIndex !== -1) {
        state.adminOrders[orderIndex] = payload.order
      }
      // Update order details if it's the same order
      if (state.orderDetails && state.orderDetails._id === payload.order._id) {
        state.orderDetails = payload.order
      }
      state.adminErrorMsg = ''
    },
    [updateOrderStatus.rejected]: (state, { payload }) => {
      state.adminLoading = false
      state.adminError = true
      state.adminErrorMsg = payload.msg ? payload.msg : payload
    },
    [getOrderStats.pending]: (state) => {
      state.adminLoading = true
      state.adminError = false
    },
    [getOrderStats.fulfilled]: (state, { payload }) => {
      state.adminLoading = false
      state.orderStats = payload
      state.adminErrorMsg = ''
    },
    [getOrderStats.rejected]: (state, { payload }) => {
      state.adminLoading = false
      state.adminError = true
      state.adminErrorMsg = payload.msg ? payload.msg : payload
    }
  }
})

export const { clearOrderDetails, clearAdminError } = orderSlice.actions;
export default orderSlice.reducer
