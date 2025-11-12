import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  SearchResultResponse,
  SearchRequest,
  SavedSearchResponse,
  SavedSearchRequest,
} from '../types/search.types';
import type { ApiResponse, PageResponse } from '../types/common.types';

// Query Keys
export const searchKeys = {
  all: ['search'] as const,
  results: () => [...searchKeys.all, 'results'] as const,
  result: (params: SearchRequest) => [...searchKeys.results(), params] as const,
  savedSearches: () => [...searchKeys.all, 'savedSearches'] as const,
  savedSearch: (id: number) => [...searchKeys.savedSearches(), id] as const,
  organizationSavedSearches: (orgId: number) => [...searchKeys.savedSearches(), 'organization', orgId] as const,
};

// API Functions

// Search

async function performSearch(
  organizationId: number,
  request: SearchRequest,
  page = 0,
  size = 20
): Promise<PageResponse<SearchResultResponse>> {
  const response = await apiClient.post<ApiResponse<PageResponse<SearchResultResponse>>>(
    `/api/secure/organizations/${organizationId}/search`,
    request,
    { params: { page, size } }
  );
  return response.data.data || response.data;
}

async function performQuickSearch(
  organizationId: number,
  query: string,
  entityType = 'GLOBAL',
  page = 0,
  size = 20
): Promise<PageResponse<SearchResultResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<SearchResultResponse>>>(
    `/api/secure/organizations/${organizationId}/search`,
    { params: { query, entityType, page, size } }
  );
  return response.data.data || response.data;
}

// Saved Searches

async function fetchSavedSearches(organizationId: number): Promise<SavedSearchResponse[]> {
  const response = await apiClient.get<ApiResponse<SavedSearchResponse[]>>(
    `/api/secure/organizations/${organizationId}/saved-searches`
  );
  return response.data.data || response.data || [];
}

async function fetchSavedSearch(id: number): Promise<SavedSearchResponse> {
  const response = await apiClient.get<ApiResponse<SavedSearchResponse>>(
    `/api/secure/saved-searches/${id}`
  );
  return response.data.data || response.data;
}

async function createSavedSearch(
  organizationId: number,
  request: SavedSearchRequest
): Promise<SavedSearchResponse> {
  const response = await apiClient.post<ApiResponse<SavedSearchResponse>>(
    `/api/secure/organizations/${organizationId}/saved-searches`,
    request
  );
  return response.data.data || response.data;
}

async function updateSavedSearch(
  id: number,
  request: SavedSearchRequest
): Promise<SavedSearchResponse> {
  const response = await apiClient.put<ApiResponse<SavedSearchResponse>>(
    `/api/secure/saved-searches/${id}`,
    request
  );
  return response.data.data || response.data;
}

async function deleteSavedSearch(id: number): Promise<void> {
  await apiClient.delete(`/api/secure/saved-searches/${id}`);
}

async function executeSavedSearch(
  organizationId: number,
  id: number,
  page = 0,
  size = 20
): Promise<PageResponse<SearchResultResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<SearchResultResponse>>>(
    `/api/secure/organizations/${organizationId}/saved-searches/${id}/execute`,
    { params: { page, size } }
  );
  return response.data.data || response.data;
}

// React Query Hooks

// Search

export function useSearch(
  organizationId: number | null,
  request: SearchRequest,
  page = 0,
  size = 20,
  enabled = true
) {
  return useQuery({
    queryKey: [...searchKeys.result(request), page, size],
    queryFn: () => performSearch(organizationId!, request, page, size),
    enabled: enabled && !!organizationId && (!!request.query || !!request.projectIds || !!request.assigneeIds),
  });
}

export function useQuickSearch(
  organizationId: number | null,
  query: string,
  entityType = 'GLOBAL',
  page = 0,
  size = 20,
  enabled = true
) {
  return useQuery({
    queryKey: [...searchKeys.results(), { query, entityType }, page, size],
    queryFn: () => performQuickSearch(organizationId!, query, entityType, page, size),
    enabled: enabled && !!organizationId && !!query && query.length >= 2,
  });
}

// Saved Searches

export function useSavedSearches(organizationId: number | null) {
  return useQuery({
    queryKey: searchKeys.organizationSavedSearches(organizationId!),
    queryFn: () => fetchSavedSearches(organizationId!),
    enabled: !!organizationId,
  });
}

export function useSavedSearch(id: number | null) {
  return useQuery({
    queryKey: searchKeys.savedSearch(id!),
    queryFn: () => fetchSavedSearch(id!),
    enabled: !!id,
  });
}

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, request }: { organizationId: number; request: SavedSearchRequest }) =>
      createSavedSearch(organizationId, request),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: searchKeys.organizationSavedSearches(result.organizationId) });
    },
  });
}

export function useUpdateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: SavedSearchRequest }) =>
      updateSavedSearch(id, request),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: searchKeys.savedSearch(result.id) });
      queryClient.invalidateQueries({ queryKey: searchKeys.organizationSavedSearches(result.organizationId) });
    },
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSavedSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.savedSearches() });
    },
  });
}

export function useExecuteSavedSearch(
  organizationId: number | null,
  id: number | null,
  page = 0,
  size = 20
) {
  return useQuery({
    queryKey: [...searchKeys.savedSearch(id!), 'execute', page, size],
    queryFn: () => executeSavedSearch(organizationId!, id!, page, size),
    enabled: !!organizationId && !!id,
  });
}

// Search Suggestions (for autocomplete)
export function useSearchSuggestions(organizationId: number | null, query: string) {
  return useQuery({
    queryKey: [...searchKeys.results(), 'suggestions', query],
    queryFn: () => performQuickSearch(organizationId!, query, 'GLOBAL', 0, 5),
    enabled: !!organizationId && !!query && query.length >= 2,
    staleTime: 30000, // 30 seconds
  });
}
