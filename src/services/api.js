// API Service Layer - Backend Integration
// In production, API is on same origin, so use relative path
// In development, use localhost or env variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

// Token storage keys
const TOKEN_KEY = 'rpa_auth_token';
const REFRESH_TOKEN_KEY = 'rpa_refresh_token';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Token management
export const tokenManager = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  removeRefreshToken: () => localStorage.removeItem(REFRESH_TOKEN_KEY),
  
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  
  setTokens: (token, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    // Handle rate limiting (429)
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60';
      throw new ApiError(
        data.error || data.message || `Too many requests. Please try again after ${retryAfter} seconds.`,
        response.status,
        { ...data, retryAfter: parseInt(retryAfter) }
      );
    }
    
    // Handle token expiration
    if (response.status === 401) {
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken && data.error === 'Token expired') {
        // Try to refresh the token
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            tokenManager.setTokens(refreshData.token, refreshData.refreshToken);
            // Retry the original request would go here
          } else {
            tokenManager.clearTokens();
          }
        } catch {
          tokenManager.clearTokens();
        }
      }
    }
    
    // Handle validation errors (400)
    if (response.status === 400) {
      throw new ApiError(
        data.error || data.message || 'Invalid request. Please check your input.',
        response.status,
        data
      );
    }
    
    throw new ApiError(
      data.error || data.message || `HTTP error! status: ${response.status}`,
      response.status,
      data
    );
  }
  
  return data;
};

const buildQueryString = (params) => {
  if (!params || Object.keys(params).length === 0) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const apiRequest = async (endpoint, options = {}) => {
  const token = tokenManager.getToken();
  const { params, ...restOptions } = options;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...restOptions,
  };

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const queryString = buildQueryString(params);
  const url = `${API_BASE_URL}${endpoint}${queryString}`;

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error. Please check your connection.', 0, { message: error.message });
  }
};

export const api = {
  get: (endpoint, params) => apiRequest(endpoint, { method: 'GET', params }),
  post: (endpoint, data, options) =>
    apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  put: (endpoint, data, options) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  patch: (endpoint, data, options) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

// =====================
// AUTH API
// =====================
export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getCurrentUser: () => api.get('/auth/me'),
  updatePassword: (passwords) => api.put('/auth/password', passwords),
  
  // OAuth endpoints
  googleAuth: (googleToken) => api.post('/auth/google', { token: googleToken }),
  githubAuth: (code) => api.post('/auth/github', { code }),
  
  // OAuth URL getters (for redirect flow)
  getGoogleAuthUrl: () => api.get('/auth/google/url'),
  getGithubAuthUrl: () => api.get('/auth/github/url'),
};

// =====================
// GOOGLE OAUTH HELPER
// =====================
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;

