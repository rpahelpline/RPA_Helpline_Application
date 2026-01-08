import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

// ============================================================================
// NOTIFICATION CONTEXT
// ============================================================================
// Centralized context for notification and message counts
// Provides polling and state management for navbar badges

const NotificationContext = createContext(null);

// Polling interval in milliseconds (30 seconds)
const POLL_INTERVAL = 30000;

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuthStore();
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Fetch counts from the API
  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await notificationApi.getCounts();
      if (isMountedRef.current && response) {
        setNotificationCount(response.notifications || 0);
        setMessageCount(response.messages || 0);
      }
    } catch (error) {
      // Silently handle errors - don't disrupt UX
      console.debug('Failed to fetch notification counts:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  // Refresh function that can be called from anywhere
  const refresh = useCallback(() => {
    return fetchCounts();
  }, [fetchCounts]);

  // Mark a notification as read and decrement count
  const decrementNotificationCount = useCallback(() => {
    setNotificationCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const clearNotificationCount = useCallback(() => {
    setNotificationCount(0);
  }, []);

  // Decrement message count (when viewing a conversation)
  const decrementMessageCount = useCallback((amount = 1) => {
    setMessageCount(prev => Math.max(0, prev - amount));
  }, []);

  // Initialize polling when authenticated
  useEffect(() => {
    isMountedRef.current = true;

    if (isAuthenticated) {
      // Fetch immediately
      fetchCounts();

      // Set up polling
      pollIntervalRef.current = setInterval(fetchCounts, POLL_INTERVAL);
    } else {
      // Reset counts when logged out
      setNotificationCount(0);
      setMessageCount(0);
    }

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, fetchCounts]);

  const value = {
    notificationCount,
    messageCount,
    loading,
    refresh,
    decrementNotificationCount,
    clearNotificationCount,
    decrementMessageCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;




