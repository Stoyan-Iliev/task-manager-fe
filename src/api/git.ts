import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  GitIntegrationResponse,
  CreateGitIntegrationRequest,
  UpdateGitIntegrationRequest,
  CommitResponse,
  PullRequestResponse,
  BranchResponse,
} from '../types/git.types';
import type { ApiResponse, PageResponse } from '../types/common.types';

// Query Keys
export const gitKeys = {
  all: ['git'] as const,
  integrations: () => [...gitKeys.all, 'integrations'] as const,
  integration: (id: number) => [...gitKeys.integrations(), id] as const,
  organizationIntegrations: (orgId: number) => [...gitKeys.integrations(), 'organization', orgId] as const,
  projectIntegrations: (projectId: number) => [...gitKeys.integrations(), 'project', projectId] as const,
  commits: () => [...gitKeys.all, 'commits'] as const,
  taskCommits: (taskId: number) => [...gitKeys.commits(), 'task', taskId] as const,
  projectCommits: (projectId: number) => [...gitKeys.commits(), 'project', projectId] as const,
  commit: (id: number) => [...gitKeys.commits(), id] as const,
  pullRequests: () => [...gitKeys.all, 'pullRequests'] as const,
  taskPullRequests: (taskId: number) => [...gitKeys.pullRequests(), 'task', taskId] as const,
  projectPullRequests: (projectId: number) => [...gitKeys.pullRequests(), 'project', projectId] as const,
  branches: () => [...gitKeys.all, 'branches'] as const,
  taskBranches: (taskId: number) => [...gitKeys.branches(), 'task', taskId] as const,
  projectBranches: (projectId: number) => [...gitKeys.branches(), 'project', projectId] as const,
};

// API Functions

// Git Integrations

async function fetchOrganizationIntegrations(orgId: number): Promise<GitIntegrationResponse[]> {
  const response = await apiClient.get<ApiResponse<GitIntegrationResponse[]>>(
    `/api/secure/organizations/${orgId}/git-integrations`
  );
  return response.data.data || response.data || [];
}

async function fetchProjectIntegrations(projectId: number): Promise<GitIntegrationResponse[]> {
  const response = await apiClient.get<ApiResponse<GitIntegrationResponse[]>>(
    `/api/secure/projects/${projectId}/git-integrations`
  );
  return response.data.data || response.data || [];
}

async function fetchIntegration(id: number): Promise<GitIntegrationResponse> {
  const response = await apiClient.get<ApiResponse<GitIntegrationResponse>>(
    `/api/secure/git-integrations/${id}`
  );
  return response.data.data || response.data;
}

async function createIntegration(
  orgId: number,
  data: CreateGitIntegrationRequest
): Promise<GitIntegrationResponse> {
  const response = await apiClient.post<ApiResponse<GitIntegrationResponse>>(
    `/api/secure/organizations/${orgId}/git-integrations`,
    data
  );
  return response.data.data || response.data;
}

async function updateIntegration(
  id: number,
  data: UpdateGitIntegrationRequest
): Promise<GitIntegrationResponse> {
  const response = await apiClient.put<ApiResponse<GitIntegrationResponse>>(
    `/api/secure/git-integrations/${id}`,
    data
  );
  return response.data.data || response.data;
}

async function deleteIntegration(id: number): Promise<void> {
  await apiClient.delete(`/api/secure/git-integrations/${id}`);
}

async function testConnection(
  orgId: number,
  data: CreateGitIntegrationRequest
): Promise<boolean> {
  const response = await apiClient.post<ApiResponse<boolean>>(
    `/api/secure/organizations/${orgId}/git-integrations/test-connection`,
    data
  );
  return response.data.data || response.data || false;
}

async function syncIntegration(id: number): Promise<GitIntegrationResponse> {
  const response = await apiClient.post<ApiResponse<GitIntegrationResponse>>(
    `/api/secure/git-integrations/${id}/sync`
  );
  return response.data.data || response.data;
}

// Commits

async function fetchTaskCommits(taskId: number): Promise<CommitResponse[]> {
  const response = await apiClient.get<ApiResponse<CommitResponse[]>>(
    `/api/secure/tasks/${taskId}/git-commits`
  );
  return response.data.data || response.data || [];
}

async function fetchProjectCommits(projectId: number, page = 0, size = 20): Promise<PageResponse<CommitResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<CommitResponse>>>(
    `/api/secure/projects/${projectId}/git-commits`,
    { params: { page, size } }
  );
  return response.data.data || response.data;
}

async function fetchCommit(commitId: number): Promise<CommitResponse> {
  const response = await apiClient.get<ApiResponse<CommitResponse>>(
    `/api/secure/git-commits/${commitId}`
  );
  return response.data.data || response.data;
}

async function linkCommitToTask(commitId: number, taskId: number): Promise<CommitResponse> {
  const response = await apiClient.post<ApiResponse<CommitResponse>>(
    `/api/secure/git-commits/${commitId}/link-task/${taskId}`
  );
  return response.data.data || response.data;
}

async function unlinkCommitFromTask(commitId: number, taskId: number): Promise<CommitResponse> {
  const response = await apiClient.delete<ApiResponse<CommitResponse>>(
    `/api/secure/git-commits/${commitId}/unlink-task/${taskId}`
  );
  return response.data.data || response.data;
}

// Pull Requests (using the same endpoint pattern as commits)
// Note: Backend controller for PRs needs to be created similar to GitCommitController

