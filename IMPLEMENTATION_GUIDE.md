# Implementation Guide: Security & Error Handling Enhancements

## Quick Start Integration

### 1. Backend Integration (server.js)

```javascript
// Add these imports to your server.js
const { applySecurity } = require('./middleware/security');
const { 
  generalRateLimiter, 
  authRateLimiter, 
  orderRateLimiter,
  uploadRateLimiter
} = require('./middleware/rateLimiter');
const { csrfProtection, generateCSRFMiddleware } = require('./middleware/csrf');
const { expressLoggingMiddleware } = require('./utils/errorLogger');

// Apply security middleware (add after express.json())
applySecurity(app, {
  enableCors: true,
  enableSizeLimit: true,
  enableBruteForce: true,
  maxRequestSize: '10mb'
});

// Apply rate limiting to specific routes
app.use('/api', generalRateLimiter);
app.use('/api/auth', authRateLimiter);
app.use('/api/orders', orderRateLimiter);
app.use('/api/products/upload', uploadRateLimiter);

// Apply CSRF protection (add after session middleware if using sessions)
app.use(generateCSRFMiddleware);
app.use(csrfProtection);

// Apply logging middleware
app.use(expressLoggingMiddleware);
```

### 2. Frontend Integration (App.js)

```javascript
// Your existing App.js with error boundary
import ErrorBoundary from './components/ErrorBoundary';
import './utils/axiosConfig'; // This replaces your existing axios interceptor

function App() {
  // ... your existing code ...

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="App font-kumbh-sans w-full min-h-screen relative overflow-hidden">
          <SessionManager />
          <MyRoutes />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

### 3. Component Example with New Error Handling

```javascript
// Example: Update your existing Login component
import React, { useState } from 'react';
import { useFormRetry } from '../hooks/useRetry';
import { useRequestCancellation } from '../hooks/useRequestCancellation';
import ErrorDisplay from '../components/ErrorDisplay';
import { parseHttpError } from '../utils/errorHandler';

const Login = () => {
  const [error, setError] = useState(null);
  const { submitWithRetry, submitting, isRetrying } = useFormRetry();
  const { makeRequest } = useRequestCancellation();

  const handleSubmit = async (formData) => {
    try {
      setError(null);
      await submitWithRetry(async () => {
        return await makeRequest({
          method: 'POST',
          url: '/api/auth',
          data: formData
        });
      });
    } catch (err) {
      setError(parseHttpError(err));
    }
  };

  return (
    <div>
      <ErrorDisplay 
        error={error}
        onRetry={() => handleSubmit()}
        onDismiss={() => setError(null)}
      />
      
      {isRetrying && (
        <div className="text-blue-600 text-sm">
          Retrying... Please wait.
        </div>
      )}
      
      {/* Your existing form */}
    </div>
  );
};
```

## Step-by-Step Implementation

### Step 1: Install Dependencies (if needed)

```bash
# Backend dependencies (most are built-in)
npm install # No additional packages needed for basic implementation

# For production Redis support (optional)
npm install redis
```

### Step 2: Update Environment Variables

```bash
# Add to your .env file
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100
LOG_LEVEL=INFO
ENABLE_SECURITY_HEADERS=true
CSRF_SECRET=your-long-random-secret-key-here
```

### Step 3: Create Logs Directory

```bash
# Create logs directory
mkdir logs
echo "logs/" >> .gitignore
```

### Step 4: Update Existing Routes

```javascript
// Example: Update your auth routes
const { logAuthEvent, logSecurityEvent } = require('../utils/errorLogger');

