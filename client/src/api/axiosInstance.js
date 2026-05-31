import axios from 'axios';

const BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000`;



const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});


// Interceptor removed since cookies handle authorization automatically


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
    } else if (error.response?.status >= 500 || (!error.response && !axios.isCancel(error))) {
      // Handle Server Errors (500+) or Network Errors (no response)
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
