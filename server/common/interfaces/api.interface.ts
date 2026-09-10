export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface UserProfile {
  id: string;
  phone: string;
  nickname: string;
  avatarUrl: string | null;
  bio: string;
  isAdmin: boolean;
  isBanned: boolean;
  nicknameUpdatedAt: string | null;
  createdAt: string;
}

export interface PostItem {
  id: string;
  authorId: string;
  author: UserProfile;
  content: string;
  imageUrls: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isVisible: boolean;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentItem {
  id: string;
  postId: string;
  authorId: string;
  author: UserProfile;
  content: string;
  likeCount: number;
  createdAt: string;
}

export interface PostListResponse {
  items: PostItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CommentListResponse {
  items: CommentItem[];
  total: number;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface CreatePostRequest {
  content: string;
  imageUrls: string[];
}

export interface CreateCommentRequest {
  content: string;
}

export interface ModerationResult {
  passed: boolean;
  blockedWords: string[];
}

export interface UpdateProfileRequest {
  nickname?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  todayPosts: number;
  todayUsers: number;
  bannedUsers: number;
}

export interface AdminUserListResponse {
  items: UserProfile[];
  total: number;
  page: number;
  pageSize: number;
}
