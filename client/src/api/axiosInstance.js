import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// All requests carry no-cache headers so the browser
// never serves a stale response from its cache
const noCacheHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: noCacheHeaders,
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// If the server returns 401, the token is invalid/expired — log the user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      // Hard redirect — clears history so back button cannot return to protected pages
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
