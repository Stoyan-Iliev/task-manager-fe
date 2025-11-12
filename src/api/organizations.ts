import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  OrganizationRequest,
  OrganizationResponse,
} from '../types/organization.types';
import { handleApiError } from '../util/errorHandler';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import {
  cacheOrganizations,
  cacheOrganization,
  removeOrganizationFromCache,
} from '../redux/organizationSlice';

/**
 * Fetch all organizations for the current user
 */
export const useOrganizations = () => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: ['organizations'],
    queryFn: async (): Promise<OrganizationResponse[]> => {
      const response = await apiClient.get<OrganizationResponse[]>(
        '/api/secure/organizations'
      );
      // Cache organizations in Redux
      dispatch(cacheOrganizations(response.data));
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch a single organization by ID
 */
export const useOrganization = (organizationId: number | null) => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async (): Promise<OrganizationResponse> => {
      const response = await apiClient.get<OrganizationResponse>(
        `/api/secure/organizations/${organizationId}`
      );
      // Cache organization in Redux
      dispatch(cacheOrganization(response.data));
      return response.data;
    },
    enabled: organizationId !== null, // Only run if organizationId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch a single organization by slug
 */
export const useOrganizationBySlug = (slug: string | null) => {
  const dispatch = useDispatch();

  return useQuery({
    queryKey: ['organization', 'slug', slug],
    queryFn: async (): Promise<OrganizationResponse> => {
      const response = await apiClient.get<OrganizationResponse>(
        `/api/secure/organizations/by-slug/${slug}`
      );
      // Cache organization in Redux
      dispatch(cacheOrganization(response.data));
      return response.data;
    },
    enabled: slug !== null && slug !== '', // Only run if slug is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Create a new organization
 */
export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (data: OrganizationRequest): Promise<OrganizationResponse> => {
      const response = await apiClient.post<OrganizationResponse>(
        '/api/secure/organizations',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Cache new organization in Redux
      dispatch(cacheOrganization(data));

      // Invalidate organizations list to refetch
      queryClient.invalidateQueries({ queryKey: ['organizations'] });

      toast.success(`Organization "${data.name}" created successfully!`);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Update an existing organization
 */
export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: OrganizationRequest;
    }): Promise<OrganizationResponse> => {
      const response = await apiClient.put<OrganizationResponse>(
        `/api/secure/organizations/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Update cached organization in Redux
      dispatch(cacheOrganization(data));

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization', data.id] });

      toast.success(`Organization "${data.name}" updated successfully!`);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Delete an organization
 */
export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiClient.delete(`/api/secure/organizations/${id}`);
    },
    onSuccess: (_, id) => {
      // Remove from Redux cache
      dispatch(removeOrganizationFromCache(id));

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization', id] });

      toast.success('Organization deleted successfully');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};
