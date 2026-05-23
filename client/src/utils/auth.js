/**
 * Centralized auth utility.
 */

export const clearAllAuth = () => {
  const AUTH_KEYS = [
    'token', 'user', 'admin_token', 'admin_user', 'admin_notifications',
    'staff_token', 'staff_user', 'dineInTableId', 'dineInTableNumber',
    'orderActiveTab', 'orderStatusFilter', 'orderSearchTerm', 'menuSearchTerm'
  ];
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const logoutToLanding = (navigate) => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('dineInTableId');
  localStorage.removeItem('dineInTableNumber');
  navigate('/', { replace: true });
};

export const logoutAdmin = (navigate) => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  localStorage.removeItem('admin_notifications');
  localStorage.removeItem('orderActiveTab');
  localStorage.removeItem('orderStatusFilter');
  localStorage.removeItem('orderSearchTerm');
  localStorage.removeItem('menuSearchTerm');
  navigate('/admin/login', { replace: true });
};

export const logoutStaff = (navigate) => {
  localStorage.removeItem('staff_token');
  localStorage.removeItem('staff_user');
  navigate('/staff/login', { replace: true });
};
