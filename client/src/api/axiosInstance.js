import axios from 'axios';

const BASE_URL = 'http://localhost:5000';



const noCacheHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: noCacheHeaders,
});


api.interceptors.request.use((config) => {
  const path = window.location.pathname;
  let token;

  // Portal-aware token selection
  if (path.startsWith('/admin')) {
    token = localStorage.getItem('admin_token');
  } else if (path.startsWith('/kitchen') || path.startsWith('/waiter')) {
    token = localStorage.getItem('staff_token');
  } else {
    // Fallback for other paths (like home or general login)
    token = localStorage.getItem('admin_token') || localStorage.getItem('staff_token');
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
