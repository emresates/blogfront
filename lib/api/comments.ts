import { api, body } from "./client";
import type { Comment } from "@/types";
export const commentsApi = {
  list: (id: number) => api<Comment[]>(`/api/posts/${id}/comments`),
  create: (id: number, content: string) =>
    api<Comment>(`/api/posts/${id}/comments`, {
      method: "POST",
      body: body({ content }),
    }),
  update: (id: number, content: string) =>
    api<Comment>(`/api/comments/${id}`, {
      method: "PUT",
      body: body({ content }),
    }),
  remove: (id: number) =>
    api<null>(`/api/comments/${id}`, { method: "DELETE" }),
};
