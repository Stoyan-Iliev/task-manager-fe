import { useQuery } from '@tanstack/react-query';
import apiClient from './client';
import type {
  OrganizationMetricsResponse,
  ProjectMetricsResponse,
  UserActivityResponse,
  TaskStatusDistributionResponse,
  TimeRangeMetricsResponse,
} from '../types/analytics.types';
import type { ApiResponse } from '../types/common.types';

// Query Keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  organization: (orgId: number) => [...analyticsKeys.all, 'organization', orgId] as const,
  organizationProjects: (orgId: number) => [...analyticsKeys.organization(orgId), 'projects'] as const,
  project: (projectId: number) => [...analyticsKeys.all, 'project', projectId] as const,
  projectStatusDistribution: (projectId: number) => [...analyticsKeys.project(projectId), 'status-distribution'] as const,
  userActivity: (orgId: number, userId: number) => [...analyticsKeys.all, 'user', orgId, userId] as const,
  timeRange: (entityType: string, entityId: number, startDate: string, endDate: string) =>
    [...analyticsKeys.all, entityType, entityId, 'time-range', startDate, endDate] as const,
};

// API Functions

async function fetchOrganizationMetrics(organizationId: number): Promise<OrganizationMetricsResponse> {
  const response = await apiClient.get<ApiResponse<OrganizationMetricsResponse>>(
    `/api/secure/analytics/organizations/${organizationId}`
  );
  return response.data.data || response.data;
}

async function fetchOrganizationProjectsMetrics(organizationId: number): Promise<ProjectMetricsResponse[]> {
  const response = await apiClient.get<ApiResponse<ProjectMetricsResponse[]>>(
    `/api/secure/analytics/organizations/${organizationId}/projects`
  );
  return response.data.data || response.data || [];
}

async function fetchProjectMetrics(projectId: number): Promise<ProjectMetricsResponse> {
  const response = await apiClient.get<ApiResponse<ProjectMetricsResponse>>(
    `/api/secure/analytics/projects/${projectId}`
  );
  return response.data.data || response.data;
}

async function fetchUserActivity(
  organizationId: number,
  userId: number
): Promise<UserActivityResponse> {
  const response = await apiClient.get<ApiResponse<UserActivityResponse>>(
    `/api/secure/analytics/organizations/${organizationId}/users/${userId}`
  );
  return response.data.data || response.data;
}

async function fetchTaskStatusDistribution(projectId: number): Promise<TaskStatusDistributionResponse[]> {
  const response = await apiClient.get<ApiResponse<TaskStatusDistributionResponse[]>>(
    `/api/secure/analytics/projects/${projectId}/status-distribution`
  );
  return response.data.data || response.data || [];
}

async function fetchTimeRangeMetrics(
  entityType: 'project' | 'organization',
  entityId: number,
  startDate: string,
  endDate: string
): Promise<TimeRangeMetricsResponse> {
  const endpoint =
    entityType === 'project'
      ? `/api/secure/analytics/projects/${entityId}/time-range`
      : `/api/secure/analytics/organizations/${entityId}/time-range`;

  const response = await apiClient.get<ApiResponse<TimeRangeMetricsResponse>>(endpoint, {
    params: { startDate, endDate },
  });
  return response.data.data || response.data;
}

// React Query Hooks

export function useOrganizationMetrics(organizationId: number | null) {
  return useQuery({
    queryKey: analyticsKeys.organization(organizationId!),
    queryFn: () => fetchOrganizationMetrics(organizationId!),
    enabled: !!organizationId,
  });
}

export function useOrganizationProjectsMetrics(organizationId: number | null) {
  return useQuery({
    queryKey: analyticsKeys.organizationProjects(organizationId!),
    queryFn: () => fetchOrganizationProjectsMetrics(organizationId!),
    enabled: !!organizationId,
  });
}

export function useProjectMetrics(projectId: number | null) {
  return useQuery({
    queryKey: analyticsKeys.project(projectId!),
    queryFn: () => fetchProjectMetrics(projectId!),
    enabled: !!projectId,
  });
}

export function useUserActivity(organizationId: number | null, userId: number | null) {
  return useQuery({
    queryKey: analyticsKeys.userActivity(organizationId!, userId!),
    queryFn: () => fetchUserActivity(organizationId!, userId!),
    enabled: !!organizationId && !!userId,
  });
}

export function useTaskStatusDistribution(projectId: number | null) {
  return useQuery({
    queryKey: analyticsKeys.projectStatusDistribution(projectId!),
    queryFn: () => fetchTaskStatusDistribution(projectId!),
    enabled: !!projectId,
  });
}

export function useTimeRangeMetrics(
  entityType: 'project' | 'organization',
  entityId: number | null,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: analyticsKeys.timeRange(entityType, entityId!, startDate, endDate),
    queryFn: () => fetchTimeRangeMetrics(entityType, entityId!, startDate, endDate),
    enabled: !!entityId && !!startDate && !!endDate,
  });
}
