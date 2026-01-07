/**
 * Route Preloading Utilities
 * 
 * Preloads route components on hover for instant navigation.
 * This significantly improves perceived performance by loading
 * the next page's code before the user clicks.
 */

// Map of route paths to their dynamic import functions
const routeImports = {
  '/': () => import('../pages/Home'),
  '/projects': () => import('../pages/Projects'),
  '/jobs': () => import('../pages/Jobs'),
  '/how-it-works': () => import('../pages/HowItWorks'),
  '/dashboard': () => import('../pages/Dashboard'),
  '/sign-in': () => import('../pages/SignIn'),
  '/register': () => import('../pages/Register'),
  '/talent': () => import('../pages/Talent/BrowseTalent'),
  '/post-job': () => import('../pages/Jobs/PostJob'),
  '/applications': () => import('../pages/Applications/MyApplications'),
  '/courses': () => import('../pages/Training/Courses'),
};

// Cache of already preloaded routes
const preloadedRoutes = new Set();

/**
 * Preload a route's component
 * @param {string} path - The route path to preload
 */
export const preloadRoute = (path) => {
  // Already preloaded or no import defined
  if (preloadedRoutes.has(path)) return;
  
  const importFn = routeImports[path];
  if (!importFn) return;
  
  // Mark as preloaded before starting (prevents duplicate calls)
  preloadedRoutes.add(path);
  
  // Execute the import in the background
  importFn().catch(() => {
    // Remove from cache on error so it can be retried
    preloadedRoutes.delete(path);
  });
};

/**
 * Preload multiple routes at once
 * @param {string[]} paths - Array of route paths to preload
 */
export const preloadRoutes = (paths) => {
  paths.forEach(preloadRoute);
};

/**
 * Create a hover handler for preloading
 * @param {string} path - The route path to preload
 * @returns {Function} - Event handler for onMouseEnter
 */
export const createPreloadHandler = (path) => {
  let timeoutId = null;
  
  return {
    onMouseEnter: () => {
      // Small delay to avoid preloading on quick mouse movements
      timeoutId = setTimeout(() => preloadRoute(path), 50);
    },
    onMouseLeave: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  };
};

/**
 * Preload critical routes on app initialization
 * Call this after the app mounts for better UX
 */
export const preloadCriticalRoutes = () => {
  // Use requestIdleCallback if available, otherwise use setTimeout
  const schedulePreload = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));
  
  schedulePreload(() => {
    // Preload the most commonly accessed routes
    preloadRoutes(['/jobs', '/projects', '/dashboard']);
  });
};

export default {
  preloadRoute,
  preloadRoutes,
  createPreloadHandler,
  preloadCriticalRoutes,
};




