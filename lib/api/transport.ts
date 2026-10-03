import { normalizeKeys } from "./normalize.ts";
import type { ApiResponse } from "../../types/index";

export class ApiError extends Error {
  status: number;
  errCode?: string;
  constructor(message: string, status: number, errCode?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errCode = errCode;
  }
}
export type ApiTransport = <T>(
  path: string,
  options?: RequestInit,
) => Promise<ApiResponse<T>>;

// No session state or retry here: safe for public Server Component requests too.
export const transport: ApiTransport = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new ApiError("API adresi yapılandırılmamış.", 500);
  const headers = new Headers(options.headers);
  if (
    options.body !== undefined &&
    options.body !== null &&
    !headers.has("Content-Type")
  )
    headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${base.replace(/\/$/, "")}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError("Sunucuya ulaşılamadı. Lütfen tekrar deneyin.", 503);
  }
  if (response.status === 204)
    return { data: null as T, message: "", statusCode: 204 };
  const raw: unknown = await response.json().catch(() => null);
  const normalized = normalizeKeys(raw);
  const payload = normalized as Partial<ApiResponse<T>> | null;
  if (!response.ok || (payload?.statusCode ?? 0) >= 400) {
    const status = response.ok
      ? (payload?.statusCode ?? response.status)
      : response.status;
    throw new ApiError(
      payload?.message ||
        (status === 403
          ? "Bu işlem için yetkiniz yok."
          : "İşlem tamamlanamadı."),
      status,
      payload?.errCode,
    );
  }
  return payload && typeof payload === "object" && "data" in payload
    ? (payload as ApiResponse<T>)
    : { data: normalized as T, message: "", statusCode: response.status };
};
