import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { tokenRefreshManager } from './tokenRefreshManager';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Token storage (persisted in localStorage for session continuity)
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Token refresh state for 401 interceptor
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Default token expiry (15 minutes in seconds) - used if server doesn't provide expiresIn
const DEFAULT_TOKEN_EXPIRY_SECONDS = 15 * 60;

// Initialize tokens from localStorage on module load
const initializeTokens = () => {
  try {
    accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    // If we have tokens from storage, start the refresh timer with default expiry
    // The timer will be reset with actual expiry when user logs in or refreshes
    if (accessToken && refreshToken) {
      // Parse JWT to get actual expiry if possible
      const expirySeconds = getTokenExpiryFromJwt(accessToken);
      if (expirySeconds && expirySeconds > 0) {
        tokenRefreshManager.startRefreshTimer(expirySeconds);
      }
    }
  } catch (error) {
    accessToken = null;
    refreshToken = null;
  }
};

/**
 * Parse JWT and extract remaining time until expiry (in seconds)
 */
const getTokenExpiryFromJwt = (token: string): number | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return null;

    const expiryTimestamp = payload.exp * 1000; // Convert to ms
    const remainingMs = expiryTimestamp - Date.now();

    return Math.max(0, Math.floor(remainingMs / 1000));
  } catch {
    return null;
  }
};

// Process queued requests
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Set tokens and start proactive refresh timer
 * @param access - Access token
 * @param refresh - Refresh token
 * @param expiresIn - Optional expiry time in seconds (from server response)
 */
export const setTokens = (access: string, refresh: string, expiresIn?: number) => {
  accessToken = access;
  refreshToken = refresh;

  // Persist to localStorage
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  } catch (error) {
    console.error('Failed to persist tokens to localStorage:', error);
  }

  // Start proactive refresh timer
  // Use provided expiresIn, or parse from JWT, or use default
  let expirySeconds = expiresIn;

  if (!expirySeconds) {
    expirySeconds = getTokenExpiryFromJwt(access) ?? undefined;
  }

  if (!expirySeconds || expirySeconds <= 0) {
    expirySeconds = DEFAULT_TOKEN_EXPIRY_SECONDS;
  }

  tokenRefreshManager.startRefreshTimer(expirySeconds);
};

export const getAccessToken = () => accessToken;

export const getRefreshToken = () => refreshToken;

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;

  // Stop refresh timer
  tokenRefreshManager.onTokensCleared();

  // Clear from localStorage
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear tokens from localStorage:', error);
  }
};

// Create Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Initialize the token refresh manager with required callbacks
tokenRefreshManager.initialize({
  getRefreshToken: () => refreshToken,
  setTokens: setTokens,
  clearTokens: clearTokens,
  apiBaseUrl: API_BASE_URL,
});

// Initialize tokens after manager is set up
initializeTokens();

// Request interceptor - Add authorization header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Helper to unwrap standardized ApiResponse format.
 * Handles both old format (direct data) and new format (wrapped in ApiResponse).
 *
 * Old format: { data: organizationObject }
 * New format: { success: true, data: organizationObject }
 */
const unwrapApiResponse = (response: any) => {
  // If response has 'success' field, it's the new ApiResponse format
  if (response.data && typeof response.data === 'object' && 'success' in response.data) {
    // New standardized format
    if (response.data.success) {
      // Success: return the data field
      return { ...response, data: response.data.data };
    } else {
      // Error: throw with error message
      throw new Error(response.data.error || 'An error occurred');
    }
  }

  // Old format: return as-is
  return response;
};

// Response interceptor - Unwrap ApiResponse and handle errors
apiClient.interceptors.response.use(
  (response) => {
    try {
      return unwrapApiResponse(response);
    } catch (error) {
      return Promise.reject(error);
    }
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Extract error message from new ApiResponse format if present
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as any;
      if ('success' in data && data.success === false && data.error) {
        // Override error message with API error
        error.message = data.error;
      }
    }

    // If error is 401 and we have a refresh token, try to refresh
    // This is a fallback in case proactive refresh missed (e.g., network issues)
    if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
      // Don't try to refresh if proactive refresh is already in progress
      if (tokenRefreshManager.refreshInProgress) {
        // Wait for proactive refresh to complete, then retry
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      if (isRefreshing) {
        // Another request is already refreshing the token, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('Token interceptor: Performing reactive refresh after 401...');

        const response = await axios.post(
          `${apiClient.defaults.baseURL}/api/auth/refresh`,
          { refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
              'Pragma': 'no-cache',
            },
          }
        );

        // Validate response structure
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

        if (!newAccessToken || !newRefreshToken) {
          throw new Error('Invalid refresh response: missing tokens');
        }

        setTokens(newAccessToken, newRefreshToken, expiresIn);

        // Process all queued requests with the new token
        processQueue(null, newAccessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, reject all queued requests
        processQueue(refreshError as Error, null);

        // Clear tokens and redirect to login
        clearTokens();
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Re-export token event subscription for components that need it
export { tokenRefreshManager } from './tokenRefreshManager';

export default apiClient;
