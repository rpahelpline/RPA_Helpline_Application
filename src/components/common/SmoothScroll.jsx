import { memo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SmoothScroll - Scroll to top on route change with smooth animation
 */
export const ScrollToTop = memo(() => {
  const { pathname } = useLocation();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      // Use smooth scroll for better UX
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
      prevPathRef.current = pathname;
    }
  }, [pathname]);

  return null;
});

ScrollToTop.displayName = 'ScrollToTop';

/**
 * useSmoothScroll - Hook for smooth scroll to element
 */
export const useSmoothScroll = () => {
  const scrollToElement = (elementId, offset = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({
        top,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return { scrollToElement, scrollToTop };
};

/**
 * useIntersectionObserver - Hook for triggering animations on scroll
 */
export const useIntersectionObserver = (options = {}) => {
  const ref = useRef(null);
  const isInViewRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInViewRef.current) {
          isInViewRef.current = true;
          options.onEnter?.();
        } else if (!entry.isIntersecting && isInViewRef.current) {
          if (options.triggerOnce !== true) {
            isInViewRef.current = false;
            options.onLeave?.();
          }
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options]);

  return ref;
};

