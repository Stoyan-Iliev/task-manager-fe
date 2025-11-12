import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  TaskStatusResponse,
  TaskStatusRequest,
  UpdateTaskStatusRequest,
  ReorderStatusesRequest,
  StatusTemplateResponse,
} from '../types/project.types';
import { handleApiError } from '../util/errorHandler';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { cacheProjectStatuses, cacheStatusTemplates } from '../redux/projectSlice';

/**
 * Fetch all statuses for a project (ordered by position)
 */
export const useProjectStatuses = (projectId: number | null) => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: ['projectStatuses', projectId],
    queryFn: async (): Promise<TaskStatusResponse[]> => {
      const response = await apiClient.get<TaskStatusResponse[]>(
        `/api/secure/projects/${projectId}/statuses`
      );
      // Cache in Redux for offline use
      if (projectId) {
        dispatch(cacheProjectStatuses({ projectId, statuses: response.data }));
      }
      return response.data;
    },
    enabled: projectId !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Create a new status for a project with optimistic updates
 */
export const useCreateStatus = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TaskStatusRequest): Promise<TaskStatusResponse> => {
      const response = await apiClient.post<TaskStatusResponse>(
        `/api/secure/projects/${projectId}/statuses`,
        data
      );
      return response.data;
    },
    onMutate: async (newStatus) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['projectStatuses', projectId] });

      // Snapshot previous value
      const previousStatuses = queryClient.getQueryData<TaskStatusResponse[]>([
        'projectStatuses',
        projectId,
      ]);

      // Optimistically add status
      if (previousStatuses) {
        const optimisticStatus: TaskStatusResponse = {
          id: Date.now(), // Temporary ID
          name: newStatus.name,
          category: newStatus.category,
          color: newStatus.color || '#2196F3',
          position: previousStatuses.length,
          projectId,
          wipLimit: newStatus.wipLimit,
          taskCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData<TaskStatusResponse[]>(
          ['projectStatuses', projectId],
          [...previousStatuses, optimisticStatus]
        );
      }

      return { previousStatuses };
    },
    onError: (error, _newStatus, context) => {
      // Rollback on error
      if (context?.previousStatuses) {
        queryClient.setQueryData(['projectStatuses', projectId], context.previousStatuses);
      }
      handleApiError(error);
    },
    onSuccess: (data) => {
      toast.success(`Status "${data.name}" created`);
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['projectStatuses', projectId] });
    },
  });
};

/**
 * Update an existing status with optimistic updates
 */
export const useUpdateStatus = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      statusId,
      data,
    }: {
      statusId: number;
      data: UpdateTaskStatusRequest;
    }): Promise<TaskStatusResponse> => {
      const response = await apiClient.put<TaskStatusResponse>(
        `/api/secure/statuses/${statusId}`,
        data
      );
      return response.data;
    },
    onMutate: async ({ statusId, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['projectStatuses', projectId] });

      // Snapshot previous value
      const previousStatuses = queryClient.getQueryData<TaskStatusResponse[]>([
        'projectStatuses',
        projectId,
      ]);

      // Optimistically update status
      if (previousStatuses) {
        queryClient.setQueryData<TaskStatusResponse[]>(
          ['projectStatuses', projectId],
          previousStatuses.map((status) =>
            status.id === statusId
              ? { ...status, ...data, wipLimit: data.wipLimit ?? status.wipLimit, updatedAt: new Date().toISOString() }
              : status
          )
        );
      }

      return { previousStatuses };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousStatuses) {
        queryClient.setQueryData(['projectStatuses', projectId], context.previousStatuses);
      }
      handleApiError(error);
    },
    onSuccess: (data) => {
      toast.success(`Status "${data.name}" updated`);
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['projectStatuses', projectId] });
    },
  });
};

/**
 * Delete a status (only if no tasks are using it)
 */
