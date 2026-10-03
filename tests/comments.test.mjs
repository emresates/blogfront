import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeComments,
  countComments,
  removeComment,
  canManageComment,
} from "../lib/utils/comments.ts";
const node = (id, replies = []) => ({
  id,
  content: `Comment ${id}`,
  createdAt: "2026-10-03T12:00:00Z",
  userId: 3,
  userName: "User",
  postId: 1,
  parentCommentId: null,
  replies,
});
test("comment adapter preserves reply-to-reply trees and counts all nodes", () => {
  const tree = normalizeComments([node(1, [node(2, [node(3)])]), node(4)]);
  assert.equal(tree[0].replies[0].replies[0].id, 3);
  assert.equal(countComments(tree), 4);
});
test("missing and malformed replies fall back to empty arrays", () => {
  for (const replies of [undefined, null, {}, "invalid", [null, {}, "bad"]])
    assert.deepEqual(normalizeComments([node(1, replies)])[0].replies, []);
  assert.deepEqual(normalizeComments(null), []);
  const cyclic = node(1);
  cyclic.replies.push(cyclic);
  assert.deepEqual(normalizeComments([cyclic])[0].replies, []);
});
test("deleting a nested reply removes only its subtree and preserves the original tree", () => {
  const tree = normalizeComments([
    node(1, [node(2, [node(3)]), node(4)]),
    node(5),
  ]);
  const result = removeComment(tree, 2);
  assert.equal(countComments(result), 3);
  assert.deepEqual(
    result[0].replies.map((c) => c.id),
    [4],
  );
  assert.equal(countComments(tree), 5);
  assert.deepEqual(
    removeComment(tree, 1).map((c) => c.id),
    [5],
  );
});
test("guest/owner/author/admin permissions apply equally to replies", () => {
  const reply = node(2);
  assert.equal(canManageComment(null, reply), false);
  for (const role of ["User", "Author"]) {
    assert.equal(canManageComment({ userId: "3", role }, reply), true);
    assert.equal(canManageComment({ userId: "4", role }, reply), false);
  }
  for (const role of ["Admin", "SuperAdmin"])
    assert.equal(canManageComment({ userId: "4", role }, reply), true);
});
