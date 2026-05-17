export interface UserResponse {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  user: UserResponse;
}
