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
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "Do you want to log out?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#B91C1C',
    cancelButtonColor: '#4B5563',
    confirmButtonText: 'Yes, log out!'
  });

  if (result.isConfirmed) {
    try { await api.post('/api/auth/logout'); } catch (err) {}
    localStorage.removeItem('token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user');
    localStorage.removeItem('dineInTableId');
    localStorage.removeItem('dineInTableNumber');
    navigate('/', { replace: true });
  }
};

export const logoutAdmin = async (navigate) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "Do you want to log out of the admin panel?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#B91C1C',
    cancelButtonColor: '#4B5563',
    confirmButtonText: 'Yes, log out!'
  });

  if (result.isConfirmed) {
    try { await api.post('/api/auth/logout'); } catch (err) {}
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_notifications');
    localStorage.removeItem('orderActiveTab');
    localStorage.removeItem('orderStatusFilter');
    localStorage.removeItem('orderSearchTerm');
    localStorage.removeItem('menuSearchTerm');
    navigate('/admin/login', { replace: true });
  }
};

export const logoutStaff = async (navigate) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "Do you want to log out of the staff panel?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#B91C1C',
    cancelButtonColor: '#4B5563',
    confirmButtonText: 'Yes, log out!'
  });

  if (result.isConfirmed) {
    try { await api.post('/api/auth/logout'); } catch (err) {}
    localStorage.removeItem('staff_user');
    navigate('/staff/login', { replace: true });
  }
};
