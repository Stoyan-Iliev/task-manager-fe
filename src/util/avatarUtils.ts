import apiClient from '../api/client';

const avatarCache = new Map<string, string>();

export const getAvatarUrl = async (userId: number | undefined, avatarUrl: string | undefined | null): Promise<string | undefined> => {
  if (!userId || !avatarUrl) {
    return undefined;
  }

  const cacheKey = `${userId}-${avatarUrl}`;
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey);
  }

  try {
    const response = await apiClient.get(`/api/secure/users/${userId}/avatar`, {
      responseType: 'blob',
    });

    const blob = response.data;
    const blobUrl = URL.createObjectURL(blob);
    avatarCache.set(cacheKey, blobUrl);
    return blobUrl;
  } catch (error) {
    console.error('Failed to load avatar:', error);
    return undefined;
  }
};

export const getUserInitials = (firstName?: string, lastName?: string, username?: string): string => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  if (username) {
    return username.charAt(0).toUpperCase();
  }
  return '?';
};
