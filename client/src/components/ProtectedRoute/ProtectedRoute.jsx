import { Navigate } from 'react-router-dom';


const ProtectedRoute = ({ children, allowedRoles }) => {
  const path = window.location.pathname;
  let token;
  let user;

  if (path.startsWith('/admin')) {
    token = localStorage.getItem('admin_token');
    user = JSON.parse(localStorage.getItem('admin_user') || '{}');
  } else if (path.startsWith('/staff') || path.startsWith('/kitchen') || path.startsWith('/waiter')) {
    token = localStorage.getItem('staff_token');
    user = JSON.parse(localStorage.getItem('staff_user') || '{}');
  } else {
    token = localStorage.getItem('token');
    user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  if (!token) {
    // If not logged in, redirect to appropriate login page
    if (path.startsWith('/admin')) return <Navigate to="/admin/login" replace />;
    if (path.startsWith('/staff') || path.startsWith('/kitchen') || path.startsWith('/waiter')) return <Navigate to="/staff/login" replace />;
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If logged in but role not allowed, redirect to their own dashboard or home
    if (user.role === 'admin' || user.role === 'staff') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
