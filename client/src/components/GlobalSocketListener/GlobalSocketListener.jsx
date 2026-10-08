import React, { useEffect } from 'react';
import socket from '../../services/socket';
import { useNavigate, useLocation } from 'react-router-dom';
import { showAlert } from '../../utils/sweetAlert';

const GlobalSocketListener = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthAndConnect = () => {
      const userStr = localStorage.getItem('user');
      const staffStr = localStorage.getItem('staff_user');
      const adminStr = localStorage.getItem('admin_user');
      const user = userStr ? JSON.parse(userStr) : (staffStr ? JSON.parse(staffStr) : (adminStr ? JSON.parse(adminStr) : null));
      const userId = user?._id || user?.id;

      const token = sessionStorage.getItem('admin_token') || sessionStorage.getItem('staff_token') || localStorage.getItem('token');
      
      if (socket.auth?.token !== token) {
        if (token) {
          socket.auth = { token };
        } else {
          delete socket.auth;
        }
        if (socket.connected) {
          socket.disconnect();
        }
      }

      if (!socket.connected) {
        socket.connect();
      }
    };

    handleAuthAndConnect();

    const handleConnect = () => {
      const userStr = localStorage.getItem('user');
      const staffStr = localStorage.getItem('staff_user');
      const adminStr = localStorage.getItem('admin_user');
      const user = userStr ? JSON.parse(userStr) : (staffStr ? JSON.parse(staffStr) : (adminStr ? JSON.parse(adminStr) : null));
      const userId = user?._id || user?.id;
      
      if (userId) {
        socket.emit('joinUser', userId);
      }
      
      const token = sessionStorage.getItem('admin_token') || sessionStorage.getItem('staff_token') || localStorage.getItem('token');
      if (token) {
        socket.emit('authenticate', token);
      }
    };

    const handleAccountStatus = (data) => {
      const userStr = localStorage.getItem('user');
      const staffStr = localStorage.getItem('staff_user');
      const adminStr = localStorage.getItem('admin_user');
      const user = userStr ? JSON.parse(userStr) : (staffStr ? JSON.parse(staffStr) : (adminStr ? JSON.parse(adminStr) : null));
      const userId = user?._id || user?.id;
      
      if (data.userId === userId && data.isActive === false) {
        handleForceLogout();
      }
    };

    const handleDbChange = (data) => {
      window.dispatchEvent(new CustomEvent('db_change', { detail: data }));
    };
    
    socket.on('connect', handleConnect);
    socket.on('accountStatusChanged', handleAccountStatus);
    socket.on('db_change', handleDbChange);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('accountStatusChanged', handleAccountStatus);
      socket.off('db_change', handleDbChange);
    };
  }, []);

  const handleForceLogout = () => {
    const isStaff = window.location.pathname.startsWith('/kitchen') || 
                    window.location.pathname.startsWith('/waiter') || 
                    window.location.pathname.startsWith('/staff') ||
                    sessionStorage.getItem('staff_token') !== null;

    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    sessionStorage.removeItem('staff_token');
    localStorage.removeItem('staff_user');

    
    socket.disconnect();

    
    showAlert({
      icon: 'warning',
      title: 'Account Deactivated',
      text: 'Your account has been blocked by an administrator. You will be logged out.',
      confirmButtonText: 'OK'
    }).then(() => {
      window.location.href = isStaff ? '/staff/login' : '/login';
    });
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      const path = window.location.pathname;
      let shouldLogout = false;
      let redirectPath = '/';

      if (e.key === 'admin_token' && !e.newValue) {
        if (path.startsWith('/admin')) {
          shouldLogout = true;
          redirectPath = '/admin/login';
        } else if (!path.startsWith('/kitchen') && !path.startsWith('/waiter') && !path.startsWith('/staff')) {
          
          const hasCustomerToken = !!localStorage.getItem('token');
          if (!hasCustomerToken) {
            shouldLogout = true;
            redirectPath = '/';
          }
        }
      } else if (e.key === 'staff_token' && !e.newValue) {
        if (path.startsWith('/kitchen') || path.startsWith('/waiter') || path.startsWith('/staff')) {
          shouldLogout = true;
          redirectPath = '/staff/login';
        }
      } else if (e.key === 'token' && !e.newValue) {
        const publicPaths = ['/home', '/', '/about', '/contact', '/login', '/register'];
        if (!publicPaths.includes(path) && !path.startsWith('/admin') && !path.startsWith('/kitchen') && !path.startsWith('/waiter')) {
          shouldLogout = true;
          redirectPath = '/login';
        }
      } else if (e.key === null) {
        
        shouldLogout = true;
      }

      if (shouldLogout) {
        if (socket.connected) {
          socket.disconnect();
        }
        showAlert({
          icon: 'info',
          title: 'Session Ended',
          text: 'You have been logged out in another tab.',
          confirmButtonText: 'OK'
        }).then(() => {
          window.location.href = redirectPath;
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  return null;
};

export default GlobalSocketListener;
