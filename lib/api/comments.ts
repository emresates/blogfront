import { api, body } from "./client";
import { normalizeComments } from "../utils/comments";
import type { Comment } from "@/types";
export const commentsApi = {
  list: async (id: number) => {
    const response = await api<unknown>(`/api/posts/${id}/comments`);
    return { ...response, data: normalizeComments(response.data) };
  },
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

export const createCommentReply = (commentId: number, content: string) =>
  api<Comment>(`/api/comments/${commentId}/replies`, {
    method: "POST",
    body: body({ content }),
  });
