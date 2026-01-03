import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useInView - Detect when element is in viewport
 * @param {Object} options - IntersectionObserver options
 * @returns {Object} { ref, isInView, hasAnimated }
 */
export const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        setIsInView(inView);
        
        if (inView && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px',
        ...options,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasAnimated, options]);

  return { ref, isInView, hasAnimated };
};

/**
 * useSmoothNumber - Animate number changes smoothly
 * @param {number} value - Target value
 * @param {number} duration - Animation duration in ms
 * @returns {number} Animated value
 */
export const useSmoothNumber = (value, duration = 500) => {
  const [displayValue, setDisplayValue] = useState(value);
  const startValueRef = useRef(value);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValueRef.current + 
        (value - startValueRef.current) * easedProgress;
      
      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  return displayValue;
};

/**
 * useStaggeredAnimation - Stagger animations for children
 * @param {number} count - Number of items
 * @param {number} staggerDelay - Delay between items in ms
 * @returns {Object} { isReady, getDelay }
 */
export const useStaggeredAnimation = (count, staggerDelay = 50) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const getDelay = useCallback((index) => {
    return isReady ? index * staggerDelay : 0;
  }, [isReady, staggerDelay]);

  return { isReady, getDelay };
};

/**
 * useReducedMotion - Check if user prefers reduced motion
 * @returns {boolean} Whether reduced motion is preferred
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

/**
 * useScrollProgress - Track scroll progress of an element or page
 * @param {Object} options - Configuration options
 * @returns {Object} { progress, ref }
 */
export const useScrollProgress = (options = {}) => {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return;
      
      rafRef.current = requestAnimationFrame(() => {
        if (options.element && ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const elementProgress = 1 - (rect.top / viewportHeight);
          setProgress(Math.max(0, Math.min(1, elementProgress)));
        } else {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          setProgress(docHeight > 0 ? scrollTop / docHeight : 0);
        }
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [options.element]);

  return { progress, ref };
};

/**
 * useAnimatedMount - Smooth mount/unmount animations
 * @param {boolean} isOpen - Whether component should be visible
 * @param {number} duration - Animation duration in ms
 * @returns {Object} { shouldRender, isAnimating, animationStyle }
 */
export const useAnimatedMount = (isOpen, duration = 200) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Force reflow before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration]);

  const animationStyle = {
    opacity: isAnimating ? 1 : 0,
    transform: isAnimating ? 'translateY(0)' : 'translateY(-8px)',
    transition: `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    willChange: 'opacity, transform',
  };

  return { shouldRender, isAnimating, animationStyle };
};

/**
 * useDebounce - Debounce a value
 * @param {any} value - Value to debounce
 * @param {number} delay - Debounce delay in ms
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * useThrottle - Throttle a callback
 * @param {Function} callback - Callback to throttle
 * @param {number} delay - Throttle delay in ms
 * @returns {Function} Throttled callback
 */
export const useThrottle = (callback, delay = 100) => {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);
};

