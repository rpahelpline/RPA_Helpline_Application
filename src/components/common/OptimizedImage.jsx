import { memo, useState, useRef, useEffect } from 'react';
import { SkeletonLoader } from './LoadingSpinner';

/**
 * OptimizedImage - Lazy-loaded, GPU-accelerated image component
 * Industry-standard image optimization
 */
export const OptimizedImage = memo(({
  src,
  alt = '',
  className = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Use Intersection Observer for lazy loading
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  return (
    <div className={`relative overflow-hidden ${className}`} {...props}>
      {/* Skeleton loader while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0">
          <SkeletonLoader type="card" className="h-full w-full" />
        </div>
      )}
      
      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={hasError ? placeholder : src}
          alt={alt}
          className={`
            transition-opacity duration-300
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${hasError ? 'opacity-50' : ''}
          `}
          style={{
            willChange: 'opacity',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
          }}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}
      
      {/* Placeholder for when not in view */}
      {!isInView && (
        <div 
          className="w-full h-full bg-muted"
          style={{ aspectRatio: '16/9' }}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';



