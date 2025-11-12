import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Token storage (persisted in localStorage for session continuity)
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Token refresh state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// Initialize tokens from localStorage on module load
const initializeTokens = () => {
  try {
    accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    accessToken = null;
    refreshToken = null;
  }
};

// Initialize tokens immediately
initializeTokens();

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

// Token management functions
export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;

  // Persist to localStorage
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  } catch (error) {
  }
};

export const getAccessToken = () => accessToken;

export const getRefreshToken = () => refreshToken;

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;

  // Clear from localStorage
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
  }
};

// Create Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
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

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
        setTokens(newAccessToken, newRefreshToken);

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

export default apiClient;
