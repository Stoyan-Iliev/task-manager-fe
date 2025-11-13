import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  TaskResponse,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskAssignRequest,
  TaskTransitionRequest,
  CommentResponse,
  CommentRequest,
  AttachmentResponse,
  LabelResponse,
  TaskLabelRequest,
  WatchersResponse,
} from '../types/task.types';
import type { ApiResponse } from '../types/common.types';

// Query Keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
  project: (projectId: number) => [...taskKeys.all, 'project', projectId] as const,
  byKey: (orgId: number, key: string) => [...taskKeys.all, 'byKey', orgId, key] as const,
  subtasks: (parentTaskId: number) => [...taskKeys.all, 'subtasks', parentTaskId] as const,
  myOpen: (orgId: number) => [...taskKeys.all, 'myOpen', orgId] as const,
  comments: (taskId: number) => [...taskKeys.all, 'comments', taskId] as const,
  attachments: (taskId: number) => [...taskKeys.all, 'attachments', taskId] as const,
  labels: (taskId: number) => [...taskKeys.all, 'labels', taskId] as const,
  watchers: (taskId: number) => [...taskKeys.all, 'watchers', taskId] as const,
};

// API Functions

// Tasks
async function fetchProjectTasks(projectId: number): Promise<TaskResponse[]> {
  const response = await apiClient.get<ApiResponse<TaskResponse[]>>(
    `/api/secure/projects/${projectId}/tasks`
  );

  // Handle both ApiResponse<T> format and direct array format
  let tasks: TaskResponse[] = [];

  if (Array.isArray(response.data)) {
    tasks = response.data;
  } else if (response.data.data) {
    tasks = response.data.data;
  } else {
    return [];
  }

  // Fix: Ensure statusId and assigneeId are populated from nested objects if missing
  tasks = tasks.map(task => ({
    ...task,
    statusId: task.statusId ?? task.status?.id,
    assigneeId: task.assigneeId ?? task.assignee?.id,
  }));

  return tasks;
}

async function fetchTask(taskId: number): Promise<TaskResponse> {
  const response = await apiClient.get<ApiResponse<TaskResponse>>(
    `/api/secure/tasks/${taskId}`
  );

  let task = response.data.data || response.data;

  // Fix: Ensure statusId and assigneeId are populated from nested objects if missing
  task = {
    ...task,
    statusId: task.statusId ?? task.status?.id,
    assigneeId: task.assigneeId ?? task.assignee?.id,
  };

  return task;
}

async function fetchTaskByKey(orgId: number, key: string): Promise<TaskResponse> {
  const response = await apiClient.get<ApiResponse<TaskResponse>>(
    `/api/secure/organizations/${orgId}/tasks/${key}`
  );

  let task = response.data.data || response.data;

  // Fix: Ensure statusId and assigneeId are populated from nested objects if missing
  task = {
    ...task,
    statusId: task.statusId ?? task.status?.id,
    assigneeId: task.assigneeId ?? task.assignee?.id,
  };

  return task;
}

async function fetchSubtasks(parentTaskId: number): Promise<TaskResponse[]> {
  const response = await apiClient.get<ApiResponse<TaskResponse[]>>(
    `/api/secure/tasks/${parentTaskId}/subtasks`
  );

  let tasks = response.data.data || response.data;

  // Fix: Ensure statusId is populated from status.id if missing
  tasks = tasks.map(task => ({
    ...task,
    statusId: task.statusId ?? task.status?.id,
  }));

  return tasks;
}

async function fetchMyOpenTasks(orgId: number): Promise<TaskResponse[]> {
  const response = await apiClient.get<ApiResponse<TaskResponse[]>>(
    `/api/secure/organizations/${orgId}/tasks/my-open`
  );
  return response.data.data;
}

