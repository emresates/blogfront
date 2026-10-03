import type { ApiResponse } from "@/types";
import { transport } from "./transport";
import { createAuthSession } from "../auth/session";
export { ApiError } from "./transport";
let browserSession: ReturnType<typeof createAuthSession> | undefined;
export function getAuthSession() {
  if (typeof window === "undefined")
    throw new Error("Auth session is browser-only.");
  return (browserSession ??= createAuthSession(transport));
}
export function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  return typeof window === "undefined"
    ? transport<T>(path, options)
    : getAuthSession().request<T>(path, options);
}
export const body = (value: unknown) => JSON.stringify(value);
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
