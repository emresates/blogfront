import { api, body } from "./client";
import type { Category } from "@/types";
export const categoriesApi = {
  list: () => api<Category[]>("/api/categories"),
  create: (name: string) =>
    api<Category>("/api/categories", { method: "POST", body: body({ name }) }),
  update: (id: number, name: string) =>
    api<Category>(`/api/categories/${id}`, {
      method: "PUT",
      body: body({ name }),
    }),
  remove: (id: number) =>
    api<null>(`/api/categories/${id}`, { method: "DELETE" }),
};
