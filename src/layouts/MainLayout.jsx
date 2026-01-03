import { useEffect, memo, useRef } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useLocation } from 'react-router-dom';

export const MainLayout = memo(({ children }) => {
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);

  useEffect(() => {
    // Scroll to top on route change with smooth behavior
    if (prevLocationRef.current !== location.pathname) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        window.scrollTo({ 
          top: 0, 
          left: 0, 
          behavior: 'smooth' 
        });
      });
      prevLocationRef.current = location.pathname;
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen-safe flex flex-col bg-background relative overflow-x-hidden w-full">
      {/* Star field background */}
      <div className="fixed inset-0 star-field opacity-60" />
      
      {/* Grid overlay */}
      <div className="fixed inset-0 grid-overlay opacity-30" />
      
      {/* Scan lines */}
      <div className="fixed inset-0 scan-lines pointer-events-none" />
      
      {/* Small decorative boxes background layer - only boxes and stars */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Very small boxes (90% smaller) - using transform scale to ensure proper rendering */}
        <div className="absolute top-[8%] left-[6%] w-1 h-1" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.15)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[18%] left-[26%] w-0.5 h-0.5" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.2)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[13%] left-[50%] w-1 h-1" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.15)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[23%] left-[73%] w-0.5 h-0.5" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.2)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[33%] left-[10%] w-1 h-1" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.15)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[43%] left-[36%] w-0.5 h-0.5" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.2)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[38%] left-[60%] w-1 h-1" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.15)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[53%] left-[16%] w-0.5 h-0.5" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.2)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[63%] left-[46%] w-1 h-1" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.15)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[58%] left-[80%] w-0.5 h-0.5" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.2)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[73%] left-[13%] w-1 h-1" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.15)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[83%] left-[40%] w-0.5 h-0.5" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.2)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[68%] left-[66%] w-1 h-1" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.15)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[28%] left-[86%] w-0.5 h-0.5" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.2)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[20%] left-[3%] w-1 h-1" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.15)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[6%] left-[23%] w-0.5 h-0.5" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.2)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[36%] left-[13%] w-1 h-1" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.15)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[48%] left-[58%] w-0.5 h-0.5" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.2)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[62%] left-[33%] w-1 h-1" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.15)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[76%] left-[56%] w-0.5 h-0.5" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.2)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[12%] left-[46%] w-1 h-1" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.15)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[32%] left-[26%] w-0.5 h-0.5" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.2)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[54%] left-[76%] w-1 h-1" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.15)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[70%] left-[10%] w-0.5 h-0.5" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.2)', transformOrigin: 'top left' }}></div>
        <div className="absolute top-[82%] left-[66%] w-1 h-1" style={{ transform: 'scale(0.1)', backgroundColor: 'rgba(77, 166, 255, 0.15)', transformOrigin: 'top left' }}></div>
      </div>
      <Navbar />
      <main className="flex-grow relative z-10 w-full overflow-x-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
});

MainLayout.displayName = 'MainLayout';

