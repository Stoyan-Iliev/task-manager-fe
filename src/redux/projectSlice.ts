import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ProjectResponse, TaskStatusResponse, StatusTemplateResponse } from '../types/project.types';
import type { RootState } from './store';

interface ProjectState {
  currentProjectId: number | null;
  projects: Record<number, ProjectResponse>; // Cache by ID
  projectsByOrg: Record<number, number[]>; // Map orgId -> projectIds
  statusesByProject: Record<number, TaskStatusResponse[]>; // Map projectId -> statuses
  statusTemplates: StatusTemplateResponse[]; // Cached templates
}

// Try to load project from sessionStorage (for page refreshes)
const loadProjectFromStorage = (): number | null => {
  try {
    const projectId = sessionStorage.getItem('currentProjectId');
    return projectId ? parseInt(projectId, 10) : null;
  } catch {
    return null;
  }
};

const loadProjectsFromStorage = (): Record<number, ProjectResponse> => {
  try {
    const projectsData = sessionStorage.getItem('projects');
    return projectsData ? JSON.parse(projectsData) : {};
  } catch {
    return {};
  }
};

const loadProjectsByOrgFromStorage = (): Record<number, number[]> => {
  try {
    const projectsByOrgData = sessionStorage.getItem('projectsByOrg');
    return projectsByOrgData ? JSON.parse(projectsByOrgData) : {};
  } catch {
    return {};
  }
};

const initialState: ProjectState = {
  currentProjectId: loadProjectFromStorage(),
  projects: loadProjectsFromStorage(),
  projectsByOrg: loadProjectsByOrgFromStorage(),
  statusesByProject: {},
  statusTemplates: [],
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<number | null>) => {
      state.currentProjectId = action.payload;
      // Persist to sessionStorage
      if (action.payload !== null) {
        sessionStorage.setItem('currentProjectId', action.payload.toString());
      } else {
        sessionStorage.removeItem('currentProjectId');
      }
    },

    clearProject: (state) => {
      state.currentProjectId = null;
      state.projects = {};
      state.projectsByOrg = {};
      state.statusesByProject = {};
      state.statusTemplates = [];
      sessionStorage.removeItem('currentProjectId');
      sessionStorage.removeItem('projects');
      sessionStorage.removeItem('projectsByOrg');
    },

    cacheProjects: (
      state,
      action: PayloadAction<{ organizationId: number; projects: ProjectResponse[] }>
    ) => {
      const { organizationId, projects } = action.payload;

      // Convert array to keyed object for efficient lookup
      const projectsMap = projects.reduce((acc, project) => {
        acc[project.id] = project;
        return acc;
      }, {} as Record<number, ProjectResponse>);

      // Merge with existing projects
      state.projects = { ...state.projects, ...projectsMap };

      // Track which projects belong to this organization
      state.projectsByOrg[organizationId] = projects.map((p) => p.id);

      // Persist to sessionStorage
      sessionStorage.setItem('projects', JSON.stringify(state.projects));
      sessionStorage.setItem('projectsByOrg', JSON.stringify(state.projectsByOrg));
    },

    cacheProject: (state, action: PayloadAction<ProjectResponse>) => {
      const project = action.payload;
      state.projects[project.id] = project;

      // Add to organization mapping if not already there
      const orgId = project.organizationId;
      if (!state.projectsByOrg[orgId]) {
        state.projectsByOrg[orgId] = [];
      }
      if (!state.projectsByOrg[orgId].includes(project.id)) {
        state.projectsByOrg[orgId].push(project.id);
      }

      // Persist to sessionStorage
      sessionStorage.setItem('projects', JSON.stringify(state.projects));
      sessionStorage.setItem('projectsByOrg', JSON.stringify(state.projectsByOrg));
    },

    removeProjectFromCache: (state, action: PayloadAction<number>) => {
      const projectId = action.payload;
      const project = state.projects[projectId];

      // Remove from projects cache
      delete state.projects[projectId];

      // Remove from organization mapping
      if (project) {
        const orgId = project.organizationId;
        if (state.projectsByOrg[orgId]) {
          state.projectsByOrg[orgId] = state.projectsByOrg[orgId].filter(
            (id) => id !== projectId
          );
        }
      }

      // Remove statuses for this project
      delete state.statusesByProject[projectId];

      // If we're removing the current project, clear it
      if (state.currentProjectId === projectId) {
        state.currentProjectId = null;
        sessionStorage.removeItem('currentProjectId');
      }

      // Persist to sessionStorage
      sessionStorage.setItem('projects', JSON.stringify(state.projects));
      sessionStorage.setItem('projectsByOrg', JSON.stringify(state.projectsByOrg));
    },

    cacheProjectStatuses: (
      state,
      action: PayloadAction<{ projectId: number; statuses: TaskStatusResponse[] }>
    ) => {
      const { projectId, statuses } = action.payload;
      state.statusesByProject[projectId] = statuses;
    },

    cacheStatusTemplates: (state, action: PayloadAction<StatusTemplateResponse[]>) => {
      state.statusTemplates = action.payload;
    },
  },
});

// Selectors
export const selectCurrentProjectId = (state: RootState) =>
  state.project.currentProjectId;

export const selectCurrentProject = (state: RootState): ProjectResponse | null => {
  const currentId = state.project.currentProjectId;
  return currentId ? state.project.projects[currentId] || null : null;
};

export const selectAllProjects = (state: RootState): ProjectResponse[] =>
  Object.values(state.project.projects);

export const selectProjectById = (projectId: number) => (state: RootState): ProjectResponse | null =>
  state.project.projects[projectId] || null;

export const selectProjectsByOrganization = (organizationId: number | null) => (
  state: RootState
): ProjectResponse[] => {
  if (!organizationId) return [];
  const projectIds = state.project.projectsByOrg[organizationId] || [];
  return projectIds
    .map((id) => state.project.projects[id])
    .filter((p): p is ProjectResponse => p !== undefined);
};

export const selectRecentProjects = (state: RootState, limit: number = 5): ProjectResponse[] => {
  // Return the most recently cached projects
  // In a future enhancement, we could track lastAccessed timestamps
  return Object.values(state.project.projects).slice(0, limit);
};

// Selectors for statuses
export const selectProjectStatuses = (projectId: number | null) => (
  state: RootState
): TaskStatusResponse[] => {
  if (!projectId) return [];
  return state.project.statusesByProject[projectId] || [];
};

export const selectStatusTemplates = (state: RootState): StatusTemplateResponse[] =>
  state.project.statusTemplates;

export const {
  setCurrentProject,
  clearProject,
  cacheProjects,
  cacheProject,
  removeProjectFromCache,
  cacheProjectStatuses,
  cacheStatusTemplates,
} = projectSlice.actions;

export default projectSlice.reducer;
