import { normalizeKeys } from "../lib/api/normalize.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  proxyAllowed,
  safeReturnPath,
  sameOrigin,
} from "../lib/api/proxy-policy.ts";
import { isAdmin, canWrite } from "../lib/auth/roles.ts";
test("proxy forwards only supported endpoint and method combinations", () => {
  assert.equal(proxyAllowed(["api", "posts", "12", "comments"], "POST"), true);
  assert.equal(proxyAllowed(["api", "auth", "logout"], "GET"), false);
  assert.equal(proxyAllowed(["api", "users", "change-role"], "POST"), false);
  assert.equal(proxyAllowed(["api", "posts", "12"], "GET"), false);
  assert.equal(proxyAllowed(["api", "comments"], "GET"), false);
  for (const segment of ["..", "%2e%2e", "x/y", "x?y", "x\\y"])
    assert.equal(proxyAllowed(["api", "posts", "slug", segment], "GET"), false);
});
test("return paths cannot redirect to another origin", () => {
  assert.equal(
    safeReturnPath("/dashboard/posts?page=2"),
    "/dashboard/posts?page=2",
  );
  for (const value of [
    null,
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/\n/example.com",
  ])
    assert.equal(safeReturnPath(value), "/");
});
test("role capabilities keep regular users and authors out of administration", () => {
  assert.equal(isAdmin("User"), false);
  assert.equal(isAdmin("Author"), false);
  assert.equal(isAdmin("Admin"), true);
  assert.equal(isAdmin("SuperAdmin"), true);
  assert.equal(canWrite("User"), false);
  assert.equal(canWrite("Author"), true);
  assert.equal(canWrite(undefined), false);
});

test("origin validation supports loopback hosts while rejecting cross-site requests", () => {
  assert.equal(sameOrigin("http://127.0.0.1:3000", "127.0.0.1:3000"), true);
  assert.equal(sameOrigin("https://blog.example", "blog.example"), true);
  assert.equal(sameOrigin("https://evil.example", "blog.example"), false);
  assert.equal(sameOrigin(null, "blog.example"), false);
  assert.equal(sameOrigin("null", "blog.example"), false);
});

test("ASP.NET PascalCase error wrappers normalize without changing content", () => {
  assert.deepEqual(
    normalizeKeys({
      Data: null,
      Message: "Email veya şifre hatalı.",
      ErrCode: "invalidCredentials",
      StatusCode: 401,
    }),
    {
      data: null,
      message: "Email veya şifre hatalı.",
      errCode: "invalidCredentials",
      statusCode: 401,
    },
  );
  assert.deepEqual(
    normalizeKeys({
      Data: [
        {
          Title: "HTML <script> untouched",
          Categories: [{ Id: 1, Name: "C#" }],
        },
      ],
    }),
    {
      data: [
        {
          title: "HTML <script> untouched",
          categories: [{ id: 1, name: "C#" }],
        },
      ],
    },
  );
});