// In your login route
router.post('/', async (req, res) => {
  try {
    // ... existing login logic ...
    
    // Log successful login
    logAuthEvent('LOGIN_SUCCESS', user.id, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ token, user });
  } catch (error) {
    // Log failed login
    logSecurityEvent('LOGIN_FAILED', {
      email: req.body.email,
      ip: req.ip,
      error: error.message
    });
    
    res.status(400).json({ msg: 'Login failed' });
  }
});
```

### Step 5: Update Frontend API Calls

```javascript
// Example: Update your Redux actions
import { apiRequest } from '../utils/axiosConfig';
import { parseHttpError } from '../utils/errorHandler';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await apiRequest({
        method: 'POST',
        url: '/api/auth',
        data: userData
      });
      return response.data;
    } catch (error) {
      const appError = parseHttpError(error);
      return rejectWithValue(appError);
    }
  }
);
```

## Gradual Migration Strategy

### Phase 1: Basic Security (Week 1)
1. ✅ Add security headers middleware
2. ✅ Implement basic rate limiting
3. ✅ Add request sanitization
4. ✅ Enable security logging

### Phase 2: Error Handling (Week 2)
1. ✅ Implement error boundary
2. ✅ Standardize error messages
3. ✅ Add error display components
4. ✅ Update key components

### Phase 3: Advanced Features (Week 3)
1. ✅ Add CSRF protection
2. ✅ Implement retry mechanisms
3. ✅ Add request cancellation
4. ✅ Enhanced logging

### Phase 4: Monitoring & Optimization (Week 4)
1. Set up monitoring dashboards
2. Optimize performance
3. Fine-tune security settings
4. Create incident response procedures

## Testing Your Implementation

### 1. Test Error Boundary
```javascript
// Create a test component that throws an error
const TestError = () => {
  throw new Error('Test error boundary');
};

// Use it in your app to test error boundary
```

### 2. Test Rate Limiting
```bash
# Test with curl (replace with your endpoint)
for i in {1..20}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "Request $i"
done
```

### 3. Test CSRF Protection
```javascript
// This should fail without CSRF token
fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ products: [] })
})
.then(response => {
  console.log('Should fail with 403:', response.status);
});
```

### 4. Test Retry Mechanism
```javascript
// Test in your component
const testRetry = async () => {
  try {
    await executeWithRetry(async () => {
      // This will fail first few times
      if (Math.random() < 0.7) {
        throw new Error('Random failure');
      }
      return 'Success!';
    });
  } catch (error) {
    console.log('Final error:', error);
  }
};
```

## Common Issues & Solutions

### Issue 1: CSRF Token Missing
**Problem**: Getting 403 errors on POST requests
**Solution**: Make sure you're sending the CSRF token in headers

```javascript
// Get token from backend
const getCSRFToken = async () => {
  const response = await fetch('/api/csrf-token');
  const data = await response.json();
  return data.csrfToken;
};

// Include in requests
const token = await getCSRFToken();
axios.defaults.headers.common['x-csrf-token'] = token;
```

### Issue 2: Rate Limiting Too Aggressive
**Problem**: Users hitting rate limits too quickly
**Solution**: Adjust rate limit configuration

```javascript
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // Increase window
  max: 200, // Increase max requests
  message: 'Rate limit exceeded'
};
```

### Issue 3: Error Boundary Not Catching Errors
**Problem**: Some errors not being caught
**Solution**: Error boundaries only catch render errors

```javascript
// For async errors, use error handling in components
const handleAsyncError = async () => {
  try {
    await someAsyncOperation();
  } catch (error) {
    // Handle error here, don't throw
    setError(error);
  }
};
```

## Performance Considerations

### 1. Memory Usage
- Monitor rate limiter memory usage
- Implement cleanup for old entries
- Use Redis for production rate limiting

### 2. Log File Management
- Implement log rotation
- Monitor disk space
- Set up log aggregation

### 3. Database Performance
- Index rate limiting collections
- Optimize error logging queries
- Use connection pooling

## Security Checklist

- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] CSRF protection active
- [ ] Input validation implemented
- [ ] Error messages sanitized
- [ ] Logging configured
- [ ] HTTPS enabled (production)
- [ ] Secrets properly managed
- [ ] Regular security audits scheduled

## Monitoring Setup

### 1. Key Metrics to Monitor
- Request rate and response times
- Error rates by endpoint
- Security events frequency
- Resource usage (CPU, memory)

### 2. Alert Thresholds
- Error rate > 5%
- Response time > 2 seconds
- Security events > 10/minute
- Memory usage > 80%

### 3. Log Analysis
- Error patterns
- User behavior
- Performance bottlenecks
- Security threats

## Next Steps

1. **Week 1**: Implement basic security measures
2. **Week 2**: Add error handling enhancements
3. **Week 3**: Implement advanced features
4. **Week 4**: Set up monitoring and optimization

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review error patterns in monitoring
3. Test with provided examples
4. Adjust configurations as needed

Remember: Security is an ongoing process. Regular reviews and updates are essential for maintaining effectiveness. 