import { create } from 'zustand';
import { storage } from '../utils/storage';

const loadUserState = () => {
  try {
    const saved = storage.get('rpa-user-storage');
    return saved || { profile: null };
  } catch {
    return { profile: null };
  }
};

export const useUserStore = create((set) => ({
  ...loadUserState(),
  
  setProfile: (profile) => {
    const state = { profile };
    storage.set('rpa-user-storage', state);
    set(state);
  },
  
  updateProfile: (updates) => {
    const currentState = loadUserState();
    const state = {
      profile: currentState.profile ? { ...currentState.profile, ...updates } : updates,
    };
    storage.set('rpa-user-storage', state);
    set(state);
  },
  
  clearProfile: () => {
    const state = { profile: null };
    storage.set('rpa-user-storage', state);
    set(state);
  },
}));

