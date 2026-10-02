// Only documented backend routes and verbs may pass through the session proxy.
const routes: [RegExp, string[]][] = [
  [/^\/api\/auth\/(login|register|logout)$/, ["POST"]],
  [/^\/api\/auth\/me$/, ["GET"]],
  [/^\/api\/posts$/, ["GET", "POST"]],
  [/^\/api\/posts\/slug\/[^/]+$/, ["GET"]],
  [/^\/api\/posts\/\d+$/, ["PUT", "DELETE"]],
  [/^\/api\/posts\/\d+\/like$/, ["POST", "DELETE"]],
  [/^\/api\/posts\/\d+\/comments$/, ["GET", "POST"]],
  [/^\/api\/categories$/, ["GET", "POST"]],
  [/^\/api\/categories\/\d+$/, ["GET", "PUT", "DELETE"]],
  [/^\/api\/comments\/\d+$/, ["PUT", "DELETE"]],
];
export function proxyAllowed(path: string[], method: string) {
  if (
    path.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        /[/\\?#%]/.test(segment),
    )
  )
    return false;
  return routes.some(
    ([pattern, methods]) =>
      pattern.test("/" + path.join("/")) && methods.includes(method),
  );
}
export function safeReturnPath(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\x00-\x1f]/.test(value)
  )
    return "/";
  return value;
}

export function sameOrigin(origin: string | null, host: string | null) {
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.host === host &&
      url.origin === origin
    );
  } catch {
    return false;
  }
}
