import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  UserProfileResponse,
  UpdateUserProfileRequest,
  ChangePasswordRequest,
  AvatarUploadResponse
} from '../types/user.types';
import { handleApiError } from '../util/errorHandler';
import toast from 'react-hot-toast';

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async (): Promise<UserProfileResponse> => {
      const response = await apiClient.get<UserProfileResponse>('/api/secure/users/me');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserProfileRequest): Promise<UserProfileResponse> => {
      const response = await apiClient.put<UserProfileResponse>('/api/secure/users/me', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<AvatarUploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<AvatarUploadResponse>(
        '/api/secure/users/me/avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Avatar uploaded successfully');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

export const useDeleteAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.delete('/api/secure/users/me/avatar');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Avatar deleted successfully');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest): Promise<void> => {
      await apiClient.post('/api/secure/users/me/change-password', data);
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};
