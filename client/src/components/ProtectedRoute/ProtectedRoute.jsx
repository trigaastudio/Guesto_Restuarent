import { Navigate } from 'react-router-dom';


const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    // If not logged in, redirect to appropriate login page
    const isRootAdmin = window.location.pathname.startsWith('/admin');
    return <Navigate to={isRootAdmin ? "/admin/login" : "/login"} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If logged in but role not allowed, redirect to a safe page or login
    return <Navigate to={user.role === 'admin' ? "/admin/dashboard" : "/home"} replace />;
  }

  return children;
};

export default ProtectedRoute;
