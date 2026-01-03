import { create } from 'zustand';
import { projectApi } from '../services/api';

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  myProjects: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },
  filters: {
    status: 'open',
    urgency: null,
    technology: null,
    search: '',
    minBudget: null,
    maxBudget: null
  },
  isLoading: false,
  error: null,

  // Fetch all projects with filters
  fetchProjects: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });
      
      const { filters, pagination } = get();
      const queryParams = {
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
        status: params.status ?? filters.status,
        urgency: params.urgency ?? filters.urgency,
        technology: params.technology ?? filters.technology,
        search: params.search ?? filters.search,
        min_budget: params.minBudget ?? filters.minBudget,
        max_budget: params.maxBudget ?? filters.maxBudget,
        sort: params.sort || 'created_at',
        order: params.order || 'desc'
      };

      const response = await projectApi.getAll(queryParams);
      
      set({
        projects: response.projects,
        pagination: response.pagination,
        isLoading: false
      });
      
      return { success: true, data: response };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch projects'
      });
      return { success: false, error: error.message };
    }
  },

  // Fetch single project
  fetchProject: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      const { project } = await projectApi.getById(id);
      
      set({
        currentProject: project,
        isLoading: false
      });
      
      return { success: true, project };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch project'
      });
      return { success: false, error: error.message };
    }
  },

  // Fetch my projects (as client)
  fetchMyProjects: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await projectApi.getMyProjects(params);
      
      set({
        myProjects: response.projects,
        isLoading: false
      });
      
      return { success: true, data: response };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch your projects'
      });
      return { success: false, error: error.message };
    }
  },

  // Create project
  createProject: async (projectData) => {
    try {
      set({ isLoading: true, error: null });
      
      const { project } = await projectApi.create(projectData);
      
      set((state) => ({
        projects: [project, ...state.projects],
        myProjects: [project, ...state.myProjects],
        isLoading: false
      }));
      
      return { success: true, project };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Failed to create project'
      });
      return { success: false, error: error.message };
    }
  },

  // Update project
  updateProject: async (id, projectData) => {
    try {
      set({ isLoading: true, error: null });
      
      const { project } = await projectApi.update(id, projectData);
      
      set((state) => ({
        projects: state.projects.map(p => p.id === id ? project : p),
        myProjects: state.myProjects.map(p => p.id === id ? project : p),
        currentProject: state.currentProject?.id === id ? project : state.currentProject,
        isLoading: false
      }));
      
      return { success: true, project };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Failed to update project'
      });
      return { success: false, error: error.message };
    }
  },

  // Delete project
  deleteProject: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      await projectApi.delete(id);
      
      set((state) => ({
        projects: state.projects.filter(p => p.id !== id),
        myProjects: state.myProjects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false
      }));
      
      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Failed to delete project'
      });
      return { success: false, error: error.message };
    }
  },

  // Apply to project
  applyToProject: async (id, applicationData) => {
    try {
      set({ isLoading: true, error: null });
      
      const { application } = await projectApi.apply(id, applicationData);
      
      set({ isLoading: false });
      
      return { success: true, application };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Failed to submit application'
      });
      return { success: false, error: error.message };
    }
  },

  // Set filters
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 } // Reset to first page
    }));
  },

  // Set page
  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page }
    }));
  },

  // Clear current project
  clearCurrentProject: () => set({ currentProject: null }),

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => set({
    projects: [],
    currentProject: null,
    myProjects: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    filters: {
      status: 'open',
      urgency: null,
      technology: null,
      search: '',
      minBudget: null,
      maxBudget: null
    },
    isLoading: false,
    error: null
  })
}));

export default useProjectStore;
