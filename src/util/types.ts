export type User = {
  username: string;
  email: string;
  profilePic?: string;
  token: string;
}

export type AuthResponse = {
  username: string;
  email: string;
  token: string;
}