import { create } from 'zustand';
import { authApi, userApi, tokenManager, oAuthHelper } from '../services/api';

// Load initial state from token
const loadAuthState = () => {
  const token = tokenManager.getToken();
  
  return {
    user: null,
    profile: null,
    isAuthenticated: !!token,
    isLoading: !!token, // Will load user if token exists
    error: null
  };
};

export const useAuthStore = create((set, get) => ({
  ...loadAuthState(),
  
  // Initialize - check if user is logged in
  initialize: async () => {
    const token = tokenManager.getToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const { user } = await authApi.getCurrentUser();
      set({
        user,
        profile: user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch {
      // Token invalid or expired
      tokenManager.clearTokens();
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  },
  
  // Login - API only
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      const { user, token, refreshToken } = await authApi.login({ email, password });
      
      tokenManager.setTokens(token, refreshToken);
      
      set({
        user,
        profile: user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.message || error.error || 'Login failed';
      set({
        isLoading: false,
        error: errorMessage
      });
      return { success: false, error: errorMessage, status: error.status };
    }
  },
  
  // Register
  register: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      
      const { user, token, refreshToken } = await authApi.register(userData);
      
      tokenManager.setTokens(token, refreshToken);
      
      set({
        user,
        profile: user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.message || error.error || 'Registration failed';
      set({
        isLoading: false,
        error: errorMessage
      });
      return { success: false, error: errorMessage, status: error.status };
    }
  },
  
  // Logout
  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      tokenManager.clearTokens();
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  },
  
  // Update profile
  updateProfile: async (profileData) => {
    try {
      set({ isLoading: true, error: null });
      
      const { user } = await userApi.updateProfile(profileData);
      
      set({
        user,
        profile: user,
        isLoading: false,
        error: null
      });
      
      return { success: true, user };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Profile update failed'
      });
      return { success: false, error: error.message };
    }
  },
  
  // Update password
  updatePassword: async (currentPassword, newPassword) => {
    try {
      set({ isLoading: true, error: null });
      
      await authApi.updatePassword({ currentPassword, newPassword });
      
      set({ isLoading: false, error: null });
      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Password update failed'
      });
      return { success: false, error: error.message };
    }
  },
  
  // Refresh user data
  refreshUser: async () => {
    try {
      const { user } = await authApi.getCurrentUser();
      set({ user, profile: user });
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Clear error
  clearError: () => set({ error: null }),
  
  // Set loading
  setLoading: (isLoading) => set({ isLoading }),

  // Set role (for registration flow)
  setRole: (role) => {
    const currentUser = get().user;
    const currentProfile = get().profile;
    if (currentUser) {
      const updatedUser = { ...currentUser, user_type: role, role };
      const updatedProfile = { ...currentProfile, user_type: role, role };
      set({
        user: updatedUser,
        profile: updatedProfile,
      });
    }
  },

  // Legacy support - get role
  get role() {
    return get().profile?.user_type || get().profile?.role || null;
  },
  
  // =====================
  // OAuth Methods
  // =====================
  
  // Google Sign-In
  loginWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Check if Google OAuth is configured
      if (!oAuthHelper.isGoogleConfigured()) {
        set({
          isLoading: false,
          error: 'Google OAuth is not configured. Please set VITE_GOOGLE_CLIENT_ID in your environment variables.'
        });
        return { success: false, error: 'Google OAuth not configured' };
      }
      
      // Get Google credential
      const { credential } = await oAuthHelper.signInWithGoogle();
      
      // Send to backend for verification
      const { user, token, refreshToken } = await authApi.googleAuth(credential);
      
      tokenManager.setTokens(token, refreshToken);
      
      set({
        user,
        profile: user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return { success: true, user };
    } catch (error) {
      // Check if user cancelled
      if (error.message?.includes('cancelled') || error.message?.includes('popup_closed')) {
        set({ isLoading: false, error: null });
        return { success: false, cancelled: true };
      }
      
      set({
        isLoading: false,
        error: error.message || 'Google sign-in failed'
      });
      return { success: false, error: error.message };
    }
  },
  
  // GitHub Sign-In (initiates redirect)
  loginWithGitHub: () => {
    try {
      if (!oAuthHelper.isGitHubConfigured()) {
        set({ 
          error: 'GitHub OAuth is not configured. Please set VITE_GITHUB_CLIENT_ID in your environment variables.' 
        });
        return { success: false, error: 'GitHub OAuth not configured' };
      }
      
      // Initiate GitHub OAuth redirect
      oAuthHelper.signInWithGitHub();
      return { success: true, redirecting: true };
    } catch (error) {
      set({ error: error.message || 'GitHub sign-in failed' });
      return { success: false, error: error.message };
    }
  },
  
  // Handle GitHub OAuth callback
  handleGitHubCallback: async (code, state) => {
    try {
      set({ isLoading: true, error: null });
      
      const { user, token, refreshToken } = await oAuthHelper.handleGitHubCallback(code, state);
      
      tokenManager.setTokens(token, refreshToken);
      
      set({
        user,
        profile: user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return { success: true, user };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'GitHub authentication failed'
      });
      return { success: false, error: error.message };
    }
  },
  
  // Check OAuth availability
  getOAuthStatus: () => ({
    google: oAuthHelper.isGoogleConfigured(),
    github: oAuthHelper.isGitHubConfigured(),
  }),
}));

// Initialize auth on app start
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize();
}

export default useAuthStore;