async function createTask(
  projectId: number,
  data: TaskCreateRequest
): Promise<TaskResponse> {
  const response = await apiClient.post<ApiResponse<TaskResponse>>(
    `/api/secure/projects/${projectId}/tasks`,
    data
  );

  // Handle both response formats (wrapped and unwrapped)
  let task = response.data.data || response.data;

  // Fix: Ensure statusId and assigneeId are populated from nested objects if missing
  task = {
    ...task,
    statusId: task.statusId ?? task.status?.id,
    assigneeId: task.assigneeId ?? task.assignee?.id,
  };

  return task;
}

async function updateTask(
  taskId: number,
  data: TaskUpdateRequest
): Promise<TaskResponse> {
  const response = await apiClient.put<ApiResponse<TaskResponse>>(
    `/api/secure/tasks/${taskId}`,
    data
  );

  // Handle both response formats (wrapped and unwrapped)
  let task = response.data.data || response.data;

  // Fix: Ensure statusId and assigneeId are populated from nested objects if missing
  task = {
    ...task,
    statusId: task.statusId ?? task.status?.id,
    assigneeId: task.assigneeId ?? task.assignee?.id,
  };

  return task;
}

async function deleteTask(taskId: number): Promise<void> {
  await apiClient.delete(`/api/secure/tasks/${taskId}`);
}

async function assignTask(
  taskId: number,
  data: TaskAssignRequest
): Promise<TaskResponse> {
  const response = await apiClient.post<ApiResponse<TaskResponse>>(
    `/api/secure/tasks/${taskId}/assign`,
    data
  );

  // Handle both response formats (wrapped and unwrapped)
  let task = response.data.data || response.data;

  // Fix: Ensure statusId and assigneeId are populated from nested objects if missing
  task = {
    ...task,
    statusId: task.statusId ?? task.status?.id,
    assigneeId: task.assigneeId ?? task.assignee?.id,
  };

  return task;
}

async function transitionTask(
  taskId: number,
  data: TaskTransitionRequest
): Promise<TaskResponse> {
  const response = await apiClient.post<ApiResponse<TaskResponse>>(
    `/api/secure/tasks/${taskId}/transition`,
    data
  );

  // Handle both response formats (wrapped and unwrapped)
  let task = response.data.data || response.data;

  // Fix: Ensure statusId and assigneeId are populated from nested objects if missing
  task = {
    ...task,
    statusId: task.statusId ?? task.status?.id,
    assigneeId: task.assigneeId ?? task.assignee?.id,
  };

  return task;
}

// Comments
async function fetchTaskComments(taskId: number): Promise<CommentResponse[]> {
  const response = await apiClient.get<ApiResponse<CommentResponse[]> | CommentResponse[]>(
    `/api/secure/tasks/${taskId}/comments`
  );

  // Check if response is wrapped in ApiResponse or returned directly
  const data = Array.isArray(response.data)
    ? response.data
    : 'data' in response.data && response.data.data !== undefined
    ? response.data.data
    : [] as CommentResponse[];

  return data;
}

async function createComment(
  taskId: number,
  data: CommentRequest
): Promise<CommentResponse> {
  const response = await apiClient.post<ApiResponse<CommentResponse>>(
    `/api/secure/tasks/${taskId}/comments`,
    data
  );
  return response.data.data;
}

async function updateComment(
  commentId: number,
  data: CommentRequest
): Promise<CommentResponse> {
  const response = await apiClient.put<ApiResponse<CommentResponse>>(
    `/api/secure/comments/${commentId}`,
    data
  );
  return response.data.data;
}

async function deleteComment(commentId: number): Promise<void> {
  await apiClient.delete(`/api/secure/comments/${commentId}`);
}

// Attachments
async function fetchTaskAttachments(taskId: number): Promise<AttachmentResponse[]> {
  const response = await apiClient.get<ApiResponse<AttachmentResponse[]> | AttachmentResponse[]>(
    `/api/secure/tasks/${taskId}/attachments`
  );

  // Check if response is wrapped in ApiResponse or returned directly
  const data = Array.isArray(response.data)
    ? response.data
    : 'data' in response.data && response.data.data !== undefined
    ? response.data.data
    : [] as AttachmentResponse[];

  return data;
}

