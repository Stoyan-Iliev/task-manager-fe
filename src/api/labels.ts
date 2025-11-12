import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { ApiResponse } from '../types/common.types';
import type { LabelResponse, LabelRequest } from '../types/task.types';

// Query keys
export const labelKeys = {
  all: ['labels'] as const,
  organization: (orgId: number) => [...labelKeys.all, 'organization', orgId] as const,
};

// API Functions
async function fetchOrganizationLabels(organizationId: number): Promise<LabelResponse[]> {
  const response = await apiClient.get<ApiResponse<LabelResponse[]>>(
    `/api/secure/organizations/${organizationId}/labels`
  );
  return response.data.data || response.data;
}

async function createLabel(
  organizationId: number,
  data: LabelRequest
): Promise<LabelResponse> {
  const response = await apiClient.post<ApiResponse<LabelResponse>>(
    `/api/secure/organizations/${organizationId}/labels`,
    data
  );
  return response.data.data || response.data;
}

async function updateLabel(
  organizationId: number,
  labelId: number,
  data: LabelRequest
): Promise<LabelResponse> {
  const response = await apiClient.patch<ApiResponse<LabelResponse>>(
    `/api/secure/organizations/${organizationId}/labels/${labelId}`,
    data
  );
  return response.data.data || response.data;
}

async function deleteLabel(organizationId: number, labelId: number): Promise<void> {
  await apiClient.delete(`/api/secure/organizations/${organizationId}/labels/${labelId}`);
}

// Hooks
export function useOrganizationLabels(organizationId: number | null) {
  return useQuery({
    queryKey: organizationId ? labelKeys.organization(organizationId) : ['labels', 'no-org'],
    queryFn: () => fetchOrganizationLabels(organizationId!),
    enabled: !!organizationId,
    initialData: [],
  });
}

export function useCreateLabel(organizationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LabelRequest) => createLabel(organizationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.organization(organizationId) });
    },
  });
}

export function useUpdateLabel(organizationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ labelId, data }: { labelId: number; data: LabelRequest }) =>
      updateLabel(organizationId, labelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.organization(organizationId) });
    },
  });
}

export function useDeleteLabel(organizationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (labelId: number) => deleteLabel(organizationId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.organization(organizationId) });
    },
  });
}
