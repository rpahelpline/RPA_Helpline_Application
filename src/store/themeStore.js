import { create } from 'zustand';
import { storage } from '../utils/storage';

const THEME_STORAGE_KEY = 'rpa-theme-storage';

// Get initial theme from localStorage or system preference
const getInitialTheme = () => {
  try {
    const saved = storage.get(THEME_STORAGE_KEY);
    if (saved?.theme) {
      return saved.theme;
    }
    // Default to light theme
    return 'light';
  } catch {
    return 'light';
  }
};

// Apply theme with smooth transition
const applyTheme = (theme) => {
  if (typeof document !== 'undefined') {
    // Add transitioning class for smooth animation
    document.documentElement.classList.add('transitioning');
    
    // Apply theme
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Remove transitioning class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('transitioning');
    }, 300);
  }
};

export const useThemeStore = create((set) => {
  const initialTheme = getInitialTheme();
  
  // Apply theme to document on initialization (without transition)
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('light', initialTheme === 'light');
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }

  return {
    theme: initialTheme,
    
    setTheme: (theme) => {
      applyTheme(theme);
      const state = { theme };
      storage.set(THEME_STORAGE_KEY, state);
      set(state);
    },
    
    toggleTheme: () => {
      set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        const newState = { theme: newTheme };
        storage.set(THEME_STORAGE_KEY, newState);
        return newState;
      });
    },
  };
});

