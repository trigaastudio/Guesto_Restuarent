import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const path = window.location.pathname;
  let hasAuth = false;
  let user;

  if (path.startsWith('/admin')) {
    // Check admin_user first, then fall back to staff_user (for order-manager etc.)
    const adminUser = JSON.parse(localStorage.getItem('admin_user') || 'null');
    const staffUser = JSON.parse(localStorage.getItem('staff_user') || 'null');

    if (adminUser) {
      hasAuth = true;
      user = adminUser;
    } else if (staffUser && ['order-manager', 'cashier', 'delivery', 'staff'].includes(staffUser.role)) {
      hasAuth = true;
      user = staffUser;
    }
  } else if (path.startsWith('/kitchen') || path.startsWith('/waiter')) {
    
    hasAuth = !!localStorage.getItem('staff_user');
    user = JSON.parse(localStorage.getItem('staff_user') || '{}');
  } else {
    
    const customerAuth = !!localStorage.getItem('user');
    const adminAuth = !!localStorage.getItem('admin_user');

    if (customerAuth) {
      
      hasAuth = customerAuth;
      user = JSON.parse(localStorage.getItem('user') || '{}');
    } else if (adminAuth) {
      
      hasAuth = adminAuth;
      user = JSON.parse(localStorage.getItem('admin_user') || '{}');
    } else {
      
      return <Navigate to="/login" replace />;
    }
  }

  if (!hasAuth) {
    
    if (path.startsWith('/admin')) return <Navigate to="/admin/login" replace />;
    if (path.startsWith('/kitchen') || path.startsWith('/waiter')) return <Navigate to="/staff/login" replace />;
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'order-manager') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'kitchen') return <Navigate to="/kitchen/dashboard" replace />;
    if (user.role === 'waiter') return <Navigate to="/waiter/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
