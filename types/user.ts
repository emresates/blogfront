import type { Role } from "./index";
export type UserRole = Role;
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}
export interface UserListParams {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}
export interface ChangeRoleRequest {
  role: UserRole;
}
export interface ChangeStatusRequest {
  isActive: boolean;
}
