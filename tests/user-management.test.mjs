import { test } from "node:test";
import assert from "node:assert/strict";
import {
  managementReason,
  assignableRoles,
  userRoles,
} from "../lib/auth/user-management.ts";
import { readUserQuery, userQueryString } from "../lib/api/user-query.ts";
const actor = (role) => ({
  userId: "1",
  name: "Actor",
  email: "actor@example.invalid",
  role,
});
const target = (role, id = 2) => ({
  id,
  name: "Target",
  email: "target@example.invalid",
  role,
  isActive: true,
  createdAt: "2026-10-03T00:00:00Z",
});
test("management permissions cover all actor and target roles and self management", () => {
  for (const role of userRoles) {
    assert.ok(managementReason(actor(role), target(role, 1)));
    for (const targetRole of userRoles) {
      const allowed =
        role === "SuperAdmin" ||
        (role === "Admin" && ["User", "Author"].includes(targetRole));
      assert.equal(
        managementReason(actor(role), target(targetRole)) === null,
        allowed,
      );
    }
  }
  assert.ok(managementReason(null, target("User")));
  assert.deepEqual(assignableRoles(actor("Admin")), ["User", "Author"]);
  assert.deepEqual(assignableRoles(actor("SuperAdmin")), userRoles);
  assert.deepEqual(assignableRoles(actor("Author")), []);
});
test("URL status maps to isActive and false is never dropped", () => {
  const query = readUserQuery(
    new URLSearchParams(
      "search=emre&role=Author&status=disabled&page=2&pageSize=50",
    ),
  );
  assert.deepEqual(query, {
    search: "emre",
    role: "Author",
    isActive: false,
    page: 2,
    pageSize: 50,
  });
  assert.equal(
    new URLSearchParams(userQueryString(query)).get("isActive"),
    "false",
  );
  assert.equal(
    new URLSearchParams(
      userQueryString(readUserQuery(new URLSearchParams())),
    ).has("isActive"),
    false,
  );
  assert.equal(
    readUserQuery(new URLSearchParams("status=active")).isActive,
    true,
  );
  assert.equal(
    readUserQuery(new URLSearchParams("page=-1&pageSize=1000&role=Root")).page,
    1,
  );
  assert.equal(
    readUserQuery(new URLSearchParams("pageSize=1000")).pageSize,
    20,
  );
  assert.equal(
    new URLSearchParams(userQueryString({ pageSize: 500 })).get("pageSize"),
    "100",
  );
});
