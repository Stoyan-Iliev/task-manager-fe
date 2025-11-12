// Login request/response
export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  profilePic?: string;
  roles?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
  tokenType?: string;
  expiresIn?: number;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

// User state for Redux
export interface User {
  id: number;
  username: string;
  email: string;
}