async function uploadAttachment(
  taskId: number,
  file: File
): Promise<AttachmentResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ApiResponse<AttachmentResponse>>(
    `/api/secure/tasks/${taskId}/attachments`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
}

async function deleteAttachment(taskId: number, attachmentId: number): Promise<void> {
  await apiClient.delete(`/api/secure/tasks/${taskId}/attachments/${attachmentId}`);
}

export function getAttachmentDownloadUrl(attachmentId: number): string {
  const baseURL = apiClient.defaults.baseURL || 'http://localhost:8080';
  return `${baseURL}/api/secure/attachments/${attachmentId}/download`;
}

// Labels
async function fetchTaskLabels(taskId: number): Promise<LabelResponse[]> {
  const response = await apiClient.get<ApiResponse<LabelResponse[]> | LabelResponse[]>(
    `/api/secure/tasks/${taskId}/labels`
  );

  // Check if response is wrapped in ApiResponse or returned directly
  const data = Array.isArray(response.data)
    ? response.data
    : 'data' in response.data && response.data.data !== undefined
    ? response.data.data
    : [] as LabelResponse[];

  return data;
}

async function addLabel(
  taskId: number,
  data: TaskLabelRequest
): Promise<LabelResponse[]> {
  const response = await apiClient.post<ApiResponse<LabelResponse[]>>(
    `/api/secure/tasks/${taskId}/labels`,
    data
  );
  return response.data.data;
}

async function removeLabel(taskId: number, labelId: number): Promise<void> {
  await apiClient.delete(`/api/secure/tasks/${taskId}/labels/${labelId}`);
}

// Watchers
async function fetchTaskWatchers(taskId: number): Promise<WatchersResponse> {
  const response = await apiClient.get<ApiResponse<WatchersResponse> | WatchersResponse>(
    `/api/secure/tasks/${taskId}/watchers`
  );

  // Check if response is wrapped in ApiResponse or returned directly
  const data = 'data' in response.data && response.data.data !== undefined
    ? response.data.data
    : response.data as WatchersResponse;

  return data;
}

async function watchTask(taskId: number): Promise<void> {
  await apiClient.post(`/api/secure/tasks/${taskId}/watch`);
}

async function unwatchTask(taskId: number): Promise<void> {
  await apiClient.delete(`/api/secure/tasks/${taskId}/watch`);
}

// React Query Hooks

// Tasks
export function useProjectTasks(projectId: number | null) {
  return useQuery({
    queryKey: projectId ? taskKeys.project(projectId) : ['tasks', 'no-project'],
    queryFn: async () => {
      try {
        const tasks = await fetchProjectTasks(projectId!);
        return tasks;
      } catch (error) {
        return [];
      }
    },
    enabled: !!projectId,
    staleTime: 0, // Always refetch on invalidation
    refetchOnMount: true,
  });
}

export function useTask(taskId: number | null) {
  return useQuery({
    queryKey: taskId ? taskKeys.detail(taskId) : ['tasks', 'no-task'],
    queryFn: () => fetchTask(taskId!),
    enabled: !!taskId,
  });
}

export function useTaskByKey(orgId: number | null, key: string | null) {
  return useQuery({
    queryKey: orgId && key ? taskKeys.byKey(orgId, key) : ['tasks', 'no-key'],
    queryFn: () => fetchTaskByKey(orgId!, key!),
    enabled: !!orgId && !!key,
  });
}

export function useSubtasks(parentTaskId: number | null) {
  return useQuery({
    queryKey: parentTaskId ? taskKeys.subtasks(parentTaskId) : ['tasks', 'no-parent'],
    queryFn: () => fetchSubtasks(parentTaskId!),
    enabled: !!parentTaskId,
    initialData: [],
  });
}

export function useMyOpenTasks(orgId: number | null) {
  return useQuery({
    queryKey: orgId ? taskKeys.myOpen(orgId) : ['tasks', 'no-org'],
    queryFn: async () => {
      try {
        return await fetchMyOpenTasks(orgId!);
      } catch (error) {
        return [];
      }
    },
    enabled: !!orgId,
    initialData: [],
  });
}

