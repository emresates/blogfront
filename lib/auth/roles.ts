import type { Role } from "@/types";
export const isAdmin = (role?: Role) =>
  role === "Admin" || role === "SuperAdmin";
export const canWrite = (role?: Role) => role === "Author" || isAdmin(role);
