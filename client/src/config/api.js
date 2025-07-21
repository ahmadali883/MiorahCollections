import axios from 'axios';

// const apiUrl = import.meta.env.REACT_APP_API_BASE_URL || 'https://miorah-collections-server.vercel.app/api';
const apiUrl = process.env.REACT_APP_API_BASE_URL || 'https://miorah-collections-server.vercel.app/api';

const api = axios.create({
    baseURL: apiUrl,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshSuccess = await refreshToken();
            if (refreshSuccess) {
                return api(originalRequest);
            }
        }
        return Promise.reject(error);
    }
);

// Dummy refreshToken function (replace with actual context call)
async function refreshToken() {
    const refresh = localStorage.getItem('refreshToken');
    if (refresh) {
        try {
            const response = await axios.post(`${apiUrl}/auth/token/refresh/`, {
                refresh,
            });
            localStorage.setItem('accessToken', response.data.access);
            return true;
        } catch {
            return false;
        }
    }
    return false;
}

export default api;