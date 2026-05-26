import React, { useEffect } from 'react';
import socket from '../../services/socket';
import { useNavigate } from 'react-router-dom';
import { showAlert } from '../../utils/sweetAlert';

const GlobalSocketListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const staffStr = localStorage.getItem('staff_user');
    const user = userStr ? JSON.parse(userStr) : (staffStr ? JSON.parse(staffStr) : null);
    const userId = user?._id || user?.id;

    if (userId) {
      if (!socket.connected) {
        socket.connect();
      }

      // Join the user's private room
      socket.emit('joinUser', userId);

      // Listen for account status changes
      socket.on('accountStatusChanged', (data) => {
        if (data.userId === userId && data.isActive === false) {
          handleForceLogout();
        }
      });
    }

    // Global db_change listener
    if (!socket.connected) {
      socket.connect();
    }
    
    // Listen for database changes from anywhere
    const handleDbChange = (data) => {
      // Dispatch a standard browser event so any component can listen to it
      // Data format: { collection: 'Menu', operation: 'UPDATE', docId: '...' }
      window.dispatchEvent(new CustomEvent('db_change', { detail: data }));
    };
    
    socket.on('db_change', handleDbChange);

    return () => {
      socket.off('accountStatusChanged');
      socket.off('db_change', handleDbChange);
    };
  }, [navigate]);

  const handleForceLogout = () => {
    // Clear all storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_user');

    // Close socket
    socket.disconnect();

    // Notify user
    showAlert({
      icon: 'warning',
      title: 'Account Deactivated',
      text: 'Your account has been blocked by an administrator. You will be logged out.',
      confirmButtonText: 'OK'
    }).then(() => {
      window.location.href = '/login';
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
          // We are on the website. If there is no customer token, we were relying on the admin_token.
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
        // localStorage.clear() was called
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
