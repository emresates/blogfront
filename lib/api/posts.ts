import { api, body, ApiError } from "./client";
import type { Post, CreatePostRequest, UpdatePostRequest } from "@/types";
export const postsApi = {
  list: (query = "") => api<Post[]>(`/api/posts${query ? `?${query}` : ""}`),
  bySlug: (slug: string) =>
    api<Post>(`/api/posts/slug/${encodeURIComponent(slug)}`),
  create: (input: CreatePostRequest) =>
    api<Post>("/api/posts", { method: "POST", body: body(input) }),
  update: (id: number, input: UpdatePostRequest) =>
    api<Post>(`/api/posts/${id}`, { method: "PUT", body: body(input) }),
  remove: (id: number) => api<null>(`/api/posts/${id}`, { method: "DELETE" }),
  like: (id: number, remove = false) =>
    api<null>(`/api/posts/${id}/like`, { method: remove ? "DELETE" : "POST" }),
};
// No undocumented GET-by-id or author-filter endpoint is assumed.
export async function allPosts() {
  const result: Post[] = [];
  let page = 1;
  while (true) {
    const res = await postsApi.list(`page=${page}&pageSize=100`);
    result.push(...res.data);
    if (!res.pagination || page >= res.pagination.totalPages) return result;
    if (page >= 1000)
      throw new ApiError(
        "Çok fazla kayıt var; sunucu taraflı yazar filtresi gerekiyor.",
        422,
      );
    page++;
  }
}