async function fetchTaskPullRequests(taskId: number): Promise<PullRequestResponse[]> {
  const response = await apiClient.get<ApiResponse<PullRequestResponse[]>>(
    `/api/secure/tasks/${taskId}/pull-requests`
  );
  return response.data.data || response.data || [];
}

async function fetchProjectPullRequests(projectId: number, page = 0, size = 20): Promise<PageResponse<PullRequestResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<PullRequestResponse>>>(
    `/api/secure/projects/${projectId}/pull-requests`,
    { params: { page, size } }
  );
  return response.data.data || response.data;
}

// Branches

async function fetchTaskBranches(taskId: number): Promise<BranchResponse[]> {
  const response = await apiClient.get<ApiResponse<BranchResponse[]>>(
    `/api/secure/tasks/${taskId}/git-branches`
  );
  return response.data.data || response.data || [];
}

async function fetchProjectBranches(projectId: number, page = 0, size = 20): Promise<PageResponse<BranchResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<BranchResponse>>>(
    `/api/secure/projects/${projectId}/git-branches`,
    { params: { page, size } }
  );
  return response.data.data || response.data;
}

// React Query Hooks

// Git Integrations

export function useOrganizationIntegrations(orgId: number | null) {
  return useQuery({
    queryKey: gitKeys.organizationIntegrations(orgId!),
    queryFn: () => fetchOrganizationIntegrations(orgId!),
    enabled: !!orgId,
  });
}

export function useProjectIntegrations(projectId: number | null) {
  return useQuery({
    queryKey: gitKeys.projectIntegrations(projectId!),
    queryFn: () => fetchProjectIntegrations(projectId!),
    enabled: !!projectId,
  });
}

export function useGitIntegration(id: number | null) {
  return useQuery({
    queryKey: gitKeys.integration(id!),
    queryFn: () => fetchIntegration(id!),
    enabled: !!id,
  });
}

export function useCreateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: number; data: CreateGitIntegrationRequest }) =>
      createIntegration(orgId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gitKeys.organizationIntegrations(variables.orgId) });
      if (variables.data.projectId) {
        queryClient.invalidateQueries({ queryKey: gitKeys.projectIntegrations(variables.data.projectId) });
      }
    },
  });
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGitIntegrationRequest }) =>
      updateIntegration(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: gitKeys.integration(result.id) });
      queryClient.invalidateQueries({ queryKey: gitKeys.organizationIntegrations(result.organizationId) });
      if (result.projectId) {
        queryClient.invalidateQueries({ queryKey: gitKeys.projectIntegrations(result.projectId) });
      }
    },
  });
}

export function useDeleteIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gitKeys.integrations() });
    },
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: number; data: CreateGitIntegrationRequest }) =>
      testConnection(orgId, data),
  });
}

export function useSyncIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncIntegration,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: gitKeys.integration(result.id) });
      queryClient.invalidateQueries({ queryKey: gitKeys.organizationIntegrations(result.organizationId) });
      if (result.projectId) {
        queryClient.invalidateQueries({ queryKey: gitKeys.projectIntegrations(result.projectId) });
      }
    },
  });
}

// Commits

export function useTaskCommits(taskId: number | null) {
  return useQuery({
    queryKey: gitKeys.taskCommits(taskId!),
    queryFn: () => fetchTaskCommits(taskId!),
    enabled: !!taskId,
  });
}

export function useProjectCommits(projectId: number | null, page = 0, size = 20) {
  return useQuery({
    queryKey: [...gitKeys.projectCommits(projectId!), page, size],
    queryFn: () => fetchProjectCommits(projectId!, page, size),
    enabled: !!projectId,
  });
}

export function useCommit(commitId: number | null) {
  return useQuery({
    queryKey: gitKeys.commit(commitId!),
    queryFn: () => fetchCommit(commitId!),
    enabled: !!commitId,
  });
}

export function useLinkCommitToTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commitId, taskId }: { commitId: number; taskId: number }) =>
      linkCommitToTask(commitId, taskId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gitKeys.taskCommits(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: gitKeys.commit(variables.commitId) });
    },
  });
}

export function useUnlinkCommitFromTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commitId, taskId }: { commitId: number; taskId: number }) =>
      unlinkCommitFromTask(commitId, taskId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gitKeys.taskCommits(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: gitKeys.commit(variables.commitId) });
    },
  });
}

// Pull Requests

export function useTaskPullRequests(taskId: number | null) {
  return useQuery({
    queryKey: gitKeys.taskPullRequests(taskId!),
    queryFn: () => fetchTaskPullRequests(taskId!),
    enabled: !!taskId,
  });
}

export function useProjectPullRequests(projectId: number | null, page = 0, size = 20) {
  return useQuery({
    queryKey: [...gitKeys.projectPullRequests(projectId!), page, size],
    queryFn: () => fetchProjectPullRequests(projectId!, page, size),
    enabled: !!projectId,
  });
}

// Branches

export function useTaskBranches(taskId: number | null) {
  return useQuery({
    queryKey: gitKeys.taskBranches(taskId!),
    queryFn: () => fetchTaskBranches(taskId!),
    enabled: !!taskId,
  });
}

export function useProjectBranches(projectId: number | null, page = 0, size = 20) {
  return useQuery({
    queryKey: [...gitKeys.projectBranches(projectId!), page, size],
    queryFn: () => fetchProjectBranches(projectId!, page, size),
    enabled: !!projectId,
  });
}
