import { useState, useRef, useEffect, memo } from 'react';

/**
 * OptimizedImage Component
 * 
 * A performant image component with:
 * - Native lazy loading
 * - Async decoding
 * - Blur-up placeholder
 * - Error fallback
 * - Intersection observer for below-fold images
 * 
 * @example
 * <OptimizedImage
 *   src={avatarUrl}
 *   alt="Profile"
 *   width={48}
 *   height={48}
 *   className="rounded-full"
 * />
 */
export const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  className = '',
  fallback = null,
  placeholder = 'blur', // 'blur' | 'skeleton' | 'none'
  priority = false, // If true, loads immediately (for above-fold images)
  onLoad,
  onError,
  objectFit = 'cover',
  ...props
}) => {
  const [status, setStatus] = useState(priority ? 'loading' : 'idle');
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority || status !== 'idle') return;

    const img = imgRef.current;
    if (!img) return;

    // Use Intersection Observer for manual lazy loading control
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStatus('loading');
            observerRef.current?.disconnect();
          }
        });
      },
      { 
        rootMargin: '50px', // Start loading 50px before visible
        threshold: 0.01 
      }
    );

    observerRef.current.observe(img);

    return () => observerRef.current?.disconnect();
  }, [priority, status]);

  const handleLoad = (e) => {
    setStatus('loaded');
    onLoad?.(e);
  };

  const handleError = (e) => {
    setError(true);
    setStatus('error');
    onError?.(e);
  };

  // Show fallback on error
  if (error && fallback) {
    return fallback;
  }

  // Generate placeholder styles
  const getPlaceholderStyle = () => {
    if (placeholder === 'none' || status === 'loaded') return {};
    
    if (placeholder === 'blur') {
      return {
        filter: status === 'loading' ? 'blur(10px)' : 'none',
        transition: 'filter 0.3s ease-out',
      };
    }
    
    return {};
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
      }}
    >
      {/* Skeleton placeholder */}
      {placeholder === 'skeleton' && status !== 'loaded' && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ borderRadius: 'inherit' }}
        />
      )}
      
      {/* Blur placeholder - low quality inline placeholder */}
      {placeholder === 'blur' && status !== 'loaded' && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10"
          style={{ 
            borderRadius: 'inherit',
            filter: 'blur(10px)',
          }}
        />
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={status !== 'idle' ? src : undefined}
        data-src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        onError={handleError}
        className={`${status === 'loaded' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        style={{
          objectFit,
          width: '100%',
          height: '100%',
          ...getPlaceholderStyle(),
        }}
        {...props}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

/**
 * Avatar Component
 * 
 * Optimized avatar with fallback to initials
 */
export const Avatar = memo(({
  src,
  name,
  size = 40,
  className = '',
  priority = false,
}) => {
  const [showFallback, setShowFallback] = useState(!src);
  
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  
  const colors = [
    'from-primary to-secondary',
    'from-blue-500 to-purple-500',
    'from-green-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-500',
  ];
  
  // Deterministic color based on name
  const colorIndex = name 
    ? name.charCodeAt(0) % colors.length 
    : 0;
  
  if (showFallback || !src) {
    return (
      <div
        className={`
          flex items-center justify-center rounded-full
          bg-gradient-to-br ${colors[colorIndex]}
          text-white font-semibold
          ${className}
        `}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }
  
  return (
    <OptimizedImage
      src={src}
      alt={name || 'Avatar'}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      placeholder="blur"
      priority={priority}
      fallback={
        <div
          className={`
            flex items-center justify-center rounded-full
            bg-gradient-to-br ${colors[colorIndex]}
            text-white font-semibold
          `}
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          {initials}
        </div>
      }
      onError={() => setShowFallback(true)}
    />
  );
});

Avatar.displayName = 'Avatar';

export default OptimizedImage;
