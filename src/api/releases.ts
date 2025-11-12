import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  ReleaseResponse,
  CreateReleaseRequest,
  UpdateReleaseRequest,
  AddTaskToReleaseRequest,
  ReleaseStatus,
} from '../types/release.types';
import type { ApiResponse } from '../types/common.types';
import type { TaskResponse } from '../types/task.types';

// Query Keys
export const releaseKeys = {
  all: ['releases'] as const,
  lists: () => [...releaseKeys.all, 'list'] as const,
  list: (projectId: number) => [...releaseKeys.lists(), projectId] as const,
  byStatus: (projectId: number, status: ReleaseStatus) => [...releaseKeys.lists(), projectId, status] as const,
  details: () => [...releaseKeys.all, 'detail'] as const,
  detail: (id: number) => [...releaseKeys.details(), id] as const,
  tasks: (releaseId: number) => [...releaseKeys.detail(releaseId), 'tasks'] as const,
};

// API Functions

async function fetchProjectReleases(projectId: number): Promise<ReleaseResponse[]> {
  const response = await apiClient.get<ApiResponse<ReleaseResponse[]>>(
    `/api/secure/projects/${projectId}/releases`
  );
  return response.data.data || response.data || [];
}

async function fetchProjectReleasesByStatus(
  projectId: number,
  status: ReleaseStatus
): Promise<ReleaseResponse[]> {
  const response = await apiClient.get<ApiResponse<ReleaseResponse[]>>(
    `/api/secure/projects/${projectId}/releases/status/${status}`
  );
  return response.data.data || response.data || [];
}

async function fetchRelease(releaseId: number): Promise<ReleaseResponse> {
  const response = await apiClient.get<ApiResponse<ReleaseResponse>>(
    `/api/secure/releases/${releaseId}`
  );
  return response.data.data || response.data;
}

async function createRelease(
  projectId: number,
  data: CreateReleaseRequest
): Promise<ReleaseResponse> {
  const response = await apiClient.post<ApiResponse<ReleaseResponse>>(
    `/api/secure/projects/${projectId}/releases`,
    data
  );
  return response.data.data || response.data;
}

async function updateRelease(
  releaseId: number,
  data: UpdateReleaseRequest
): Promise<ReleaseResponse> {
  const response = await apiClient.put<ApiResponse<ReleaseResponse>>(
    `/api/secure/releases/${releaseId}`,
    data
  );
  return response.data.data || response.data;
}

async function deleteRelease(releaseId: number): Promise<void> {
  await apiClient.delete(`/api/secure/releases/${releaseId}`);
}

async function publishRelease(releaseId: number): Promise<ReleaseResponse> {
  const response = await apiClient.post<ApiResponse<ReleaseResponse>>(
    `/api/secure/releases/${releaseId}/publish`
  );
  return response.data.data || response.data;
}

async function archiveRelease(releaseId: number): Promise<ReleaseResponse> {
  const response = await apiClient.post<ApiResponse<ReleaseResponse>>(
    `/api/secure/releases/${releaseId}/archive`
  );
  return response.data.data || response.data;
}

async function fetchReleaseTasks(releaseId: number): Promise<TaskResponse[]> {
  const response = await apiClient.get<ApiResponse<TaskResponse[]>>(
    `/api/secure/releases/${releaseId}/tasks`
  );
  return response.data.data || response.data || [];
}

async function addTasksToRelease(
  releaseId: number,
  data: AddTaskToReleaseRequest
): Promise<void> {
  await apiClient.post(`/api/secure/releases/${releaseId}/tasks`, data);
}

async function removeTaskFromRelease(releaseId: number, taskId: number): Promise<void> {
  await apiClient.delete(`/api/secure/releases/${releaseId}/tasks/${taskId}`);
}

async function generateReleaseNotes(releaseId: number): Promise<string> {
  const response = await apiClient.get<ApiResponse<string>>(
    `/api/secure/releases/${releaseId}/notes`
  );
  return response.data.data || response.data || '';
}

// React Query Hooks

export function useProjectReleases(projectId: number | null) {
  return useQuery({
    queryKey: releaseKeys.list(projectId!),
    queryFn: () => fetchProjectReleases(projectId!),
    enabled: !!projectId,
  });
}

export function useProjectReleasesByStatus(projectId: number | null, status: ReleaseStatus) {
  return useQuery({
    queryKey: releaseKeys.byStatus(projectId!, status),
    queryFn: () => fetchProjectReleasesByStatus(projectId!, status),
    enabled: !!projectId,
  });
}

export function useRelease(releaseId: number | null) {
  return useQuery({
    queryKey: releaseKeys.detail(releaseId!),
    queryFn: () => fetchRelease(releaseId!),
    enabled: !!releaseId,
  });
}

export function useReleaseTasks(releaseId: number | null) {
  return useQuery({
    queryKey: releaseKeys.tasks(releaseId!),
    queryFn: () => fetchReleaseTasks(releaseId!),
    enabled: !!releaseId,
  });
}

export function useCreateRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: CreateReleaseRequest }) =>
      createRelease(projectId, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: releaseKeys.list(result.projectId) });
    },
  });
}

export function useUpdateRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ releaseId, data }: { releaseId: number; data: UpdateReleaseRequest }) =>
      updateRelease(releaseId, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: releaseKeys.detail(result.id) });
      queryClient.invalidateQueries({ queryKey: releaseKeys.list(result.projectId) });
    },
  });
}

export function useDeleteRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRelease,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: releaseKeys.lists() });
    },
  });
}

export function usePublishRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishRelease,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: releaseKeys.detail(result.id) });
      queryClient.invalidateQueries({ queryKey: releaseKeys.list(result.projectId) });
    },
  });
}

export function useArchiveRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveRelease,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: releaseKeys.detail(result.id) });
      queryClient.invalidateQueries({ queryKey: releaseKeys.list(result.projectId) });
    },
  });
}

export function useAddTasksToRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ releaseId, data }: { releaseId: number; data: AddTaskToReleaseRequest }) =>
      addTasksToRelease(releaseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: releaseKeys.tasks(variables.releaseId) });
      queryClient.invalidateQueries({ queryKey: releaseKeys.detail(variables.releaseId) });
    },
  });
}

export function useRemoveTaskFromRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ releaseId, taskId }: { releaseId: number; taskId: number }) =>
      removeTaskFromRelease(releaseId, taskId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: releaseKeys.tasks(variables.releaseId) });
      queryClient.invalidateQueries({ queryKey: releaseKeys.detail(variables.releaseId) });
    },
  });
}

export function useGenerateReleaseNotes() {
  return useMutation({
    mutationFn: generateReleaseNotes,
  });
}
