import { api, body } from "./client";
import type { CurrentUser } from "@/types";
export const authApi = {
  me: () => api<CurrentUser>("/api/auth/me"),
  login: (email: string, password: string) =>
    api<null>("/api/auth/login", {
      method: "POST",
      body: body({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    api<null>("/api/auth/register", {
      method: "POST",
      body: body({ name, email, password }),
    }),
  logout: () => api<null>("/api/auth/logout", { method: "POST" }),
};
