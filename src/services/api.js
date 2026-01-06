// API Service Layer - Backend Integration
// In production, API is on same origin, so use relative path
// In development, use localhost or env variable
const getApiBaseUrl = () => {
  // Runtime check: if we're on same origin (production domain), always use /api
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isProductionDomain = hostname.includes('onrender.com') || 
                                hostname.includes('vercel.app') ||
                                hostname.includes('netlify.app') ||
                                (hostname !== 'localhost' && hostname !== '127.0.0.1');
    
    // If on same origin, always use relative path /api
    if (isProductionDomain) {
      return '/api';
    }
  }
  
  // In production mode (built with vite build), use /api
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // In development, check env var first, then default to localhost
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }
  
  // Default to localhost for development
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Debug: Log API base URL (helpful for troubleshooting)
if (typeof window !== 'undefined' && (import.meta.env.DEV || window.location.hostname.includes('onrender.com'))) {
  console.log('[API] Base URL:', API_BASE_URL, '| Mode:', import.meta.env.MODE, '| PROD:', import.meta.env.PROD);
}

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

// ============================================================================
// Request Deduplication
// ============================================================================
// Prevents duplicate concurrent requests to the same endpoint
// If a request is in-flight, subsequent requests get the same promise
const pendingRequests = new Map();

const getRequestKey = (url, method, body) => {
  // Only deduplicate GET requests (safe to cache)
  if (method !== 'GET') return null;
  return `${method}:${url}`;
};

const deduplicatedFetch = async (url, config) => {
  const key = getRequestKey(url, config.method || 'GET', config.body);
  
  // If not a GET request, just execute normally
  if (!key) {
    const response = await fetch(url, config);
    return handleResponse(response);
  }
  
  // Check if there's already a pending request for this key
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  // Create new request and store the promise
  const promise = fetch(url, config)
    .then(handleResponse)
    .finally(() => {
      // Clean up after request completes
      pendingRequests.delete(key);
    });
  
  pendingRequests.set(key, promise);
  return promise;
};

// ============================================================================
// Simple In-Memory Cache for Frontend
// ============================================================================
const responseCache = new Map();
const CACHE_TTL = 30000; // 30 seconds for frontend cache

const getCachedResponse = (key) => {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  responseCache.delete(key);
  return null;
};

const setCachedResponse = (key, data) => {
  responseCache.set(key, { data, timestamp: Date.now() });
  
  // Cleanup old entries periodically (keep cache size manageable)
  if (responseCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of responseCache) {
      if (now - v.timestamp > CACHE_TTL) {
        responseCache.delete(k);
      }
    }
  }
};

