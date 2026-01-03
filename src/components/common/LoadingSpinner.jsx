import { memo } from 'react';
import clsx from 'clsx';
import { Rocket } from 'lucide-react';

/**
 * LoadingSpinner - Smooth, GPU-accelerated spinner
 */
export const LoadingSpinner = memo(({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div
      className={clsx(
        'inline-block rounded-full border-solid border-secondary border-t-transparent',
        sizes[size],
        className
      )}
      style={{
        animation: 'spin 0.8s linear infinite',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * LoadingOverlay - Full screen loading with smooth fade
 */
export const LoadingOverlay = memo(({ message = 'Loading...' }) => {
  return (
    <div 
      className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center"
      style={{
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div className="text-center">
        <div className="relative">
          <LoadingSpinner size="xl" className="mb-4" />
          <Rocket className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-foreground font-mono uppercase tracking-wider text-sm">{message}</p>
      </div>
    </div>
  );
});

LoadingOverlay.displayName = 'LoadingOverlay';

/**
 * SkeletonLoader - Smooth shimmer skeleton loading
 */
export const SkeletonLoader = memo(({ className, lines = 1, type = 'text' }) => {
  if (type === 'card') {
    return (
      <div className={clsx('tech-panel rounded-xl overflow-hidden', className)}>
        <div className="skeleton-shimmer h-32 bg-muted" />
        <div className="p-4 space-y-3">
          <div className="skeleton-shimmer h-4 bg-muted rounded w-3/4" />
          <div className="skeleton-shimmer h-3 bg-muted rounded w-full" />
          <div className="skeleton-shimmer h-3 bg-muted rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (type === 'avatar') {
    return (
      <div className={clsx('flex items-center gap-3', className)}>
        <div className="skeleton-shimmer w-10 h-10 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="skeleton-shimmer h-4 bg-muted rounded w-24" />
          <div className="skeleton-shimmer h-3 bg-muted rounded w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer h-4 bg-muted rounded mb-2"
          style={{ 
            width: i === lines - 1 ? '60%' : '100%',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
});

SkeletonLoader.displayName = 'SkeletonLoader';

/**
 * PageLoader - Full page loader with brand animation
 */
export const PageLoader = memo(({ message = 'LOADING MISSION DATA...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 star-field opacity-30" />
      
      {/* Animated orbs */}
      <div 
        className="absolute w-64 h-64 rounded-full bg-primary/10 blur-3xl"
        style={{
          animation: 'pulse-slow 3s ease-in-out infinite',
          top: '30%',
          left: '20%',
        }}
      />
      <div 
        className="absolute w-48 h-48 rounded-full bg-secondary/10 blur-3xl"
        style={{
          animation: 'pulse-slow 3s ease-in-out infinite 1s',
          bottom: '30%',
          right: '20%',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 text-center">
        <div className="relative mb-6">
          <div 
            className="w-20 h-20 mx-auto border-4 border-primary/20 border-t-primary rounded-full"
            style={{
              animation: 'spin 1s linear infinite',
              willChange: 'transform',
            }}
          />
          <Rocket 
            className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
        
        <p className="text-foreground font-mono uppercase tracking-wider text-sm mb-2">{message}</p>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              style={{
                animation: 'pulse 1s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

PageLoader.displayName = 'PageLoader';

/**
 * InlineLoader - Small inline loading indicator
 */
export const InlineLoader = memo(({ className }) => {
  return (
    <div className={clsx('inline-flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current"
          style={{
            animation: 'bounce 0.6s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
});

InlineLoader.displayName = 'InlineLoader';

/**
 * ProgressBar - Smooth progress indicator
 */
export const ProgressBar = memo(({ progress = 0, className }) => {
  return (
    <div className={clsx('h-1 bg-muted rounded-full overflow-hidden', className)}>
      <div
        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, progress))}%`,
          willChange: 'width',
        }}
      />
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';
