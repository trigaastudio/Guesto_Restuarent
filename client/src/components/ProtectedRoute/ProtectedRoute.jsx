import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — wraps pages that require authentication.
 * If no token is in localStorage, redirects immediately to /login
 * using `replace: true` so the protected page is removed from history.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
