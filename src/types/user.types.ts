export interface UserProfileResponse {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  jobTitle?: string;
  department?: string;
  phone?: string;
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  bio?: string;
  enabled: boolean;
  locked: boolean;
  tsCreated: string;
  tsUpdated: string;
}

export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  bio?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AvatarUploadResponse {
  avatarUrl: string;
}
