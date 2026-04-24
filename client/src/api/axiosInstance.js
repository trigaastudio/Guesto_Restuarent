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
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
