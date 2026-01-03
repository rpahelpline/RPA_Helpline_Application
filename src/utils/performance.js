/**
 * Performance optimization utilities
 * Industry-standard performance helpers
 */

/**
 * Throttle function calls for better performance
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Debounce function calls
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Request animation frame wrapper for smooth animations
 */
export const raf = (callback) => {
  return requestAnimationFrame(callback);
};

/**
 * Batch DOM reads/writes for better performance
 */
export const batchDOMUpdates = (readCallback, writeCallback) => {
  raf(() => {
    readCallback();
    raf(writeCallback);
  });
};

/**
 * Lazy load images with intersection observer
 */
export const lazyLoadImage = (img, src, placeholder) => {
  if (!img) return;
  
  img.src = placeholder || '';
  img.classList.add('lazy-load');
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const image = entry.target;
          image.src = src;
          image.classList.remove('lazy-load');
          image.classList.add('lazy-loaded');
          observer.unobserve(image);
        }
      });
    },
    { rootMargin: '50px' }
  );
  
  observer.observe(img);
  return () => observer.disconnect();
};

/**
 * Preload critical resources
 */
export const preloadResource = (href, as = 'fetch', crossorigin = 'anonymous') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (crossorigin) link.crossOrigin = crossorigin;
  document.head.appendChild(link);
};

/**
 * Prefetch resources for faster navigation
 */
export const prefetchResource = (href) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

/**
 * Measure performance of a function
 */
export const measurePerformance = (name, fn) => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.debug(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return fn();
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Optimize scroll performance with passive listeners
 */
export const addPassiveScrollListener = (callback) => {
  let ticking = false;
  
  const optimizedCallback = () => {
    if (!ticking) {
      raf(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', optimizedCallback, { passive: true });
  
  return () => {
    window.removeEventListener('scroll', optimizedCallback);
  };
};

/**
 * Create optimized intersection observer
 */
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

/**
 * Batch state updates for React
 */
export const batchUpdates = (updates) => {
  raf(() => {
    updates.forEach(update => update());
  });
};