export function useCreateTask(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskCreateRequest) => createTask(projectId, data),
    onSuccess: () => {
      // Invalidate and refetch project tasks
      queryClient.invalidateQueries({
        queryKey: taskKeys.project(projectId),
        refetchType: 'active'
      });

      // Force immediate refetch
      queryClient.refetchQueries({
        queryKey: taskKeys.project(projectId),
        type: 'active'
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: TaskUpdateRequest }) =>
      updateTask(taskId, data),
    // Optimistic update
    onMutate: async ({ taskId, data }) => {
      // Find which project query contains this task
      const projectQueries = queryClient.getQueriesData({ queryKey: taskKeys.all });
      let projectId: number | null = null;

      for (const [_queryKey, queryData] of projectQueries) {
        if (Array.isArray(queryData)) {
          const task = queryData.find((t: any) => t.id === taskId);
          if (task) {
            projectId = task.projectId;
            break;
          }
        }
      }

      if (!projectId) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.project(projectId) });
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });

      // Snapshot the previous values
      const previousTasks = queryClient.getQueryData(taskKeys.project(projectId));
      const previousTask = queryClient.getQueryData(taskKeys.detail(taskId));

      // Optimistically update project tasks
      queryClient.setQueryData(taskKeys.project(projectId), (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((task: any) =>
          task.id === taskId
            ? { ...task, ...data }
            : task
        );
      });

      // Optimistically update task detail
      queryClient.setQueryData(taskKeys.detail(taskId), (old: any) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      // Return context with snapshots
      return { previousTasks, previousTask, projectId, taskId };
    },
    // If mutation fails, use the context to roll back
    onError: (_err, _variables, context) => {
      if (context) {
        if (context.projectId && context.previousTasks) {
          queryClient.setQueryData(taskKeys.project(context.projectId), context.previousTasks);
        }
        if (context.taskId && context.previousTask) {
          queryClient.setQueryData(taskKeys.detail(context.taskId), context.previousTask);
        }
      }
    },
    // Always refetch after error or success
    onSettled: (updatedTask) => {
      if (updatedTask) {
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(updatedTask.id) });
        queryClient.invalidateQueries({ queryKey: taskKeys.project(updatedTask.projectId) });
      }
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: TaskAssignRequest }) =>
      assignTask(taskId, data),
    // Optimistic update
    onMutate: async ({ taskId, data }) => {
      // Find which project query contains this task
      const projectQueries = queryClient.getQueriesData({ queryKey: taskKeys.all });
      let projectId: number | null = null;

      for (const [_queryKey, queryData] of projectQueries) {
        if (Array.isArray(queryData)) {
          const task = queryData.find((t: any) => t.id === taskId);
          if (task) {
            projectId = task.projectId;
            break;
          }
        }
      }

      if (!projectId) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.project(projectId) });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(taskKeys.project(projectId));

      // Optimistically update to the new value
      queryClient.setQueryData(taskKeys.project(projectId), (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((task: any) =>
          task.id === taskId
            ? { ...task, assigneeId: data.assigneeId }
            : task
        );
      });

      // Return context with snapshot
      return { previousTasks, projectId };
    },
    // If mutation fails, use the context to roll back
    onError: (_err, _variables, context) => {
      if (context?.projectId && context?.previousTasks) {
        queryClient.setQueryData(taskKeys.project(context.projectId), context.previousTasks);
      }
    },
    // Always refetch after error or success
    onSettled: (updatedTask) => {
      if (updatedTask) {
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(updatedTask.id) });
        queryClient.invalidateQueries({ queryKey: taskKeys.project(updatedTask.projectId) });
      }
    },
  });
}

