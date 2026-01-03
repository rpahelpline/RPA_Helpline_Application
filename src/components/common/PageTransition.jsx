import { memo, useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition - Industry-standard smooth page transitions
 * Uses CSS transforms for GPU acceleration
 */
export const PageTransition = memo(({ children }) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const prevLocationRef = useRef(location.pathname);

  useEffect(() => {
    // Check if route actually changed
    if (prevLocationRef.current !== location.pathname) {
      setIsVisible(false);
      
      // Short delay for exit animation
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        prevLocationRef.current = location.pathname;
        // Trigger enter animation
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsVisible(true);
          });
        });
      }, 150);
      
      return () => clearTimeout(timer);
    } else {
      // Initial mount
      setDisplayChildren(children);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }
  }, [children, location.pathname]);

  return (
    <div
      className={`page-transition ${isVisible ? 'page-enter-active' : 'page-enter'}`}
      style={{
        willChange: 'opacity, transform',
        backfaceVisibility: 'hidden',
        perspective: 1000,
      }}
    >
      {displayChildren}
    </div>
  );
});

PageTransition.displayName = 'PageTransition';

/**
 * FadeIn - Smooth fade-in animation wrapper
 */
export const FadeIn = memo(({ 
  children, 
  delay = 0, 
  duration = 400,
  direction = 'up',
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const getTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0)';
    switch (direction) {
      case 'up': return 'translate3d(0, 20px, 0)';
      case 'down': return 'translate3d(0, -20px, 0)';
      case 'left': return 'translate3d(20px, 0, 0)';
      case 'right': return 'translate3d(-20px, 0, 0)';
      case 'scale': return 'scale(0.95)';
      default: return 'translate3d(0, 20px, 0)';
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        willChange: 'opacity, transform',
        backfaceVisibility: 'hidden',
      }}
    >
      {children}
    </div>
  );
});

FadeIn.displayName = 'FadeIn';

/**
 * StaggerChildren - Staggered animation for child elements
 */
export const StaggerChildren = memo(({ 
  children, 
  staggerDelay = 50,
  initialDelay = 0,
  className = '' 
}) => {
  return (
    <div className={className}>
      {Array.isArray(children) 
        ? children.map((child, index) => (
            <FadeIn key={index} delay={initialDelay + (index * staggerDelay)}>
              {child}
            </FadeIn>
          ))
        : <FadeIn delay={initialDelay}>{children}</FadeIn>
      }
    </div>
  );
});

StaggerChildren.displayName = 'StaggerChildren';
