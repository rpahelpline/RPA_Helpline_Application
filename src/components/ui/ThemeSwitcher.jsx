import { memo, useState } from 'react';
import { useThemeStore } from '../../store/themeStore';

export const ThemeSwitcher = memo(() => {
  const { theme, toggleTheme } = useThemeStore();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 600);
  };

  const isDark = theme === 'dark';

  return (
    <button
      onClick={handleToggle}
      className={`
        relative w-12 h-12 rounded-xl overflow-hidden
        bg-gradient-to-br transition-all duration-500 ease-out
        ${isDark 
          ? 'from-slate-900 via-indigo-950 to-slate-900 shadow-[0_0_20px_rgba(99,102,241,0.3)]' 
          : 'from-sky-200 via-amber-100 to-orange-200 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
        }
        hover:scale-110 active:scale-95
        border-2 ${isDark ? 'border-indigo-500/30' : 'border-amber-400/50'}
        group
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {/* Stars (visible in dark mode) */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <span className="absolute w-1 h-1 bg-white rounded-full top-2 left-2 animate-pulse" />
        <span className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-4 right-3 animate-pulse" style={{ animationDelay: '0.3s' }} />
        <span className="absolute w-1 h-1 bg-white/60 rounded-full bottom-3 left-4 animate-pulse" style={{ animationDelay: '0.6s' }} />
        <span className="absolute w-0.5 h-0.5 bg-white/70 rounded-full top-3 left-6 animate-pulse" style={{ animationDelay: '0.9s' }} />
      </div>

      {/* Clouds (visible in light mode) */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
        <span className="absolute w-4 h-2 bg-white/80 rounded-full bottom-2 left-1 blur-[1px]" />
        <span className="absolute w-3 h-1.5 bg-white/60 rounded-full bottom-4 right-2 blur-[1px]" />
      </div>

      {/* Sun/Moon container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Moon */}
        <div
          className={`
            absolute w-6 h-6 rounded-full transition-all duration-500 ease-out
            ${isDark 
              ? 'translate-x-0 translate-y-0 rotate-0 scale-100' 
              : 'translate-x-10 -translate-y-10 rotate-90 scale-0'
            }
            ${isAnimating ? 'animate-bounce' : ''}
          `}
        >
          {/* Moon body */}
          <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 shadow-[inset_-3px_-2px_4px_rgba(0,0,0,0.2)]">
            {/* Moon craters */}
            <span className="absolute w-1.5 h-1.5 bg-gray-300/80 rounded-full top-1 left-2" />
            <span className="absolute w-1 h-1 bg-gray-300/60 rounded-full top-3 right-1.5" />
            <span className="absolute w-1 h-1 bg-gray-300/70 rounded-full bottom-2 left-1" />
          </div>
          {/* Moon glow */}
          <div className="absolute inset-0 rounded-full bg-blue-100/30 blur-md -z-10 scale-150" />
        </div>

        {/* Sun */}
        <div
          className={`
            absolute w-6 h-6 transition-all duration-500 ease-out
            ${isDark 
              ? '-translate-x-10 translate-y-10 -rotate-90 scale-0' 
              : 'translate-x-0 translate-y-0 rotate-0 scale-100'
            }
            ${isAnimating ? 'animate-spin' : ''}
          `}
          style={{ animationDuration: '0.6s' }}
        >
          {/* Sun rays */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <span
                key={i}
                className="absolute w-0.5 h-2 bg-gradient-to-t from-amber-400 to-yellow-300 rounded-full origin-bottom"
                style={{
                  transform: `rotate(${i * 45}deg) translateY(-10px)`,
                }}
              />
            ))}
          </div>
          {/* Sun body */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 shadow-lg">
            {/* Sun inner glow */}
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-yellow-200 to-transparent opacity-60" />
          </div>
          {/* Sun outer glow */}
          <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-md -z-10 scale-150 animate-pulse" />
        </div>
      </div>

      {/* Horizon line */}
      <div 
        className={`
          absolute bottom-0 left-0 right-0 h-3 transition-all duration-500
          ${isDark 
            ? 'bg-gradient-to-t from-indigo-900/50 to-transparent' 
            : 'bg-gradient-to-t from-emerald-400/30 to-transparent'
          }
        `}
      />

      {/* Click ripple effect */}
      <div 
        className={`
          absolute inset-0 rounded-xl transition-opacity duration-300
          ${isAnimating ? 'opacity-30' : 'opacity-0'}
          ${isDark ? 'bg-indigo-400' : 'bg-amber-300'}
        `}
      />
    </button>
  );
});

ThemeSwitcher.displayName = 'ThemeSwitcher';