export function useTransitionTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: TaskTransitionRequest }) =>
      transitionTask(taskId, data),
    // Optimistic update
    onMutate: async ({ taskId, data }) => {
      // Find which project query contains this task and get status info
      const projectQueries = queryClient.getQueriesData({ queryKey: taskKeys.all });
      let projectId: number | null = null;
      let newStatus: any = null;

      // First, try to get the new status from statuses cache
      const statusQueries = queryClient.getQueriesData({ queryKey: ['statuses'] });
      for (const [_key, statusData] of statusQueries) {
        if (Array.isArray(statusData)) {
          newStatus = statusData.find((s: any) => s.id === data.newStatusId);
          if (newStatus) break;
        }
      }

      for (const [_queryKey, queryData] of projectQueries) {
        if (Array.isArray(queryData)) {
          const task = queryData.find((t: any) => t.id === taskId);
          if (task) {
            projectId = task.projectId;
            break;
          }
        }
      }

      if (!projectId) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.project(projectId) });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(taskKeys.project(projectId));

      // Optimistically update to the new value
      queryClient.setQueryData(taskKeys.project(projectId), (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((task: any) => {
          if (task.id === taskId) {
            // Update both statusId and status object
            const updatedTask = {
              ...task,
              statusId: data.newStatusId,
            };

            // If we found the new status, update the status object too
            if (newStatus) {
              updatedTask.status = {
                id: newStatus.id,
                name: newStatus.name,
                category: newStatus.category,
                color: newStatus.color,
              };
            }

            return updatedTask;
          }
          return task;
        });
      });

      // Return context with snapshot
      return { previousTasks, projectId };
    },
    // If mutation fails, use the context to roll back
    onError: (_err, _variables, context) => {
      if (context?.projectId && context?.previousTasks) {
        queryClient.setQueryData(taskKeys.project(context.projectId), context.previousTasks);
      }
    },
    // Update cache with actual response, no refetch needed
    onSuccess: (updatedTask) => {
      if (updatedTask) {
        // Update the project tasks cache with the actual response
        queryClient.setQueryData(taskKeys.project(updatedTask.projectId), (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map((task: any) =>
            task.id === updatedTask.id ? updatedTask : task
          );
        });

        // Update the task detail cache
        queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      }
    },
  });
}

// Comments
export function useTaskComments(taskId: number | null) {
  return useQuery({
    queryKey: taskId ? taskKeys.comments(taskId) : ['comments', 'no-task'],
    queryFn: () => fetchTaskComments(taskId!),
    enabled: !!taskId,
  });
}

export function useCreateComment(taskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CommentRequest) => createComment(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.comments(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

export function useUpdateComment(taskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: number; data: CommentRequest }) =>
      updateComment(commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.comments(taskId) });
    },
  });
}

export function useDeleteComment(taskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.comments(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

// Attachments
export function useTaskAttachments(taskId: number | null) {
  return useQuery({
    queryKey: taskId ? taskKeys.attachments(taskId) : ['attachments', 'no-task'],
    queryFn: () => fetchTaskAttachments(taskId!),
    enabled: !!taskId,
  });
}

export function useUploadAttachment(taskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadAttachment(taskId, file),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: taskKeys.attachments(taskId) });
      queryClient.refetchQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

export function useDeleteAttachment(taskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: number) => deleteAttachment(taskId, attachmentId),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: taskKeys.attachments(taskId) });
      queryClient.refetchQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

// Labels
export function useTaskLabels(taskId: number | null) {
  return useQuery({
    queryKey: taskId ? taskKeys.labels(taskId) : ['labels', 'no-task'],
    queryFn: () => fetchTaskLabels(taskId!),
    enabled: !!taskId,
  });
}

export function useAddLabel(taskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskLabelRequest) => addLabel(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.labels(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

export function useRemoveLabel(taskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (labelId: number) => removeLabel(taskId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.labels(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

// Watchers
export function useTaskWatchers(taskId: number | null) {
  return useQuery({
    queryKey: taskId ? taskKeys.watchers(taskId) : ['watchers', 'no-task'],
    queryFn: () => fetchTaskWatchers(taskId!),
    enabled: !!taskId,
  });
}

export function useWatchTask(taskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => watchTask(taskId),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: taskKeys.watchers(taskId) });
      queryClient.refetchQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

export function useUnwatchTask(taskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unwatchTask(taskId),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: taskKeys.watchers(taskId) });
      queryClient.refetchQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}
