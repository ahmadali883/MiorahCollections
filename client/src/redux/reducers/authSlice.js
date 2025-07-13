import { createAsyncThunk, createSlice, } from "@reduxjs/toolkit";
import axios from "axios";

export const registerUser = createAsyncThunk("auth/registerUser", async ({ firstname, lastname, username, email, password }, { rejectWithValue }) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    
    let res = await axios.post("/api/users", { firstname, lastname, username, email, password }, config)
    let data = res.data
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
}
)

export const loginUser = createAsyncThunk("auth/loginUser", async ({ email, password }, { rejectWithValue }) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    
    let res = await axios.post("/api/auth", { email, password }, config)
    let data = res.data

    // Store token and user info with timestamp
    localStorage.setItem('userToken', data.token)
    localStorage.setItem('userInfo', JSON.stringify(data.user))
    localStorage.setItem('tokenTimestamp', Date.now().toString())
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
}
)

export const getUserDetails = createAsyncThunk('user/getUserDetails', async (arg, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState()

    const config = {
      headers: {
        'x-auth-token': auth.userToken,
      },
    }
    const { data } = await axios.get(`/api/auth`, config)
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
}
)

export const updateUser = createAsyncThunk('user/updateUser', async ({ userData, _id }, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState()

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': auth.userToken,
      },
    }
    const { data } = await axios.put(`/api/users/${_id}`, userData, config)
    return data

  } catch (err) {
    return rejectWithValue(err.response.data)
  }
}
)