const apiRequest = async (endpoint, options = {}) => {
  const token = tokenManager.getToken();
  const { params, skipCache = false, ...restOptions } = options;
  
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
  
  // Check frontend cache for GET requests
  const isGet = !config.method || config.method === 'GET';
  const cacheKey = `${url}:${token || 'anon'}`;
  
  if (isGet && !skipCache) {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    const data = await deduplicatedFetch(url, config);
    
    // Cache successful GET responses
    if (isGet) {
      setCachedResponse(cacheKey, data);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error. Please check your connection.', 0, { message: error.message });
  }
};

// Export cache control for manual invalidation
export const apiCache = {
  clear: () => responseCache.clear(),
  invalidate: (pattern) => {
    for (const key of responseCache.keys()) {
      if (key.includes(pattern)) {
        responseCache.delete(key);
      }
    }
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
  recoverAccount: (email) => api.post('/auth/recover-account', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, newPassword, verificationToken, profileData) => {
    const payload = { email, newPassword, verificationToken };
    if (profileData) {
      Object.assign(payload, profileData);
    }
    return api.post('/auth/reset-password', payload);
  },
  
  // OAuth endpoints
  googleAuth: (googleToken) => api.post('/auth/google', { token: googleToken }),
};

// =====================
// GOOGLE OAUTH HELPER
// =====================
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
  
  // Trigger Google Sign-In popup (Simplified approach - direct popup)
  signInWithGoogle: async () => {
    const accounts = await oAuthHelper.initGoogleAuth();
    
    return new Promise((resolve, reject) => {
      let callbackCalled = false;
      let timeoutId;
      
      // Initialize Google Identity Services
      accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (callbackCalled) return; // Prevent duplicate calls
          callbackCalled = true;
          
          if (timeoutId) clearTimeout(timeoutId);
          
          if (response.credential) {
            resolve({ credential: response.credential });
          } else {
            reject(new Error('No credential received from Google'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true, // Opt-in to FedCM for future compatibility
      });
      
      // Use popup flow directly (more reliable than button click)
      accounts.id.prompt((notification) => {
        // Handle notification status
        if (notification.isNotDisplayed()) {
          // One Tap not displayed - create a visible button as fallback
          const buttonContainer = document.createElement('div');
          buttonContainer.id = 'google-signin-fallback';
          buttonContainer.style.position = 'fixed';
          buttonContainer.style.top = '50%';
          buttonContainer.style.left = '50%';
          buttonContainer.style.transform = 'translate(-50%, -50%)';
          buttonContainer.style.zIndex = '10000';
          buttonContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          buttonContainer.style.padding = '20px';
          buttonContainer.style.borderRadius = '8px';
          document.body.appendChild(buttonContainer);
          
          accounts.id.renderButton(buttonContainer, {
            type: 'standard',
            theme: 'filled_blue',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
          });
          
          // Auto-remove after 30 seconds if not clicked
          timeoutId = setTimeout(() => {
            if (buttonContainer.parentNode) {
              buttonContainer.remove();
            }
            if (!callbackCalled) {
              reject(new Error('Google sign-in timed out. Please try again.'));
            }
          }, 30000);
        } else if (notification.isSkippedMoment()) {
          // User skipped - show button
          const buttonContainer = document.createElement('div');
          buttonContainer.id = 'google-signin-fallback';
          buttonContainer.style.position = 'fixed';
          buttonContainer.style.top = '50%';
          buttonContainer.style.left = '50%';
          buttonContainer.style.transform = 'translate(-50%, -50%)';
          buttonContainer.style.zIndex = '10000';
          buttonContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          buttonContainer.style.padding = '20px';
          buttonContainer.style.borderRadius = '8px';
          document.body.appendChild(buttonContainer);
          
          accounts.id.renderButton(buttonContainer, {
            type: 'standard',
            theme: 'filled_blue',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
          });
        } else if (notification.isDismissedMoment()) {
          // User dismissed - reject
          if (!callbackCalled) {
            reject(new Error('Google sign-in was cancelled'));
          }
        }
      });
      
      // Set a timeout for the entire operation
      timeoutId = setTimeout(() => {
        if (!callbackCalled) {
          reject(new Error('Google sign-in timed out. Please try again.'));
        }
      }, 60000); // 60 second timeout
    });
  },
  
  // Check if OAuth is configured
  isGoogleConfigured: () => !!GOOGLE_CLIENT_ID,
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
  getApplications: (projectId, params) => api.get(`/projects/${projectId}/applications`, params),
  updateApplicationStatus: (projectId, applicationId, status, data) => api.put(`/projects/${projectId}/applications/${applicationId}`, { status, ...data }),
  getApplicationStats: (projectId) => api.get(`/projects/${projectId}/applications/stats`),
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
  getApplications: (jobId, params) => api.get(`/jobs/${jobId}/applications`, params),
  updateApplicationStatus: (jobId, applicationId, status, data) => api.put(`/jobs/${jobId}/applications/${applicationId}`, { status, ...data }),
  getApplicationStats: (jobId) => api.get(`/jobs/${jobId}/applications/stats`),
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
// OTP API (Sync with backend after Supabase Auth verification)
// =====================
export const otpApi = {
  syncVerification: (type, identifier) => api.post('/otp/sync-verification', { type, identifier }),
};

// =====================
// ADMIN API
// =====================
export const adminApi = {
  // Stats
  getStats: () => api.get('/admin/stats'),
  
  // Users
  getUsers: (params) => api.get('/admin/users', params),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  verifyUser: (id, data) => api.post(`/admin/users/${id}/verify`, data),
  
  // Jobs
  getJobs: (params) => api.get('/admin/jobs', params),
  updateJob: (id, data) => api.put(`/admin/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/admin/jobs/${id}`),
  
  // Projects
  getProjects: (params) => api.get('/admin/projects', params),
  updateProject: (id, data) => api.put(`/admin/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/admin/projects/${id}`),
  
  // Platforms
  getPlatforms: () => api.get('/admin/platforms'),
  createPlatform: (data) => api.post('/admin/platforms', data),
  updatePlatform: (id, data) => api.put(`/admin/platforms/${id}`, data),
  deletePlatform: (id) => api.delete(`/admin/platforms/${id}`),
  
  // Skills
  getSkills: () => api.get('/admin/skills'),
  createSkill: (data) => api.post('/admin/skills', data),
  updateSkill: (id, data) => api.put(`/admin/skills/${id}`, data),
  deleteSkill: (id) => api.delete(`/admin/skills/${id}`),
  
  // Verification Requests
  getVerificationRequests: (params) => api.get('/admin/verification-requests', params),
  rejectVerificationRequest: (id, data) => api.post(`/admin/verification-requests/${id}/reject`, data),
};

// =====================
// PROFILE API
// =====================
export const profileApi = {
  getAll: (params) => api.get('/profiles', params),
  getById: (id) => api.get(`/profiles/${id}`),
  getMyProfile: () => api.get('/profiles/me'),
  updateProfile: (data) => api.put('/profiles/me', data),
  requestVerification: () => api.post('/profiles/me/request-verification'),
  verifyProfile: (id, data) => api.post(`/profiles/${id}/verify`, data),
  
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
  updatePortfolio: (portfolioId, data) => api.put(`/profiles/me/portfolio/${portfolioId}`, data),
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
// STATS API
// =====================
export const statsApi = {
  getDashboardStats: () => api.get('/stats/dashboard'),
  getActivity: (params) => api.get('/stats/activity', params),
  getRecommendedProjects: (params) => api.get('/stats/recommended-projects', params),
  getRecommendedJobs: (params) => api.get('/stats/recommended-jobs', params),
};

// =====================
// HEALTH CHECK
// =====================
export const healthApi = {
  check: () => fetch(`${API_BASE_URL}/health`).then(res => res.json()),
};

export { ApiError };
export default api;
