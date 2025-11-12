import { useQuery } from '@tanstack/react-query';
import apiClient from './client';
import type { ActivityLogEntry } from '../types/notification.types';
import type { ApiResponse } from '../types/common.types';

// Query Keys
export const activityKeys = {
  all: ['activity'] as const,
  task: (taskId: number) => [...activityKeys.all, 'task', taskId] as const,
  project: (projectId: number) => [...activityKeys.all, 'project', projectId] as const,
  organization: (orgId: number) => [...activityKeys.all, 'organization', orgId] as const,
};

// API Functions

async function fetchTaskActivity(taskId: number, limit?: number): Promise<ActivityLogEntry[]> {
  const response = await apiClient.get<ApiResponse<ActivityLogEntry[]>>(
    `/api/secure/tasks/${taskId}/activity`,
    { params: limit ? { limit } : {} }
  );

  return response.data.data || response.data || [];
}

async function fetchProjectActivity(
  projectId: number,
  limit?: number
): Promise<ActivityLogEntry[]> {
  const response = await apiClient.get<ApiResponse<ActivityLogEntry[]>>(
    `/api/secure/projects/${projectId}/activity`,
    { params: limit ? { limit } : {} }
  );

  return response.data.data || response.data || [];
}

async function fetchOrganizationActivity(
  organizationId: number,
  limit?: number
): Promise<ActivityLogEntry[]> {
  const response = await apiClient.get<ApiResponse<ActivityLogEntry[]>>(
    `/api/secure/organizations/${organizationId}/activity`,
    { params: limit ? { limit } : {} }
  );

  return response.data.data || response.data || [];
}

// React Query Hooks

export function useTaskActivity(taskId: number, limit?: number) {
  return useQuery({
    queryKey: activityKeys.task(taskId),
    queryFn: () => fetchTaskActivity(taskId, limit),
    enabled: !!taskId,
    staleTime: 60000, // 1 minute
  });
}

export function useProjectActivity(projectId: number, limit?: number) {
  return useQuery({
    queryKey: activityKeys.project(projectId),
    queryFn: () => fetchProjectActivity(projectId, limit),
    enabled: !!projectId,
    staleTime: 60000,
  });
}

export function useOrganizationActivity(organizationId: number, limit?: number) {
  return useQuery({
    queryKey: activityKeys.organization(organizationId),
    queryFn: () => fetchOrganizationActivity(organizationId, limit),
    enabled: !!organizationId,
    staleTime: 60000,
  });
}

// Alias for Dashboard usage
export const useRecentActivity = useOrganizationActivity;
