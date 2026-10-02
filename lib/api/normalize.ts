// ASP.NET success and exception middleware may use different naming policies.
// Normalize property names only; article/comment strings remain untouched.
export function normalizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key.charAt(0).toLowerCase() + key.slice(1),
        normalizeKeys(item),
      ]),
    );
  }
  return value;
}
