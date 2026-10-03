import { api, body } from "./client";
import { userQueryString } from "./user-query";
import type {
  AdminUser,
  UserListParams,
  UserRole,
  ChangeRoleRequest,
  ChangeStatusRequest,
} from "@/types/user";
export const getUsers = (params: UserListParams = {}, signal?: AbortSignal) =>
  api<AdminUser[]>(`/api/users?${userQueryString(params)}`, { signal });
export const getUserById = (id: number, signal?: AbortSignal) =>
  api<AdminUser>(`/api/users/${id}`, { signal });
export const changeUserRole = (id: number, role: UserRole) =>
  api<AdminUser | null>(`/api/users/${id}/role`, {
    method: "PATCH",
    body: body({ role } satisfies ChangeRoleRequest),
  });
export const changeUserStatus = (id: number, isActive: boolean) =>
  api<AdminUser | null>(`/api/users/${id}/status`, {
    method: "PATCH",
    body: body({ isActive } satisfies ChangeStatusRequest),
  });
