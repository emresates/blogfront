import type { Comment, CurrentUser } from "../../types/index";
// Normalize only comment responses; malformed/missing children become an empty list.
export function normalizeComments(value: unknown): Comment[] {
  const seen = new Set<unknown>();
  function walk(value: unknown): Comment[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item: unknown) => {
      if (!item || typeof item !== "object" || seen.has(item)) return [];
      seen.add(item);
      const row = item as Record<string, unknown>;
      if (
        typeof row.id !== "number" ||
        typeof row.content !== "string" ||
        typeof row.createdAt !== "string"
      )
        return [];
      return [
        {
          id: row.id,
          content: row.content,
          createdAt: row.createdAt,
          updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : null,
          userId: Number(row.userId),
          userName: typeof row.userName === "string" ? row.userName : "",
          postId: Number(row.postId),
          parentCommentId:
            typeof row.parentCommentId === "number"
              ? row.parentCommentId
              : null,
          replies: walk(row.replies),
        },
      ];
    });
  }
  return walk(value);
}
export const canManageComment = (user: CurrentUser | null, comment: Comment) =>
  !!user &&
  (String(user.userId) === String(comment.userId) ||
    user.role === "Admin" ||
    user.role === "SuperAdmin");
export function removeComment(tree: Comment[], id: number): Comment[] {
  return tree
    .filter((c) => c.id !== id)
    .map((c) => ({ ...c, replies: removeComment(c.replies, id) }));
}
export function countComments(tree: Comment[]): number {
  return tree.reduce((count, c) => count + 1 + countComments(c.replies), 0);
}
