// Pagination types
export interface PageResponse<T> {
  content: T[];
  number: number;       // Page number (0-indexed)
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

// API Response wrapper (if backend uses consistent wrapper)
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Common entity fields
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// User summary (lightweight user info)
export interface UserSummary {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}
