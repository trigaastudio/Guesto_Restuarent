import api from '../api/axiosInstance';
import Swal from 'sweetalert2';


export const clearAllAuth = () => {
  const AUTH_KEYS = [
    'user', 'admin_user', 'admin_notifications',
    'staff_user', 'dineInTableId', 'dineInTableNumber',
    'orderActiveTab', 'orderStatusFilter', 'orderSearchTerm', 'menuSearchTerm'
  ];
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const logoutToLanding = async (navigate) => {
  try { await api.post('/api/auth/logout'); } catch (err) { }
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('dineInTableId');
  localStorage.removeItem('dineInTableNumber');
  window.location.href = '/';
};

export const logoutAdmin = async (navigate) => {
  try { await api.post('/api/auth/logout'); } catch (err) { }
  localStorage.removeItem('admin_user');
  sessionStorage.removeItem('admin_token');
  localStorage.removeItem('admin_notifications');
  localStorage.removeItem('orderActiveTab');
  localStorage.removeItem('orderStatusFilter');
  localStorage.removeItem('orderSearchTerm');
  localStorage.removeItem('menuSearchTerm');
  window.location.href = '/admin/login';
};

export const logoutStaff = async (navigate) => {
  try { await api.post('/api/auth/logout'); } catch (err) { }
  localStorage.removeItem('staff_user');
  sessionStorage.removeItem('staff_token');
  window.location.href = '/staff/login';
};
