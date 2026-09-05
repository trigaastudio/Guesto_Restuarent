import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://guest-o-backend.onrender.com';



const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});
// Attach JWT via Authorization header as a fallback for browsers blocking cross-site cookies
api.interceptors.request.use((config) => {
  const isStaffPath = window.location.pathname.startsWith('/admin') || 
                      window.location.pathname.startsWith('/staff') || 
                      window.location.pathname.startsWith('/kitchen') || 
                      window.location.pathname.startsWith('/waiter');

  let token = null;
  const path = window.location.pathname;
  if (path.startsWith('/admin')) {
    token = sessionStorage.getItem('admin_token') || sessionStorage.getItem('staff_token');
  } else if (isStaffPath) {
    token = sessionStorage.getItem('staff_token');
  } else {
    token = localStorage.getItem('token') || sessionStorage.getItem('admin_token') || sessionStorage.getItem('staff_token');
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// JWTs are also sent via httpOnly cookies automatically by the browser.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const isLoginRequest = error.config?.url?.includes('/api/auth/login') || error.config?.url?.includes('/api/staff/login');
      const isLogoutRequest = error.config?.url?.includes('/api/auth/logout') || error.config?.url?.includes('/api/staff/logout');
      const publicPaths = ['/', '/login', '/register', '/admin/login', '/staff/login', '/about', '/digital-menu'];

      if (isLoginRequest || isLogoutRequest || publicPaths.includes(path)) {
        return Promise.reject(error);
      }

      const isStaffUser = !!localStorage.getItem('staff_user') || !!sessionStorage.getItem('staff_token');

      // Clear both sessions to prevent infinite redirect loops
      sessionStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      sessionStorage.removeItem('staff_token');
      localStorage.removeItem('staff_user');

      if (path.startsWith('/admin')) {
        window.location.replace(isStaffUser ? '/staff/login' : '/admin/login');
      } else if (path.startsWith('/kitchen') || path.startsWith('/waiter') || path.startsWith('/staff')) {
        window.location.replace('/staff/login');
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('/login');
      }
    } else if (error.response?.status >= 500) {
      const path = window.location.pathname;
      const config = error.config;
      let retryCount = config._retryCount || 0;
      
      if (retryCount < 1) {
        config._retryCount = retryCount + 1;
        return new Promise(resolve => setTimeout(() => resolve(api(config)), 800));
      }

      if (path !== '/error') {
        const message = error.response?.data?.message || 'Unable to connect to the server.';
        window.location.replace(`/error?type=server&message=${encodeURIComponent(message)}`);
      }
    } else if (!error.response && !axios.isCancel(error)) {
      // Network error (e.g., CORS, offline)
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
