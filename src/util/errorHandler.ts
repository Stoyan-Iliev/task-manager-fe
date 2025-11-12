import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface ErrorResponse {
  error?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

export const handleApiError = (error: unknown): void => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data as ErrorResponse;

    switch (status) {
      case 400:
        // Bad Request - Validation errors
        if (data?.errors) {
          // Handle validation errors from backend
          Object.entries(data.errors).forEach(([field, messages]) => {
            messages.forEach((msg) => toast.error(`${field}: ${msg}`));
          });
        } else {
          toast.error(data?.error || data?.message || 'Invalid request');
        }
        break;

      case 401:
        // Unauthorized
        toast.error('Please log in again');
        break;

      case 403:
        // Forbidden
        toast.error("You don't have permission for this action");
        break;

      case 404:
        // Not Found
        toast.error(data?.error || data?.message || 'Resource not found');
        break;

      case 409:
        // Conflict
        toast.error(data?.error || data?.message || 'Resource already exists');
        break;

      case 429:
        // Rate Limited
        const retryAfter = error.response?.headers['retry-after'];
        toast.error(
          `Too many requests. Please try again${retryAfter ? ` in ${retryAfter} seconds` : ' later'}`
        );
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Server Errors
        toast.error('Server error. Please try again');
        break;

      default:
        toast.error(data?.error || data?.message || 'Something went wrong');
    }
  } else if (error instanceof Error) {
    // Network error or other errors
    if (error.message === 'Network Error') {
      toast.error('Network error. Please check your connection');
    } else {
      toast.error(error.message || 'An unexpected error occurred');
    }
  } else {
    toast.error('An unexpected error occurred');
  }
};

// Success toast helper
export const showSuccess = (message: string): void => {
  toast.success(message);
};

// Info toast helper
export const showInfo = (message: string): void => {
  toast(message);
};

// Warning toast helper
export const showWarning = (message: string): void => {
  toast(message, {
    icon: '⚠️',
  });
};