// Enhanced token refresh functionality
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.userToken) {
        return rejectWithValue('No token available');
      }

      const config = {
        headers: {
          'x-auth-token': auth.userToken,
        },
      };
      
      // Call the refresh endpoint (we'll need to create this)
      const { data } = await axios.post('/api/auth/refresh', {}, config);
      
      // Store new token with timestamp
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('tokenTimestamp', Date.now().toString());
      
      return { token: data.token, user: auth.userInfo };
    } catch (err) {
      // If refresh fails, clear everything
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('tokenTimestamp');
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Enhanced load user from storage with race condition prevention
export const loadUserFromStorage = createAsyncThunk(
  'auth/loadUserFromStorage',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      // Prevent multiple simultaneous calls
      if (auth.refreshing) {
        return rejectWithValue('Already refreshing');
      }
      
      // Only proceed if we have a token
      if (!auth.userToken) {
        return rejectWithValue('No token available');
      }

      // Check if token is close to expiring (within 1 hour)
      let tokenTimestamp = localStorage.getItem('tokenTimestamp');
      
      // If no timestamp exists, set current time as timestamp
      if (!tokenTimestamp) {
        tokenTimestamp = Date.now().toString();
        localStorage.setItem('tokenTimestamp', tokenTimestamp);
      }
      
      const tokenAge = Date.now() - parseInt(tokenTimestamp);
      const hoursOld = tokenAge / (1000 * 60 * 60);
      
      // If token is more than 23 hours old, try to refresh
      if (hoursOld > 23) {
        // Try to refresh token first
        try {
          const refreshResult = await axios.post('/api/auth/refresh', {}, {
            headers: { 'x-auth-token': auth.userToken }
          });
          
          // Update token and timestamp
          localStorage.setItem('userToken', refreshResult.data.token);
          localStorage.setItem('tokenTimestamp', Date.now().toString());
          
          // Get user details with new token
          const userResult = await axios.get('/api/auth', {
            headers: { 'x-auth-token': refreshResult.data.token }
          });
          
          localStorage.setItem('userInfo', JSON.stringify(userResult.data));
          return { ...userResult.data, token: refreshResult.data.token };
        } catch (refreshError) {
          console.warn('Token refresh failed, trying with existing token');
        }
      }

      const config = {
        headers: {
          'x-auth-token': auth.userToken,
        },
      };
      
      const { data } = await axios.get('/api/auth', config);
      // Store updated user info
      localStorage.setItem('userInfo', JSON.stringify(data));
      return data;
    } catch (err) {
      // If token is invalid, clear everything
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('tokenTimestamp');
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Check token expiration and show warnings
export const checkTokenExpiration = createAsyncThunk(
  'auth/checkTokenExpiration',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (!auth.userToken) {
        return rejectWithValue('No token available');
      }

      let tokenTimestamp = localStorage.getItem('tokenTimestamp');
      
      // If no timestamp exists, set current time as timestamp (assume token is fresh)
      if (!tokenTimestamp) {
        tokenTimestamp = Date.now().toString();
        localStorage.setItem('tokenTimestamp', tokenTimestamp);
        console.warn('Token timestamp was missing, setting current time as timestamp');
      }

      const tokenAge = Date.now() - parseInt(tokenTimestamp);
      const hoursOld = tokenAge / (1000 * 60 * 60);
      const minutesRemaining = (24 - hoursOld) * 60;

      // Show warning if less than 30 minutes remaining
      if (minutesRemaining <= 30 && minutesRemaining > 0) {
        return {
          warning: true,
          minutesRemaining: Math.floor(minutesRemaining),
          message: `Your session will expire in ${Math.floor(minutesRemaining)} minutes. Please save your work.`
        };
      }

      // Token expired
      if (minutesRemaining <= 0) {
        // Try to refresh token
        dispatch(refreshToken());
        return {
          expired: true,
          message: 'Your session has expired. Attempting to refresh...'
        };
      }

      return { valid: true };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Server-side logout with token invalidation
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      
      if (auth.userToken) {
        const config = {
          headers: {
            'x-auth-token': auth.userToken,
          },
        };
        
        // Call logout endpoint to invalidate token server-side
        await axios.post('/api/auth/logout', {}, config);
      }
      
      // Clear local storage
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('tokenTimestamp');
      
      return { success: true };
    } catch (err) {
      // Even if server call fails, clear local storage
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('tokenTimestamp');
      
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Try to get user data from localStorage
let storedUserInfo = null;
try {
  const storedUserJSON = localStorage.getItem('userInfo');
  if (storedUserJSON) {
    storedUserInfo = JSON.parse(storedUserJSON);
  }
} catch (error) {
  console.error('Error parsing stored user info:', error);
  localStorage.removeItem('userInfo'); // Clear corrupted data
}

// initialize userToken from local storage
const userToken = localStorage.getItem('userToken')
  ? localStorage.getItem('userToken')
  : null

const authSlice = createSlice({
  name: "auth",
  initialState: {
    error: false,
    loading: false,
    refreshing: false, // New flag to prevent race conditions
    userInfo: storedUserInfo,
    userToken,
    success: false,
    errMsg: '',
    userErrorMsg: '',
    userUpdateError: false,
    userUpdateErrorMsg: '',
    editable: false,
    updating: false,
    sessionWarning: null, // For session timeout warnings
    lastActivity: Date.now(), // Track user activity
  },
  reducers: {
    removeError: (state, { payload }) => {
      state.error = false
      state.errMsg = ''
      state.userErrorMsg = ''
    },
    enableUpdate: (state, action) => {
      state.editable = !state.editable
    },
    cancelUpdate: (state, action) => {
      state.editable = false
    },
    logout: (state) => {
      localStorage.removeItem('userToken')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('tokenTimestamp')
      state.loading = false
      state.userInfo = null
      state.userToken = null
      state.error = null
      state.refreshing = false
      state.sessionWarning = null
    },
    clearSessionWarning: (state) => {
      state.sessionWarning = null
    },
    updateLastActivity: (state) => {
      state.lastActivity = Date.now()
    },
  },
  extraReducers: {
    [registerUser.pending]: (state) => {
      state.loading = true
      state.error = false
    },
    [registerUser.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.success = true
    },
    [registerUser.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = true
      state.errMsg = payload.msg ? payload.msg : payload
    },
    [loginUser.pending]: (state) => {
      state.loading = true
      state.error = false
    },
    [loginUser.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.userInfo = payload.user
      state.userToken = payload.token
      state.errMsg = ''
      state.sessionWarning = null
      // Store user info in localStorage
      localStorage.setItem('userInfo', JSON.stringify(payload.user))
    },
    [loginUser.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = true
      state.errMsg = payload.msg ? payload.msg : payload
    },

    [getUserDetails.pending]: (state) => {
      state.loading = true
      state.error = false
    },
    [getUserDetails.fulfilled]: (state, { payload }) => {
      state.loading = false
      state.userInfo = payload
      state.userErrorMsg = ''
      // Store user info in localStorage
      localStorage.setItem('userInfo', JSON.stringify(payload))
    },
    [getUserDetails.rejected]: (state, { payload }) => {
      state.loading = false
      state.error = true
      state.userErrorMsg = payload.msg ? payload.msg : payload
    },

    [updateUser.pending]: (state) => {
      state.updating = true
      state.userUpdateError = false
    },
    [updateUser.fulfilled]: (state, { payload }) => {
      state.updating = false
      state.userInfo = payload
      state.userUpdateErrorMsg = ''
      state.editable = false
    },
    [updateUser.rejected]: (state, { payload }) => {
      state.updating = false
      state.userUpdateError = true
      state.userUpdateErrorMsg = payload.msg ? payload.msg : payload
      state.editable = false
    },
    
    // Enhanced loadUserFromStorage handlers
    [loadUserFromStorage.pending]: (state) => {
      state.refreshing = true // Prevent race conditions
    },
    [loadUserFromStorage.fulfilled]: (state, { payload }) => {
      state.refreshing = false
      state.userInfo = payload.token ? payload : payload // Handle both formats
      state.userToken = payload.token || state.userToken
      // Store user info in localStorage
      localStorage.setItem('userInfo', JSON.stringify(payload.token ? payload : payload))
    },
    [loadUserFromStorage.rejected]: (state, { payload }) => {
      state.refreshing = false
      // Only clear token if the error indicates invalid token
      if (payload && typeof payload === 'string' && payload.includes('token')) {
        state.userToken = null
        state.userInfo = null
      }
    },
    
    // Token refresh handlers
    [refreshToken.pending]: (state) => {
      state.refreshing = true
    },
    [refreshToken.fulfilled]: (state, { payload }) => {
      state.refreshing = false
      state.userToken = payload.token
      state.sessionWarning = null
      state.errMsg = ''
    },
    [refreshToken.rejected]: (state, { payload }) => {
      state.refreshing = false
      state.userToken = null
      state.userInfo = null
      state.error = true
      state.errMsg = 'Session expired. Please login again.'
    },
    
    // Token expiration check handlers
    [checkTokenExpiration.fulfilled]: (state, { payload }) => {
      if (payload.warning) {
        state.sessionWarning = {
          type: 'warning',
          message: payload.message,
          minutesRemaining: payload.minutesRemaining
        }
      } else if (payload.expired) {
        state.sessionWarning = {
          type: 'expired',
          message: payload.message
        }
      } else {
        state.sessionWarning = null
      }
    },
    [checkTokenExpiration.rejected]: (state, { payload }) => {
      console.error('Token expiration check failed:', payload)
    },
    
    // Logout user handlers
    [logoutUser.pending]: (state) => {
      state.loading = true
    },
    [logoutUser.fulfilled]: (state) => {
      state.loading = false
      state.userInfo = null
      state.userToken = null
      state.error = null
      state.refreshing = false
      state.sessionWarning = null
      state.errMsg = ''
    },
    [logoutUser.rejected]: (state, { payload }) => {
      state.loading = false
      // Still clear user data even if server call failed
      state.userInfo = null
      state.userToken = null
      state.error = null
      state.refreshing = false
      state.sessionWarning = null
      console.warn('Logout server call failed:', payload)
    },
  }
})

export const { 
  removeError, 
  enableUpdate, 
  cancelUpdate, 
  logout, 
  clearSessionWarning, 
  updateLastActivity 
} = authSlice.actions

export default authSlice.reducer