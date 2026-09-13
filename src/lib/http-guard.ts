import { NextResponse } from "next/server";

/** Reject non-JSON write bodies (CSRF: HTML form cannot send application/json easily). */
export function requireJson(request: Request): NextResponse | null {
  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return NextResponse.json(
      { error: "请使用 application/json 提交" },
      { status: 415 },
    );
  }
  return null;
}

/** Same-origin check for unsafe methods when Origin is present. */
export function sameOriginOk(request: Request): boolean {
  if (request.method === "GET" || request.method === "HEAD") return true;
  const origin = request.headers.get("origin");
  if (!origin) return true; // some clients omit; Content-Type check is primary
  try {
    const host = request.headers.get("host");
    if (!host) return true;
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
