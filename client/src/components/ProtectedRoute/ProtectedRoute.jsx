import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const path = window.location.pathname;
  let token;
  let user;

  if (path.startsWith('/admin')) {
    // Admin routes: require admin_token
    token = localStorage.getItem('admin_token');
    user = JSON.parse(localStorage.getItem('admin_user') || '{}');
  } else if (path.startsWith('/kitchen') || path.startsWith('/waiter')) {
    // Staff dashboard routes: require staff_token
    token = localStorage.getItem('staff_token');
    user = JSON.parse(localStorage.getItem('staff_user') || '{}');
  } else {
    // Customer routes: accept customer token OR admin token
    const customerToken = localStorage.getItem('token');
    const adminToken = localStorage.getItem('admin_token');

    if (customerToken) {
      // Regular customer logged in
      token = customerToken;
      user = JSON.parse(localStorage.getItem('user') || '{}');
    } else if (adminToken) {
      // Admin can browse customer pages as a preview
      token = adminToken;
      user = JSON.parse(localStorage.getItem('admin_user') || '{}');
    } else {
      // Nobody is logged in for the website
      return <Navigate to="/login" replace />;
    }
  }

  if (!token) {
    // Redirect to appropriate login if no token found
    if (path.startsWith('/admin')) return <Navigate to="/admin/login" replace />;
    if (path.startsWith('/kitchen') || path.startsWith('/waiter')) return <Navigate to="/staff/login" replace />;
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If logged in but role not allowed, redirect to their own area
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'kitchen') return <Navigate to="/kitchen/dashboard" replace />;
    if (user.role === 'waiter') return <Navigate to="/waiter/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
