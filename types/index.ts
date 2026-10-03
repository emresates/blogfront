import type { JSONContent } from "@tiptap/react";
export type Role = "User" | "Author" | "Admin" | "SuperAdmin";
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  errCode?: string;
  pagination?: PaginationMeta;
}
export type PagedResponse<T> = ApiResponse<T[]>;
export interface Category {
  id: number;
  name: string;
}
export interface Post {
  id: number;
  title: string;
  slug: string;
  content: JSONContent;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt?: string | null;
  userId: number;
  authorName: string;
  categories: Category[];
}
export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
  userId: number;
  userName: string;
  postId: number;
  parentCommentId?: number | null;
  replies: Comment[];
}
export interface CurrentUser {
  userId: string;
  name: string;
  email: string;
  role: Role;
}
export interface AuthResponseData {
  accessToken: string;
}
export interface CreatePostRequest {
  title: string;
  content: JSONContent;
  categoryIds: number[];
}

export type UpdatePostRequest = CreatePostRequest;
export type PostInput = CreatePostRequest;

export type AuthResponse = AuthResponseData;
export type RefreshResponse = AuthResponseData;
