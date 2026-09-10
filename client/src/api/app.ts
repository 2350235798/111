import axios from 'axios';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserProfile,
  CreatePostRequest,
  PostItem,
  PostListResponse,
  CreateCommentRequest,
  CommentListResponse,
  UpdateProfileRequest,
  AdminStats,
  AdminUserListResponse,
  ApiResponse,
} from '@shared/api.interface';

const TOKEN_KEY = 'jidian_campus_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const http = axios.create({
  baseURL: '/',
  timeout: 15000,
});

async function request<T>(config: {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  params?: Record<string, unknown>;
}): Promise<T> {
  const response = await http.request({
    url: config.url,
    method: config.method,
    data: config.data,
    params: config.params,
    headers: authHeaders(),
  });
  const result = response.data as ApiResponse<T>;
  if (result.code !== 0) {
    throw new Error(result.message || '请求失败');
  }
  return result.data;
}

export const authApi = {
  login: (data: LoginRequest) =>
    request<AuthResponse>({ url: '/api/auth/login', method: 'POST', data }),
  register: (data: RegisterRequest) =>
    request<AuthResponse>({ url: '/api/auth/register', method: 'POST', data }),
  getMe: () =>
    request<{ user: UserProfile }>({ url: '/api/auth/me', method: 'GET' }),
};

export const postsApi = {
  getList: (page = 1, pageSize = 10) =>
    request<PostListResponse>({
      url: '/api/posts',
      method: 'GET',
      params: { page, pageSize },
    }),
  getDetail: (id: string) =>
    request<{ post: PostItem }>({ url: `/api/posts/${id}`, method: 'GET' }),
  create: (data: CreatePostRequest) =>
    request<{ post: PostItem }>({ url: '/api/posts', method: 'POST', data }),
  remove: (id: string) =>
    request<{ success: boolean }>({ url: `/api/posts/${id}`, method: 'DELETE' }),
  share: (id: string) =>
    request<{ shareCount: number }>({ url: `/api/posts/${id}/share`, method: 'POST' }),
};

export const commentsApi = {
  getList: (postId: string) =>
    request<CommentListResponse>({
      url: `/api/comments/post/${postId}`,
      method: 'GET',
    }),
  create: (postId: string, data: CreateCommentRequest) =>
    request<{ comment: CommentItem }>({
      url: `/api/comments/post/${postId}`,
      method: 'POST',
      data,
    }),
  remove: (id: string) =>
    request<{ success: boolean }>({ url: `/api/comments/${id}`, method: 'DELETE' }),
};

export const likesApi = {
  toggle: (postId: string) =>
    request<{ liked: boolean; likeCount: number }>({
      url: `/api/likes/post/${postId}/toggle`,
      method: 'POST',
    }),
  getStatus: (postId: string) =>
    request<{ liked: boolean; likeCount: number }>({
      url: `/api/likes/post/${postId}/status`,
      method: 'GET',
    }),
};

export const usersApi = {
  getById: (id: string) =>
    request<{ user: UserProfile }>({ url: `/api/users/${id}`, method: 'GET' }),
  getProfile: () =>
    request<{ user: UserProfile }>({ url: '/api/users/me/profile', method: 'GET' }),
  updateProfile: (data: UpdateProfileRequest) =>
    request<{ user: UserProfile }>({
      url: '/api/users/me/profile',
      method: 'PATCH',
      data,
    }),
};

export const adminApi = {
  getStats: () =>
    request<AdminStats>({ url: '/api/admin/stats', method: 'GET' }),
  getUsers: (page = 1, pageSize = 20, keyword?: string) =>
    request<AdminUserListResponse>({
      url: '/api/admin/users',
      method: 'GET',
      params: { page, pageSize, keyword },
    }),
  banUser: (id: string, banned: boolean) =>
    request<{ user: UserProfile }>({
      url: `/api/admin/users/${id}/ban`,
      method: 'POST',
      data: { banned },
    }),
  getPosts: (page = 1, pageSize = 20) =>
    request<PostListResponse>({
      url: '/api/admin/posts',
      method: 'GET',
      params: { page, pageSize },
    }),
  deletePost: (id: string) =>
    request<{ success: boolean }>({
      url: `/api/admin/posts/${id}`,
      method: 'DELETE',
    }),
  setVisibility: (id: string, visible: boolean) =>
    request<{ post: PostItem }>({
      url: `/api/admin/posts/${id}/visibility`,
      method: 'PATCH',
      data: { visible },
    }),
};

export const uploadApi = {
  image: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const response = await axios.post('/api/upload/image', formData, {
      baseURL: '/',
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const result = response.data as { code: number; data: { url: string }; message?: string };
    if (result.code !== 0) {
      throw new Error(result.message || '上传失败');
    }
    return result.data.url;
  },
};

export type CommentItem = import('@shared/api.interface').CommentItem;
