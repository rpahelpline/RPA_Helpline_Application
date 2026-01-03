import { BrowserRouter } from 'react-router-dom';
import { memo, useEffect } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/ToastContainer';
import { AppRoutes } from './routes';

/**
 * Performance optimization: Preload critical resources
 */
const usePerformanceOptimizations = () => {
  useEffect(() => {
    // Enable passive event listeners for smooth scrolling
    const supportsPassive = (() => {
      let passive = false;
      try {
        const opts = Object.defineProperty({}, 'passive', {
          get: () => { passive = true; return true; }
        });
        window.addEventListener('testPassive', null, opts);
        window.removeEventListener('testPassive', null, opts);
      } catch (e) {
        // Passive not supported
      }
      return passive;
    })();

    // Add passive listeners for better scroll performance
    if (supportsPassive) {
      document.addEventListener('touchstart', () => {}, { passive: true });
      document.addEventListener('touchmove', () => {}, { passive: true });
      document.addEventListener('wheel', () => {}, { passive: true });
    }

    // Preconnect to important domains
    const preconnectLinks = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];

    preconnectLinks.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Add performance observer for long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Log long tasks in development
            if (process.env.NODE_ENV === 'development' && entry.duration > 50) {
              console.debug('Long task detected:', entry.duration.toFixed(2), 'ms');
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
        return () => observer.disconnect();
      } catch (e) {
        // PerformanceObserver not supported
      }
    }
  }, []);
};

/**
 * Main App component with performance optimizations
 */
const App = memo(() => {
  usePerformanceOptimizations();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="app-root smooth-render">
          <AppRoutes />
          <ToastContainer />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;