export const oAuthHelper = {
  // Initialize Google Sign-In
  initGoogleAuth: () => {
    return new Promise((resolve, reject) => {
      if (!GOOGLE_CLIENT_ID) {
        reject(new Error('Google Client ID not configured'));
        return;
      }
      
      // Check if Google script is already loaded
      if (window.google?.accounts) {
        resolve(window.google.accounts);
        return;
      }
      
      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts) {
          resolve(window.google.accounts);
        } else {
          reject(new Error('Google Identity Services failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  },
  
  // Trigger Google Sign-In popup
  signInWithGoogle: async () => {
    const accounts = await oAuthHelper.initGoogleAuth();
    
    return new Promise((resolve, reject) => {
      accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            resolve({ credential: response.credential });
          } else {
            reject(new Error('No credential received from Google'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      
      // Show the One Tap or popup
      accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to button click flow
          const buttonDiv = document.createElement('div');
          buttonDiv.id = 'google-signin-btn-temp';
          buttonDiv.style.display = 'none';
          document.body.appendChild(buttonDiv);
          
          accounts.id.renderButton(buttonDiv, {
            type: 'icon',
            shape: 'circle',
          });
          
          // Trigger click on the rendered button
          const btn = buttonDiv.querySelector('div[role="button"]');
          if (btn) {
            btn.click();
          }
          
          // Cleanup
          setTimeout(() => buttonDiv.remove(), 100);
        }
      });
    });
  },
  
  // GitHub OAuth (redirect flow)
  signInWithGitHub: () => {
    if (!GITHUB_CLIENT_ID) {
      throw new Error('GitHub Client ID not configured');
    }
    
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = 'read:user user:email';
    const state = crypto.randomUUID();
    
    // Store state for verification
    sessionStorage.setItem('github_oauth_state', state);
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${GITHUB_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`;
    
    window.location.href = githubAuthUrl;
  },
  
  // Handle GitHub callback
  handleGitHubCallback: async (code, state) => {
    const savedState = sessionStorage.getItem('github_oauth_state');
    sessionStorage.removeItem('github_oauth_state');
    
    if (state !== savedState) {
      throw new Error('Invalid OAuth state');
    }
    
    return authApi.githubAuth(code);
  },
  
  // Check if OAuth is configured
  isGoogleConfigured: () => !!GOOGLE_CLIENT_ID,
  isGitHubConfigured: () => !!GITHUB_CLIENT_ID,
};

// =====================
// USER API
// =====================
export const userApi = {
  getAll: (params) => api.get('/users', params),
  getById: (id) => api.get(`/users/${id}`),
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
  getStats: () => api.get('/users/me/stats'),
  deleteAccount: () => api.delete('/users/me'),
};

// =====================
// PROJECT API
// =====================
export const projectApi = {
  getAll: (params) => api.get('/projects', params),
  getById: (id) => api.get(`/projects/${id}`),
  create: (projectData) => api.post('/projects', projectData),
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),
  delete: (id) => api.delete(`/projects/${id}`),
  apply: (id, applicationData) => api.post(`/projects/${id}/apply`, applicationData),
  getMyProjects: (params) => api.get('/projects/me/projects', params),
};

// =====================
// FREELANCER API
// =====================
export const freelancerApi = {
  getAll: (params) => api.get('/freelancers', params),
  getById: (id) => api.get(`/freelancers/${id}`),
  getMyProfile: () => api.get('/freelancers/me/profile'),
  updateProfile: (profileData) => api.put('/freelancers/me/profile', profileData),
  getMyApplications: (params) => api.get('/freelancers/me/applications', params),
  updateAvailability: (isAvailable) => api.patch('/freelancers/me/availability', { is_available: isAvailable }),
};

// =====================
// JOB API
// =====================
export const jobApi = {
  getAll: (params) => api.get('/jobs', params),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (jobData) => api.post('/jobs', jobData),
  update: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  delete: (id) => api.delete(`/jobs/${id}`),
  apply: (id, applicationData) => api.post(`/jobs/${id}/apply`, applicationData),
  getMyPostings: (params) => api.get('/jobs/me/postings', params),
};

// =====================
// TRAINING API
// =====================
export const trainingApi = {
  getAll: (params) => api.get('/training', params),
  getById: (id) => api.get(`/training/${id}`),
  create: (programData) => api.post('/training', programData),
  update: (id, programData) => api.put(`/training/${id}`, programData),
  delete: (id) => api.delete(`/training/${id}`),
  enroll: (id) => api.post(`/training/${id}/enroll`),
  getMyEnrollments: (params) => api.get('/training/me/enrollments', params),
  getMyPrograms: (params) => api.get('/training/me/programs', params),
};

// =====================
// UPLOAD API
// =====================
export const uploadApi = {
  uploadFile: (type, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/${type}`, formData);
  },
  uploadToSupabase: (bucket, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/supabase/${bucket}`, formData);
  },
  deleteFromSupabase: (bucket, filePath) => api.delete(`/upload/supabase/${bucket}/${filePath}`),
};

// =====================
// PROFILE API
// =====================
export const profileApi = {
  getAll: (params) => api.get('/profiles', params),
  getById: (id) => api.get(`/profiles/${id}`),
  getMyProfile: () => api.get('/profiles/me'),
  updateProfile: (data) => api.put('/profiles/me', data),
  
  // Platform expertise
  addPlatform: (data) => api.post('/profiles/me/platforms', data),
  removePlatform: (platformId) => api.delete(`/profiles/me/platforms/${platformId}`),
  
  // Skills
  addSkill: (data) => api.post('/profiles/me/skills', data),
  removeSkill: (skillId) => api.delete(`/profiles/me/skills/${skillId}`),
  
  // Certifications
  addCertification: (data) => api.post('/profiles/me/certifications', data),
  removeCertification: (certId) => api.delete(`/profiles/me/certifications/${certId}`),
  
  // Experience
  addExperience: (data) => api.post('/profiles/me/experience', data),
  updateExperience: (expId, data) => api.put(`/profiles/me/experience/${expId}`, data),
  removeExperience: (expId) => api.delete(`/profiles/me/experience/${expId}`),
  
  // Portfolio
  addPortfolio: (data) => api.post('/profiles/me/portfolio', data),
  removePortfolio: (portfolioId) => api.delete(`/profiles/me/portfolio/${portfolioId}`),
};

// =====================
// TAXONOMY API
// =====================
export const taxonomyApi = {
  getPlatforms: () => api.get('/taxonomy/platforms'),
  getPlatformBySlug: (slug) => api.get(`/taxonomy/platforms/${slug}`),
  getSkills: (category) => api.get('/taxonomy/skills', { category }),
  getCertifications: (params) => api.get('/taxonomy/certifications', params),
  getIndustries: () => api.get('/taxonomy/industries'),
  getCompanySizes: () => api.get('/taxonomy/company-sizes'),
  getExperienceLevels: () => api.get('/taxonomy/experience-levels'),
  search: (query) => api.get('/taxonomy/search', { q: query }),
};

// =====================
// NOTIFICATION API
// =====================
export const notificationApi = {
  getAll: (params) => api.get('/notifications', params),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteAllRead: () => api.delete('/notifications'),
};

// =====================
// MESSAGE API
// =====================
export const messageApi = {
  getConversations: (params) => api.get('/messages/conversations', params),
  getConversation: (id, params) => api.get(`/messages/conversations/${id}`, params),
  startConversation: (data) => api.post('/messages/conversations', data),
  sendMessage: (conversationId, data) => api.post(`/messages/conversations/${conversationId}/messages`, data),
  deleteMessage: (convId, msgId) => api.delete(`/messages/conversations/${convId}/messages/${msgId}`),
  muteConversation: (id, isMuted) => api.patch(`/messages/conversations/${id}/mute`, { is_muted: isMuted }),
};

// =====================
// HEALTH CHECK
// =====================
export const healthApi = {
  check: () => fetch(`${API_BASE_URL}/health`).then(res => res.json()),
};

export { ApiError };
export default api;
