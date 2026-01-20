import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from './LoadingSpinner';

export const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { isAuthenticated, role, user, profile, isLoading, refreshUser } = useAuthStore();
  const location = useLocation();
  const [roleLoading, setRoleLoading] = useState(false);
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);

  // Show loading state while checking auth or loading user data
  if (isAuthenticated === undefined || isLoading) {
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

  // Get role from user or profile as fallback
  const currentRole = role || user?.user_type || profile?.user_type || null;

  // If we need to check roles but role is missing, try to refresh user data once
  useEffect(() => {
    if (allowedRoles && !currentRole && user && !hasTriedRefresh && !roleLoading) {
      setRoleLoading(true);
      setHasTriedRefresh(true);
      refreshUser().finally(() => setRoleLoading(false));
    }
  }, [allowedRoles, currentRole, user, hasTriedRefresh, roleLoading, refreshUser]);

  // If we need to check roles, wait for user/profile to load OR role to be available
  if (allowedRoles && !currentRole) {
    // Still loading user data or refreshing role
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg bg-starfield">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
    console.warn(`[ProtectedRoute] Access denied. User role: "${currentRole}", Allowed roles:`, allowedRoles);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

