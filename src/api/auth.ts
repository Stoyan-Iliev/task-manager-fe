import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { setTokens, clearTokens } from './client';
import type {
  LoginRequest,
  SignUpRequest,
  TokenResponse,
  RefreshRequest,
  LogoutRequest
} from '../types/auth.types';
import { handleApiError } from '../util/errorHandler';
import toast from 'react-hot-toast';

/**
 * Sign up a new user
 */
export const useSignup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SignUpRequest): Promise<TokenResponse> => {
      const response = await apiClient.post<TokenResponse>('/api/auth/signup', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Store tokens in memory
      setTokens(data.accessToken, data.refreshToken);

      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: ['user'] });

      toast.success('Account created successfully! Welcome!');
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Login user
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginRequest): Promise<TokenResponse> => {
      const response = await apiClient.post<TokenResponse>('/api/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Store tokens in memory
      setTokens(data.accessToken, data.refreshToken);

      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: ['user'] });

      toast.success(`Welcome back, ${data.user.username}!`);
    },
    onError: (error) => {
      handleApiError(error);
    },
  });
};

/**
 * Refresh access token using refresh token
 */
export const useRefreshToken = () => {
  return useMutation({
    mutationFn: async (data: RefreshRequest): Promise<TokenResponse> => {
      const response = await apiClient.post<TokenResponse>('/api/auth/refresh', data, {
        headers: {
          'Cache-Control': 'no-store',
          'Pragma': 'no-cache',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Update tokens in memory
      setTokens(data.accessToken, data.refreshToken);
    },
    onError: (error) => {
      // Clear tokens and redirect to login
      clearTokens();
      handleApiError(error);
    },
  });
};

/**
 * Logout user
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LogoutRequest): Promise<void> => {
      await apiClient.post('/api/auth/logout', data);
    },
    onSuccess: () => {
      // Clear tokens from memory
      clearTokens();

      // Clear all queries from cache
      queryClient.clear();

      toast.success('Logged out successfully');
    },
    onError: (error) => {
      // Even if logout fails on backend, clear local tokens
      clearTokens();
      queryClient.clear();
      handleApiError(error);
    },
  });
};
