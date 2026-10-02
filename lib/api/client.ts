import { normalizeKeys } from "./normalize";
import type { ApiResponse } from "@/types";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errCode?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const base =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_API_URL
      : "/api/backend";
  if (!base) throw new ApiError("API adresi yapılandırılmamış.", 500);
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...options.headers },
      signal: options.signal ?? AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError("Sunucuya ulaşılamadı. Lütfen tekrar deneyin.", 503);
  }
  const raw = await response.json().catch(() => null);
  const payload = normalizeKeys(raw) as ApiResponse<T> | null;
  if (!response.ok || (payload?.statusCode ?? 0) >= 400) {
    const status = payload?.statusCode || response.status;
    if (
      status === 401 &&
      typeof window !== "undefined" &&
      !path.startsWith("/api/auth/")
    )
      window.dispatchEvent(new Event("auth-expired"));
    throw new ApiError(
      payload?.message ||
        (status === 403
          ? "Bu işlem için yetkiniz yok."
          : "İşlem tamamlanamadı."),
      status,
      payload?.errCode,
    );
  }
  if (response.status === 204)
    return { data: null as T, message: "", statusCode: 204 };
  return payload && typeof payload === "object" && "data" in payload
    ? payload
    : {
        data: normalizeKeys(raw) as T,
        message: "",
        statusCode: response.status,
      };
}
export const body = (value: unknown) => JSON.stringify(value);
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
