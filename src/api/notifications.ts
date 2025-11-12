import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type { NotificationResponse } from '../types/notification.types';
import type { PageResponse } from '../types/common.types';

// Query Keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (page: number, size: number) => [...notificationKeys.lists(), page, size] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
  unreadList: (page: number, size: number) => [...notificationKeys.unread(), page, size] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
};

// API Functions

async function fetchNotifications(
  page: number = 0,
  size: number = 50
): Promise<PageResponse<NotificationResponse>> {
  const response = await apiClient.get<PageResponse<NotificationResponse>>(
    '/api/secure/notifications',
    { params: { page, size } }
  );

  return response.data;
}

async function fetchUnreadNotifications(
  page: number = 0,
  size: number = 50
): Promise<PageResponse<NotificationResponse>> {
  const response = await apiClient.get<PageResponse<NotificationResponse>>(
    '/api/secure/notifications/unread',
    { params: { page, size } }
  );

  return response.data;
}

async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<{ count: number }>(
    '/api/secure/notifications/unread/count'
  );

  return response.data.count;
}

async function markAsRead(notificationId: number): Promise<void> {
  await apiClient.put(`/api/secure/notifications/${notificationId}/read`);
}

async function markAllAsRead(): Promise<void> {
  await apiClient.put('/api/secure/notifications/read-all');
}

// React Query Hooks

export function useNotifications(page: number = 0, size: number = 50) {
  return useQuery({
    queryKey: notificationKeys.list(page, size),
    queryFn: () => fetchNotifications(page, size),
    staleTime: 30000, // 30 seconds
  });
}

export function useUnreadNotifications(page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: notificationKeys.unreadList(page, size),
    queryFn: () => fetchUnreadNotifications(page, size),
    staleTime: 30000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      // Invalidate all notification queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      // Invalidate all notification queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
