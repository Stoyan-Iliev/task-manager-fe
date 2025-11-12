import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  MemberResponse,
  MemberInviteRequest,
  UpdateMemberRoleRequest,
} from '../types/organization.types';
import { handleApiError } from '../util/errorHandler';
import toast from 'react-hot-toast';

/**
 * Fetch all members of an organization
 */
export const useOrganizationMembers = (organizationId: number | null) => {
  return useQuery({
    queryKey: ['organization', organizationId, 'members'],
    queryFn: async (): Promise<MemberResponse[]> => {
      const response = await apiClient.get<MemberResponse[]>(
        `/api/secure/organizations/${organizationId}/members`
      );
      return response.data;
    },
    enabled: organizationId !== null, // Only run if organizationId is provided
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter than organization data)
  });
};

/**
 * Fetch a specific member of an organization
 */
export const useOrganizationMember = (
  organizationId: number | null,
  userId: number | null
) => {
  return useQuery({
    queryKey: ['organization', organizationId, 'members', userId],
    queryFn: async (): Promise<MemberResponse> => {
      const response = await apiClient.get<MemberResponse>(
        `/api/secure/organizations/${organizationId}/members/${userId}`
      );
      return response.data;
    },
    enabled: organizationId !== null && userId !== null,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Add a member to an organization (invite)
 */
export const useAddMember = (organizationId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MemberInviteRequest): Promise<MemberResponse> => {
      const response = await apiClient.post<MemberResponse>(
        `/api/secure/organizations/${organizationId}/members`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate members list to refetch
      queryClient.invalidateQueries({
        queryKey: ['organization', organizationId, 'members'],
      });

      // Invalidate organization to update member count
      queryClient.invalidateQueries({
        queryKey: ['organization', organizationId],
      });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });

      toast.success(`${data.username} added to organization successfully!`);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Update a member's role in an organization
 */
export const useUpdateMemberRole = (organizationId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: number;
      data: UpdateMemberRoleRequest;
    }): Promise<MemberResponse> => {
      const response = await apiClient.put<MemberResponse>(
        `/api/secure/organizations/${organizationId}/members/${userId}/role`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['organization', organizationId, 'members'],
      });
      queryClient.invalidateQueries({
        queryKey: ['organization', organizationId, 'members', data.userId],
      });

      toast.success(`${data.username}'s role updated successfully!`);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Remove a member from an organization
 */
export const useRemoveMember = (organizationId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number): Promise<void> => {
      await apiClient.delete(
        `/api/secure/organizations/${organizationId}/members/${userId}`
      );
    },
    onSuccess: (_, userId) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['organization', organizationId, 'members'],
      });
      queryClient.invalidateQueries({
        queryKey: ['organization', organizationId, 'members', userId],
      });

      // Invalidate organization to update member count
      queryClient.invalidateQueries({
        queryKey: ['organization', organizationId],
      });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });

      toast.success('Member removed successfully');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};
