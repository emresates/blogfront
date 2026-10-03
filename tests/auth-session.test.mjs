import { test } from "node:test";
import assert from "node:assert/strict";
import { createAuthSession } from "../lib/auth/session.ts";
import { ApiError } from "../lib/api/transport.ts";
const ok = (data) => ({ data, message: "OK", statusCode: 200 });
const me = {
  userId: "1",
  name: "Test",
  email: "test@example.invalid",
  role: "Admin",
};
const tick = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function harness(overrides = {}) {
  const calls = [];
  let expired = false;
  const send = async (path, options = {}) => {
    calls.push({ path, options });
    if (overrides[path]) return overrides[path](options);
    if (path === "/api/auth/login" || path === "/api/auth/register")
      return ok({ accessToken: "access-1" });
    if (path === "/api/auth/refresh") return ok({ accessToken: "access-2" });
    if (path === "/api/auth/logout") return ok(null);
    const bearer = new Headers(options.headers).get("Authorization");
    if (expired && bearer !== "Bearer access-2")
      throw new ApiError("Expired", 401);
    if (path === "/api/auth/me") return ok(me);
    return ok({ saved: true });
  };
  return {
    session: createAuthSession(send),
    calls,
    expire: () => {
      expired = true;
    },
    count: (path) => calls.filter((c) => c.path === path).length,
  };
}
test("login/register store only the access token and load /me with Bearer and credentials", async () => {
  for (const mode of ["login", "register"]) {
    const h = harness();
    if (mode === "login") await h.session.login("mail", "password");
    else await h.session.register("name", "mail", "password");
    assert.equal(h.session.getSnapshot().accessToken, "access-1");
    assert.deepEqual(h.session.getSnapshot().user, me);
    assert.equal(h.session.getSnapshot().loading, false);
    assert.equal("refreshToken" in h.session.getSnapshot(), false);
    const credentials = h.calls[0];
    assert.equal(credentials.options.credentials, "include");
    assert.equal("role" in JSON.parse(credentials.options.body), false);
    assert.equal(
      new Headers(h.calls[1].options.headers).get("Authorization"),
      "Bearer access-1",
    );
  }
});
test("Strict Mode initialization shares one refresh and one /me; a new runtime restores memory", async () => {
  const gate = deferred();
  const h = harness({ "/api/auth/refresh": () => gate.promise });
  const a = h.session.initialize();
  const b = h.session.initialize();
  assert.equal(a, b);
  assert.equal(h.count("/api/auth/refresh"), 1);
  assert.equal(h.session.getSnapshot().loading, true);
  assert.equal(h.calls[0].options.body, undefined);
  assert.equal(h.calls[0].options.credentials, "include");
  gate.resolve(ok({ accessToken: "restored" }));
  await Promise.all([a, b]);
  await h.session.initialize();
  assert.equal(h.count("/api/auth/me"), 1);
  assert.equal(h.session.getSnapshot().accessToken, "restored");
  assert.equal(h.session.getSnapshot().loading, false);
  const next = harness();
  assert.equal(next.session.getSnapshot().accessToken, null);
  await next.session.initialize();
  assert.equal(next.session.getSnapshot().accessToken, "access-2");
});
test("simultaneous 401s share refresh and retry their method/body exactly once", async () => {
  const gate = deferred();
  const h = harness({ "/api/auth/refresh": () => gate.promise });
  await h.session.login("mail", "pw");
  h.expire();
  const requests = [
    "/api/users/2/role",
    "/api/comments/1",
    "/api/posts/1/like",
  ].map((path) =>
    h.session.request(path, { method: "PATCH", body: '{"role":"Author"}' }),
  );
  await tick();
  assert.equal(h.count("/api/auth/refresh"), 1);
  gate.resolve(ok({ accessToken: "access-2" }));
  await Promise.all(requests);
  for (const path of [
    "/api/users/2/role",
    "/api/comments/1",
    "/api/posts/1/like",
  ]) {
    const calls = h.calls.filter((c) => c.path === path);
    assert.equal(calls.length, 2);
    assert.equal(calls[1].options.method, "PATCH");
    assert.equal(calls[1].options.body, '{"role":"Author"}');
    assert.equal(
      new Headers(calls[1].options.headers).get("Authorization"),
      "Bearer access-2",
    );
  }
});
test("a delayed stale-token 401 reuses the new token instead of rotating again", async () => {
  const delayed = deferred();
  let staleCall = true;
  const h = harness({
    "/slow": (options) => {
      if (staleCall) {
        staleCall = false;
        return delayed.promise;
      }
      return ok(new Headers(options.headers).get("Authorization"));
    },
  });
  await h.session.login("mail", "pw");
  h.expire();
  const slow = h.session.request("/slow");
  await h.session.request("/fast");
  delayed.reject(new ApiError("Expired", 401));
  assert.equal((await slow).data, "Bearer access-2");
  assert.equal(h.count("/api/auth/refresh"), 1);
});
test("revoked refresh clears once, does not retry or repeatedly refresh", async () => {
  const h = harness({
    "/api/auth/refresh": () => {
      throw new ApiError("Revoked", 401);
    },
  });
  const ends = [];
  h.session.onSessionEnd((event) => ends.push(event));
  await h.session.login("mail", "pw");
  h.expire();
  await Promise.allSettled([h.session.request("/a"), h.session.request("/b")]);
  await assert.rejects(h.session.request("/c"));
  assert.equal(h.count("/api/auth/refresh"), 1);
  assert.equal(h.count("/a"), 1);
  assert.equal(ends.length, 1);
  assert.equal(h.session.getSnapshot().user, null);
  assert.equal(h.session.getSnapshot().accessToken, null);
});
test("guest initialization failure is quiet and clears loading", async () => {
  const h = harness({
    "/api/auth/refresh": () => {
      throw new ApiError("No cookie", 401);
    },
  });
  let ends = 0;
  h.session.onSessionEnd(() => ends++);
  await h.session.initialize();
  assert.equal(ends, 0);
  assert.equal(h.session.getSnapshot().loading, false);
  assert.equal(h.count("/api/auth/me"), 0);
});
test("403 preserves session without refresh; disabled users end session with a message", async () => {
  const h = harness({
    "/forbidden": () => {
      throw new ApiError("Backend permission message", 403);
    },
    "/disabled": () => {
      throw new ApiError("Disabled", 403, "userDisabled");
    },
  });
  await h.session.login("mail", "pw");
  const ends = [];
  h.session.onSessionEnd((event) => ends.push(event));
  await assert.rejects(
    h.session.request("/forbidden"),
    /Backend permission message/,
  );
  assert.equal(h.count("/api/auth/refresh"), 0);
  assert.deepEqual(h.session.getSnapshot().user, me);
  await assert.rejects(h.session.request("/disabled"));
  assert.equal(h.session.getSnapshot().accessToken, null);
  assert.equal(ends[0].message, "Hesabınız devre dışı bırakılmış.");
  assert.equal(h.count("/api/auth/refresh"), 0);
});
test("disabled login and refresh clear state and notify without recursion", async () => {
  for (const path of ["/api/auth/login", "/api/auth/refresh"]) {
    const h = harness({
      [path]: () => {
        throw new ApiError("Disabled", 403, "userDisabled");
      },
    });
    const ends = [];
    h.session.onSessionEnd((event) => ends.push(event));
    if (path.endsWith("login"))
      await assert.rejects(h.session.login("mail", "pw"));
    else await h.session.initialize();
    assert.equal(ends.length, 1);
    assert.equal(h.session.getSnapshot().user, null);
    assert.equal(h.count(path), 1);
  }
});
test("auth endpoints and retry 401 cannot trigger an infinite refresh loop", async () => {
  for (const path of [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/auth/logout",
  ]) {
    const h = harness({
      [path]: () => {
        throw new ApiError("401", 401);
      },
    });
    await assert.rejects(h.session.request(path, { method: "POST" }));
    assert.equal(
      h.count("/api/auth/refresh"),
      path.endsWith("refresh") ? 1 : 0,
    );
  }
  const h = harness({
    "/always401": () => {
      throw new ApiError("Still expired", 401);
    },
  });
  await h.session.login("mail", "pw");
  await assert.rejects(h.session.request("/always401"));
  assert.equal(h.count("/always401"), 2);
  assert.equal(h.count("/api/auth/refresh"), 1);
  assert.equal(h.session.getSnapshot().accessToken, null);
});
test("logout always calls backend, clears local auth even on network failure", async () => {
  const h = harness({
    "/api/auth/logout": () => {
      throw new ApiError("Offline", 503);
    },
  });
  await h.session.login("mail", "pw");
  await assert.rejects(h.session.logout());
  assert.equal(h.count("/api/auth/logout"), 1);
  assert.deepEqual(h.session.getSnapshot(), {
    accessToken: null,
    user: null,
    loading: false,
  });
  assert.equal(h.calls.at(-1).options.credentials, "include");
  assert.equal(h.count("/api/auth/refresh"), 0);
});
test(
  "logout drains rotation before revoking and a late refresh cannot restore state",
  { timeout: 2000 },
  async () => {
    const gate = deferred();
    const h = harness({ "/api/auth/refresh": () => gate.promise });
    await h.session.login("mail", "pw");
    const refreshing = h.session.refreshAccessToken();
    const rejected = assert.rejects(refreshing);
    const logout = h.session.logout();
    assert.equal(h.session.getSnapshot().accessToken, null);
    assert.equal(h.count("/api/auth/logout"), 0);
    gate.resolve(ok({ accessToken: "late" }));
    await Promise.all([rejected, logout]);
    assert.equal(h.count("/api/auth/logout"), 1);
    assert.equal(h.session.getSnapshot().accessToken, null);
  },
);
test(
  "logout during initialization and queued login does not deadlock or recreate session",
  { timeout: 2000 },
  async () => {
    const gate = deferred();
    const h = harness({ "/api/auth/refresh": () => gate.promise });
    const init = h.session.initialize();
    const login = h.session.login("mail", "pw");
    const rejected = assert.rejects(login);
    const logout = h.session.logout();
    gate.resolve(ok({ accessToken: "late" }));
    await Promise.all([init, rejected, logout]);
    assert.equal(h.count("/api/auth/login"), 0);
    assert.equal(h.count("/api/auth/logout"), 1);
    assert.equal(h.session.getSnapshot().accessToken, null);
  },
);
