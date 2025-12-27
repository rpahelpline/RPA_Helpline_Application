import { create } from 'zustand';
import { getMockData, addMockData, updateMockData } from '../mock/data';

export const useProjectStore = create((set) => {
  // Initialize projects from localStorage
  const loadProjects = () => getMockData('projects');
  
  return {
    projects: loadProjects(),
    
    loadProjects: () => {
      const projects = loadProjects();
      set({ projects });
    },
    
    addProject: (projectData) => {
      const newProject = addMockData('projects', projectData);
      set((state) => ({
        projects: [...state.projects, newProject],
      }));
      return newProject;
    },
    
    updateProject: (id, updates) => {
      updateMockData('projects', id, updates);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }));
    },
    
    getProject: (id) => {
      const projects = loadProjects();
      return projects.find((p) => p.id === id);
    },
    
    getActiveProjects: () => {
      const projects = loadProjects();
      return projects.filter((p) => p.status === 'open' || p.status === 'in-progress');
    },
  };
});

