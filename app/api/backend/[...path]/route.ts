import { normalizeKeys } from "@/lib/api/normalize";
import type { ApiResponse, AuthResponse } from "@/types";
import { proxyAllowed, sameOrigin } from "@/lib/api/proxy-policy";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
const COOKIE = "margin_session";
async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const route = "/" + path.join("/");
  if (!proxyAllowed(path, req.method))
    return NextResponse.json(
      { message: "Endpoint bulunamadı." },
      { status: 404 },
    );
  if (
    !["GET", "HEAD"].includes(req.method) &&
    !sameOrigin(req.headers.get("origin"), req.headers.get("host"))
  )
    return NextResponse.json({ message: "Geçersiz kaynak." }, { status: 403 });
  const jar = await cookies();
  if (route === "/api/auth/logout") {
    jar.delete(COOKIE);
    return NextResponse.json({ data: null, statusCode: 200 });
  }
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base)
    return NextResponse.json(
      { message: "API yapılandırması eksik." },
      { status: 500 },
    );
  try {
    const token = jar.get(COOKIE)?.value;
    const upstream = await fetch(
      `${base}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`,
      {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: ["GET", "HEAD"].includes(req.method)
          ? undefined
          : await req.text(),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
    const payload = normalizeKeys(
      await upstream.json().catch(() => null),
    ) as ApiResponse<AuthResponse> | null;
    if (
      upstream.ok &&
      (route === "/api/auth/login" || route === "/api/auth/register")
    ) {
      const accessToken = payload?.data?.accessToken;
      if (!accessToken)
        return NextResponse.json(
          { message: "Sunucu geçerli oturum bilgisi döndürmedi." },
          { status: 502 },
        );
      jar.set(COOKIE, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      return NextResponse.json({ ...payload, data: null });
    }
    if (upstream.status === 401) jar.delete(COOKIE);
    return upstream.status === 204
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json(
          payload ?? { message: "Sunucudan geçersiz yanıt alındı." },
          { status: upstream.status },
        );
  } catch {
    return NextResponse.json(
      { message: "Sunucuya ulaşılamadı. Lütfen tekrar deneyin." },
      { status: 503 },
    );
  }
}
export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
