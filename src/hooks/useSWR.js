import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * SWR (Stale-While-Revalidate) Hook
 * 
 * Returns cached data immediately while fetching fresh data in background.
 * This provides instant page loads with up-to-date data.
 * 
 * Features:
 * - Deduplication: Prevents duplicate requests within dedupingInterval
 * - Revalidation on focus: Refreshes data when user returns to tab
 * - Error retry: Automatically retries failed requests
 * - Cache persistence: Data persists across component mounts
 * 
 * @param {string} key - Unique key for this data (usually API endpoint)
 * @param {Function} fetcher - Async function that returns data
 * @param {Object} options - Configuration options
 */

// Global cache for SWR data
const swrCache = new Map();
const swrTimestamps = new Map();

export const useSWR = (key, fetcher, options = {}) => {
  const {
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    dedupingInterval = 2000,
    refreshInterval = 0, // 0 = disabled
    errorRetryCount = 3,
    errorRetryInterval = 5000,
    initialData = null,
    onSuccess = null,
    onError = null,
  } = options;

  const [data, setData] = useState(() => {
    // Try to get from cache first
    return swrCache.has(key) ? swrCache.get(key) : initialData;
  });
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(!swrCache.has(key));
  
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  // Revalidate function
  const revalidate = useCallback(async (force = false) => {
    // Skip if key is falsy
    if (!key) return;
    
    // Check deduplication interval
    const lastFetch = swrTimestamps.get(key) || 0;
    const now = Date.now();
    
    if (!force && now - lastFetch < dedupingInterval) {
      return;
    }
    
    swrTimestamps.set(key, now);
    
    if (mountedRef.current) {
      setIsValidating(true);
    }
    
    try {
      const newData = await fetcher();
      
      // Update cache
      swrCache.set(key, newData);
      
      if (mountedRef.current) {
        setData(newData);
        setError(null);
        setIsValidating(false);
        retryCountRef.current = 0;
      }
      
      onSuccess?.(newData, key);
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setIsValidating(false);
        
        // Retry on error
        if (retryCountRef.current < errorRetryCount) {
          retryCountRef.current++;
          setTimeout(() => revalidate(true), errorRetryInterval);
        }
      }
      
      onError?.(err, key);
    }
  }, [key, fetcher, dedupingInterval, errorRetryCount, errorRetryInterval, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    revalidate();
    
    return () => {
      mountedRef.current = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Revalidate on window focus
  useEffect(() => {
    if (!revalidateOnFocus) return;
    
    const handleFocus = () => {
      revalidate();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, revalidate]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return;
    
    const handleOnline = () => {
      revalidate(true);
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [revalidateOnReconnect, revalidate]);

  // Refresh interval
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;
    
    const interval = setInterval(() => {
      revalidate();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval, revalidate]);

  return {
    data,
    error,
    isValidating,
    isLoading: !data && isValidating,
    mutate: (newData) => {
      // Allow manual data updates (for optimistic UI)
      if (typeof newData === 'function') {
        const updated = newData(data);
        swrCache.set(key, updated);
        setData(updated);
      } else if (newData !== undefined) {
        swrCache.set(key, newData);
        setData(newData);
      }
      // Revalidate in background
      revalidate();
    },
    revalidate: () => revalidate(true),
  };
};

/**
 * Prefetch data into SWR cache
 * Use this to preload data before navigation
 */
export const prefetchSWR = async (key, fetcher) => {
  try {
    const data = await fetcher();
    swrCache.set(key, data);
    swrTimestamps.set(key, Date.now());
    return data;
  } catch (error) {
    console.error('Prefetch failed:', error);
    return null;
  }
};

/**
 * Clear SWR cache
 */
export const clearSWRCache = (pattern = null) => {
  if (pattern) {
    for (const key of swrCache.keys()) {
      if (key.includes(pattern)) {
        swrCache.delete(key);
        swrTimestamps.delete(key);
      }
    }
  } else {
    swrCache.clear();
    swrTimestamps.clear();
  }
};

export default useSWR;






