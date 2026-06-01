import api from '../api/axiosInstance';


export const clearAllAuth = () => {
  const AUTH_KEYS = [
    'user', 'admin_user', 'admin_notifications',
    'staff_user', 'dineInTableId', 'dineInTableNumber',
    'orderActiveTab', 'orderStatusFilter', 'orderSearchTerm', 'menuSearchTerm'
  ];
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const logoutToLanding = async (navigate) => {
  try { await api.post('/api/auth/logout'); } catch (err) {}
  localStorage.removeItem('user');
  localStorage.removeItem('dineInTableId');
  localStorage.removeItem('dineInTableNumber');
  navigate('/', { replace: true });
};

export const logoutAdmin = async (navigate) => {
  try { await api.post('/api/auth/logout'); } catch (err) {}
  localStorage.removeItem('admin_user');
  localStorage.removeItem('admin_notifications');
  localStorage.removeItem('orderActiveTab');
  localStorage.removeItem('orderStatusFilter');
  localStorage.removeItem('orderSearchTerm');
  localStorage.removeItem('menuSearchTerm');
  navigate('/admin/login', { replace: true });
};

export const logoutStaff = async (navigate) => {
  try { await api.post('/api/auth/logout'); } catch (err) {}
  localStorage.removeItem('staff_user');
  navigate('/staff/login', { replace: true });
};
