import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  ProjectMemberResponse,
  AddProjectMemberRequest,
  UpdateProjectMemberRoleRequest,
} from '../types/project.types';
import { handleApiError } from '../util/errorHandler';
import toast from 'react-hot-toast';

/**
 * Fetch all members for a project
 */
export const useProjectMembers = (projectId: number | null) => {
  return useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: async (): Promise<ProjectMemberResponse[]> => {
      const response = await apiClient.get<ProjectMemberResponse[]>(
        `/api/secure/projects/${projectId}/members`
      );
      return response.data;
    },
    enabled: projectId !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Add a member to a project with optimistic updates
 */
export const useAddProjectMember = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddProjectMemberRequest): Promise<ProjectMemberResponse> => {
      const response = await apiClient.post<ProjectMemberResponse>(
        `/api/secure/projects/${projectId}/members`,
        data
      );
      return response.data;
    },
    onMutate: async (newMember) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['projectMembers', projectId] });

      // Snapshot previous value
      const previousMembers = queryClient.getQueryData<ProjectMemberResponse[]>([
        'projectMembers',
        projectId,
      ]);

      // Optimistically add member (temporary ID until server responds)
      if (previousMembers) {
        const optimisticMember: ProjectMemberResponse = {
          id: Date.now(), // Temporary ID
          userId: newMember.userId,
          username: 'Loading...',
          email: '',
          fullName: null,
          role: newMember.role,
          addedAt: new Date().toISOString(),
        };
        queryClient.setQueryData<ProjectMemberResponse[]>(
          ['projectMembers', projectId],
          [...previousMembers, optimisticMember]
        );
      }

      return { previousMembers };
    },
    onError: (error, _newMember, context) => {
      // Rollback on error
      if (context?.previousMembers) {
        queryClient.setQueryData(['projectMembers', projectId], context.previousMembers);
      }
      handleApiError(error);
    },
    onSuccess: (data) => {
      toast.success(`${data.fullName || data.username} added to project`);
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
    },
  });
};

/**
 * Update a project member's role with optimistic updates
 */
export const useUpdateProjectMemberRole = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: number;
      role: UpdateProjectMemberRoleRequest;
    }): Promise<ProjectMemberResponse> => {
      const response = await apiClient.put<ProjectMemberResponse>(
        `/api/secure/projects/${projectId}/members/${userId}/role`,
        role
      );
      return response.data;
    },
    onMutate: async ({ userId, role }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['projectMembers', projectId] });

      // Snapshot previous value
      const previousMembers = queryClient.getQueryData<ProjectMemberResponse[]>([
        'projectMembers',
        projectId,
      ]);

      // Optimistically update member role
      if (previousMembers) {
        queryClient.setQueryData<ProjectMemberResponse[]>(
          ['projectMembers', projectId],
          previousMembers.map((member) =>
            member.userId === userId ? { ...member, role: role.role } : member
          )
        );
      }

      return { previousMembers };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousMembers) {
        queryClient.setQueryData(['projectMembers', projectId], context.previousMembers);
      }
      handleApiError(error);
    },
    onSuccess: (data) => {
      toast.success(`Role updated to ${data.role}`);
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
    },
  });
};

/**
 * Remove a member from a project with optimistic updates
 */
export const useRemoveProjectMember = (projectId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number): Promise<void> => {
      await apiClient.delete(`/api/secure/projects/${projectId}/members/${userId}`);
    },
    onMutate: async (userId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['projectMembers', projectId] });

      // Snapshot previous value
      const previousMembers = queryClient.getQueryData<ProjectMemberResponse[]>([
        'projectMembers',
        projectId,
      ]);

      // Optimistically remove member
      if (previousMembers) {
        queryClient.setQueryData<ProjectMemberResponse[]>(
          ['projectMembers', projectId],
          previousMembers.filter((member) => member.userId !== userId)
        );
      }

      return { previousMembers };
    },
    onError: (error, _userId, context) => {
      // Rollback on error
      if (context?.previousMembers) {
        queryClient.setQueryData(['projectMembers', projectId], context.previousMembers);
      }
      handleApiError(error);
    },
    onSuccess: () => {
      toast.success('Member removed from project');
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
    },
  });
};
