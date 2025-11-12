import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  SprintResponse,
  SprintRequest,
  CompleteSprintRequest,
} from '../types/project.types';
import type { TaskSummary, TaskResponse } from '../types/task.types';
import type { ApiResponse } from '../types/common.types';
import { handleApiError } from '../util/errorHandler';
import toast from 'react-hot-toast';

/**
 * Fetch all sprints for a project
 */
export const useSprints = (projectId: number | null) => {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async (): Promise<SprintResponse[]> => {
      const response = await apiClient.get<SprintResponse[]>(
        `/api/secure/projects/${projectId}/sprints`
      );
      return response.data;
    },
    enabled: projectId !== null,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Fetch a single sprint by ID
 */
export const useSprint = (sprintId: number | null) => {
  return useQuery({
    queryKey: ['sprint', sprintId],
    queryFn: async (): Promise<SprintResponse> => {
      const response = await apiClient.get<SprintResponse>(
        `/api/secure/sprints/${sprintId}`
      );
      return response.data;
    },
    enabled: sprintId !== null,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Fetch backlog tasks for a project
 */
export const useBacklogTasks = (projectId: number | null) => {
  return useQuery({
    queryKey: ['backlog', projectId],
    queryFn: async (): Promise<TaskSummary[]> => {
      const response = await apiClient.get<TaskSummary[]>(
        `/api/secure/projects/${projectId}/backlog`
      );
      return response.data;
    },
    enabled: projectId !== null,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Create a new sprint in a project
 */
export const useCreateSprint = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SprintRequest): Promise<SprintResponse> => {
      const response = await apiClient.post<SprintResponse>(
        `/api/secure/projects/${projectId}/sprints`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });

      toast.success(`Sprint "${data.name}" created successfully!`);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Update an existing sprint
 */
export const useUpdateSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: SprintRequest;
    }): Promise<SprintResponse> => {
      const response = await apiClient.put<SprintResponse>(
        `/api/secure/sprints/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['sprints', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['sprint', data.id] });

      toast.success(`Sprint "${data.name}" updated successfully!`);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Delete a sprint
 */
export const useDeleteSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiClient.delete(`/api/secure/sprints/${id}`);
    },
    onSuccess: (_, id) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['sprint', id] });

      toast.success('Sprint deleted successfully');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Start a sprint (PLANNED → ACTIVE)
 */
export const useStartSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sprintId: number): Promise<SprintResponse> => {
      const response = await apiClient.post<SprintResponse>(
        `/api/secure/sprints/${sprintId}/start`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['sprint', data.id] });

      toast.success(`Sprint "${data.name}" started!`);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Complete a sprint (ACTIVE → COMPLETED)
 */
export const useCompleteSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: CompleteSprintRequest;
    }): Promise<SprintResponse> => {
      const response = await apiClient.post<SprintResponse>(
        `/api/secure/sprints/${id}/complete`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['sprint', data.id] });
      queryClient.invalidateQueries({ queryKey: ['sprint-tasks', data.id] });
      queryClient.invalidateQueries({ queryKey: ['backlog', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Invalidate all tasks

      toast.success(`Sprint "${data.name}" completed!`);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Assign tasks to a sprint (bulk operation)
 */
export const useAssignTasksToSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sprintId,
      taskIds,
    }: {
      sprintId: number;
      taskIds: number[];
    }): Promise<void> => {
      await apiClient.post(`/api/secure/sprints/${sprintId}/tasks`, {
        taskIds,
      });
    },
    onSuccess: (_, { sprintId }) => {
      queryClient.invalidateQueries({ queryKey: ['sprint', sprintId] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['sprint-tasks', sprintId] });
      queryClient.invalidateQueries({ queryKey: ['backlog'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      toast.success('Tasks assigned to sprint successfully');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Remove tasks from sprint (move to backlog)
 */
export const useRemoveTasksFromSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskIds: number[]): Promise<void> => {
      await apiClient.delete('/api/secure/sprints/tasks', {
        data: { taskIds },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['sprint-tasks'] }); // Invalidate all sprint tasks
      queryClient.invalidateQueries({ queryKey: ['backlog'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      toast.success('Tasks moved to backlog successfully');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Fetch tasks for a specific sprint
 */
export const useSprintTasks = (sprintId: number | null) => {
  return useQuery({
    queryKey: ['sprint-tasks', sprintId],
    queryFn: async (): Promise<TaskResponse[]> => {
      const response = await apiClient.get<ApiResponse<TaskResponse[]> | TaskResponse[]>(
        `/api/secure/sprints/${sprintId}/tasks`
      );

      // Handle both ApiResponse<T> format and direct array format
      let tasks: TaskResponse[] = [];

      if (Array.isArray(response.data)) {
        tasks = response.data;
      } else if ('data' in response.data && response.data.data !== undefined) {
        tasks = response.data.data;
      } else {
        return [];
      }

      // Ensure statusId and assigneeId are populated from nested objects if missing
      tasks = tasks.map(task => ({
        ...task,
        statusId: task.statusId ?? task.status?.id,
        assigneeId: task.assigneeId ?? task.assignee?.id,
      }));

      return tasks;
    },
    enabled: sprintId !== null,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