export const useDeleteStatus = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusId: number): Promise<void> => {
      await apiClient.delete(`/api/secure/statuses/${statusId}`);
    },
    onMutate: async (statusId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['projectStatuses', projectId] });

      // Snapshot previous value
      const previousStatuses = queryClient.getQueryData<TaskStatusResponse[]>([
        'projectStatuses',
        projectId,
      ]);

      // Optimistically remove status
      if (previousStatuses) {
        queryClient.setQueryData<TaskStatusResponse[]>(
          ['projectStatuses', projectId],
          previousStatuses.filter((status) => status.id !== statusId)
        );
      }

      return { previousStatuses };
    },
    onError: (error, _statusId, context) => {
      // Rollback on error
      if (context?.previousStatuses) {
        queryClient.setQueryData(['projectStatuses', projectId], context.previousStatuses);
      }
      handleApiError(error);
    },
    onSuccess: () => {
      toast.success('Status deleted');
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['projectStatuses', projectId] });
    },
  });
};

/**
 * Reorder statuses (drag-and-drop) with optimistic updates
 */
export const useReorderStatuses = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReorderStatusesRequest): Promise<TaskStatusResponse[]> => {
      const response = await apiClient.post<TaskStatusResponse[]>(
        `/api/secure/projects/${projectId}/statuses/reorder`,
        data
      );
      return response.data;
    },
    onMutate: async (data) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['projectStatuses', projectId] });

      // Snapshot previous value
      const previousStatuses = queryClient.getQueryData<TaskStatusResponse[]>([
        'projectStatuses',
        projectId,
      ]);

      // Optimistically reorder statuses
      if (previousStatuses) {
        const reordered = data.statusIds.map((id, index) => {
          const status = previousStatuses.find((s) => s.id === id);
          return status ? { ...status, position: index } : null;
        }).filter(Boolean) as TaskStatusResponse[];

        queryClient.setQueryData<TaskStatusResponse[]>(
          ['projectStatuses', projectId],
          reordered
        );
      }

      return { previousStatuses };
    },
    onError: (error, _data, context) => {
      // Rollback on error
      if (context?.previousStatuses) {
        queryClient.setQueryData(['projectStatuses', projectId], context.previousStatuses);
      }
      toast.error('Failed to reorder statuses');
      handleApiError(error);
    },
    onSuccess: () => {
      toast.success('Status order updated');
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['projectStatuses', projectId] });
    },
  });
};

/**
 * Fetch available status templates
 */
export const useStatusTemplates = () => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: ['statusTemplates'],
    queryFn: async (): Promise<StatusTemplateResponse[]> => {
      const response = await apiClient.get<StatusTemplateResponse[]>(
        '/api/secure/status-templates'
      );
      // Cache templates
      dispatch(cacheStatusTemplates(response.data));
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour (templates rarely change)
  });
};

/**
 * Apply a status template to a project with optimistic updates
 */
export const useApplyStatusTemplate = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string): Promise<TaskStatusResponse[]> => {
      const response = await apiClient.post<TaskStatusResponse[]>(
        `/api/secure/projects/${projectId}/statuses/template/${templateId}`
      );
      return response.data;
    },
    onMutate: async (templateId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['projectStatuses', projectId] });

      // Snapshot previous value
      const previousStatuses = queryClient.getQueryData<TaskStatusResponse[]>([
        'projectStatuses',
        projectId,
      ]);

      // Get template to show optimistic update
      const templates = queryClient.getQueryData<StatusTemplateResponse[]>(['statusTemplates']);
      const template = templates?.find((t) => t.id === templateId);

      if (template) {
        const optimisticStatuses: TaskStatusResponse[] = template.statuses.map((status, index) => ({
          id: Date.now() + index, // Temporary IDs
          name: status.name,
          category: status.category,
          color: status.color || '#2196F3',
          position: index,
          projectId,
          taskCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        queryClient.setQueryData<TaskStatusResponse[]>(
          ['projectStatuses', projectId],
          optimisticStatuses
        );
      }

      return { previousStatuses };
    },
    onError: (error, _templateId, context) => {
      // Rollback on error
      if (context?.previousStatuses) {
        queryClient.setQueryData(['projectStatuses', projectId], context.previousStatuses);
      }
      handleApiError(error);
    },
    onSuccess: () => {
      toast.success('Status template applied successfully');
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['projectStatuses', projectId] });
    },
  });
};
