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

    return () => {
      socket.off('accountStatusChanged');
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

  return null;
};

export default GlobalSocketListener;
