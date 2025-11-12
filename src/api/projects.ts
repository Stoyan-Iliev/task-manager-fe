import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  ProjectResponse,
  ProjectCreateRequest,
  ProjectUpdateRequest,
} from '../types/project.types';
import { handleApiError } from '../util/errorHandler';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import {
  cacheProjects,
  cacheProject,
  removeProjectFromCache,
} from '../redux/projectSlice';

/**
 * Fetch all projects for an organization
 */
export const useProjects = (organizationId: number | null) => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: ['projects', organizationId],
    queryFn: async (): Promise<ProjectResponse[]> => {
      const response = await apiClient.get<ProjectResponse[]>(
        `/api/secure/organizations/${organizationId}/projects`
      );
      // Cache projects in Redux
      if (organizationId) {
        dispatch(cacheProjects({ organizationId, projects: response.data }));
      }
      return response.data;
    },
    enabled: organizationId !== null, // Only run if organizationId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch all projects accessible to the current user (across all organizations)
 */
export const useUserProjects = () => {
  return useQuery({
    queryKey: ['projects', 'user'],
    queryFn: async (): Promise<ProjectResponse[]> => {
      const response = await apiClient.get<ProjectResponse[]>('/api/secure/projects');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch a single project by ID
 */
export const useProject = (projectId: number | null) => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<ProjectResponse> => {
      const response = await apiClient.get<ProjectResponse>(
        `/api/secure/projects/${projectId}`
      );
      // Cache project in Redux
      dispatch(cacheProject(response.data));
      return response.data;
    },
    enabled: projectId !== null, // Only run if projectId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Create a new project within an organization
 */
export const useCreateProject = (organizationId: number) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (data: ProjectCreateRequest): Promise<ProjectResponse> => {
      const response = await apiClient.post<ProjectResponse>(
        `/api/secure/organizations/${organizationId}/projects`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Cache new project in Redux
      dispatch(cacheProject(data));

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['projects', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'user'] });

      toast.success(`Project "${data.name}" created successfully!`);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Update an existing project
 */
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: ProjectUpdateRequest;
    }): Promise<ProjectResponse> => {
      const response = await apiClient.put<ProjectResponse>(
        `/api/secure/projects/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Update cached project in Redux
      dispatch(cacheProject(data));

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', data.id] });

      toast.success(`Project "${data.name}" updated successfully!`);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Delete a project
 */
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiClient.delete(`/api/secure/projects/${id}`);
    },
    onSuccess: (_, id) => {
      // Remove from Redux cache
      dispatch(removeProjectFromCache(id));

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });

      toast.success('Project deleted successfully');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};
