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
  if (window.location.pathname.startsWith('/admin')) {
    token = localStorage.getItem('admin_token');
  } else if (isStaffPath) {
    token = localStorage.getItem('staff_token');
  } else {
    token = localStorage.getItem('token');
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
      const isLoginRequest = error.config?.url?.includes('/api/auth/login');
      const isLogoutRequest = error.config?.url?.includes('/api/auth/logout');
      const publicPaths = ['/', '/login', '/register', '/admin/login', '/staff/login', '/about', '/digital-menu'];

      
      if (isLoginRequest || isLogoutRequest || publicPaths.includes(path)) {
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
    } else if (error.response?.status >= 500 || (!error.response && !axios.isCancel(error))) {
      
      const path = window.location.pathname;
      if (path !== '/error') {
        const message = error.response?.data?.message || error.message || 'Unable to connect to the server.';
        window.location.replace(`/error?type=server&message=${encodeURIComponent(message)}`);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
