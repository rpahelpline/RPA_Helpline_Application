import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from './LoadingSpinner';

export const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { isAuthenticated, role } = useAuthStore();
  const location = useLocation();

  // Show loading state while checking auth
  if (isAuthenticated === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg bg-starfield">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn(`[ProtectedRoute] Access denied. User role: "${role}", Allowed roles:`, allowedRoles);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

