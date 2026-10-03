import type { UserListParams, UserRole } from "../../types/user";
const roles: UserRole[] = ["User", "Author", "Admin", "SuperAdmin"];
export function readUserQuery(query: URLSearchParams): UserListParams {
  const page = Number(query.get("page"));
  const size = Number(query.get("pageSize"));
  const role = query.get("role") as UserRole;
  const status = query.get("status");
  return {
    search: query.get("search")?.trim() || undefined,
    role: roles.includes(role) ? role : undefined,
    isActive:
      status === "active" ? true : status === "disabled" ? false : undefined,
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: [10, 20, 50, 100].includes(size) ? size : 20,
  };
}
export function userQueryString(params: UserListParams): string {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: String(Math.min(100, Math.max(1, params.pageSize ?? 20))),
  });
  if (params.search) query.set("search", params.search);
  if (params.role) query.set("role", params.role);
  if (params.isActive !== undefined)
    query.set("isActive", String(params.isActive));
  return query.toString();
}
