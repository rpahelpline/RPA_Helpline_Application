import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const RoleProtectedRoute = ({ children, allowedRoles, redirectTo = '/dashboard', errorMessage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, isAuthenticated, isLoading } = useAuthStore();
  const toast = useToast();
  const hasNavigated = useRef(false);
  const toastShown = useRef(false);

  useEffect(() => {
    // Prevent multiple navigations
    if (hasNavigated.current) return;

    if (!isAuthenticated) {
      // Only navigate if not already on sign-in page
      if (location.pathname !== '/sign-in') {
        hasNavigated.current = true;
        navigate('/sign-in', { state: { returnTo: location.pathname } });
      }
      return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      // Only navigate if not already on redirect page
      if (location.pathname !== redirectTo) {
        hasNavigated.current = true;
        if (!toastShown.current) {
          toast.error(errorMessage || 'You do not have permission to access this page.');
          toastShown.current = true;
        }
        navigate(redirectTo);
      }
    }
  }, [isAuthenticated, role, allowedRoles, navigate, redirectTo, errorMessage, location.pathname]);

  // Show loading while auth is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Not authenticated - will be redirected by useEffect
  if (!isAuthenticated) {
    return null;
  }

  // If we have role restrictions and role is loaded but doesn't match, block access
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return null;
  }

  // Role matches or no restrictions - show children
  return children;
};

