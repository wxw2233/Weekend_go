import { NextResponse, type NextRequest } from "next/server";

const MAX_BODY = 64 * 1024;

export function middleware(request: NextRequest) {
  const res = NextResponse.next();

  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=15552000; includeSubDomains",
    );
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    res.headers.set("Cache-Control", "no-store");
    const cl = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(cl) && cl > MAX_BODY) {
      return NextResponse.json({ error: "请求过大" }, { status: 413 });
    }
    const method = request.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      const origin = request.headers.get("origin");
      if (origin) {
        try {
          const host = request.headers.get("host");
          if (host && new URL(origin).host !== host) {
            return NextResponse.json({ error: "跨站请求被拒绝" }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: "跨站请求被拒绝" }, { status: 403 });
        }
      }
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
