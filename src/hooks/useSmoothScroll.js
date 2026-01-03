import { useEffect } from 'react';

export const useSmoothScroll = () => {
  useEffect(() => {
    // Smooth scroll behavior is already set in globals.css
    // This hook can be used for additional scroll optimizations
    
    const handleScroll = () => {
      // Use requestAnimationFrame for smooth scroll performance
      requestAnimationFrame(() => {
        // Any scroll-based animations or effects can go here
      });
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const optimizedScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', optimizedScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', optimizedScroll);
    };
  }, []);
};



