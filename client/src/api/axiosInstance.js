import axios from 'axios';

const BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000`;



const api = axios.create({
  baseURL: BASE_URL,
});


api.interceptors.request.use((config) => {
  const path = window.location.pathname;
  let token;

  // Portal-aware token selection
  if (path.startsWith('/admin')) {
    token = localStorage.getItem('admin_token');
  } else if (path.startsWith('/kitchen') || path.startsWith('/waiter') || path.startsWith('/staff')) {
    token = localStorage.getItem('staff_token');
  } else {
    // Fallback for other paths (like home or general user pages)
    // Staff token is explicitly ignored here so they cannot access user endpoints
    token = localStorage.getItem('token') || localStorage.getItem('admin_token');
  }

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const isLoginRequest = error.config?.url?.includes('/api/auth/login');
      const publicPaths = ['/', '/login', '/register', '/admin/login', '/staff/login', '/about', '/digital-menu'];

      // Don't redirect if we're on a public page or it's a login attempt
      if (isLoginRequest || publicPaths.includes(path)) {
        return Promise.reject(error);
      }

      if (path.startsWith('/admin')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.replace('/admin/login');
      } else if (path.startsWith('/kitchen') || path.startsWith('/waiter') || path.startsWith('/staff')) {
        localStorage.removeItem('staff_token');
        localStorage.removeItem('staff_user');
        window.location.replace('/staff/login');
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
