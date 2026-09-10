export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  nickname?: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface UpdateProfileRequest {
  nickname?: string;
  avatar?: string;
}

export interface ModerationResult {
  approved: boolean;
  reason?: string;
  flaggedCategories?: string[];
}
