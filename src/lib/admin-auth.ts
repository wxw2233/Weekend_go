import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createAdminSession,
  isAdminPassword,
  revokeAdminSession,
  validateAdminSession,
} from "@/lib/db";
import { USER_COOKIE, getUserBySession } from "@/lib/user-auth";
import { sessionCookieOptions } from "@/lib/cookie-options";

export const ADMIN_COOKIE = "sx_admin_session";

export async function readAdminTokenFromRequest(
  request: Request,
): Promise<string | null> {
  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Admin access:
 * - valid admin session cookie/bearer
 * - OR logged-in user with role=admin
 * Password is only accepted at /api/admin/login, not as a live session token.
 */
export async function isRequestAdmin(request: Request): Promise<boolean> {
  const token = await readAdminTokenFromRequest(request);
  if (token && validateAdminSession(token)) return true;

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${USER_COOKIE}=([^;]+)`),
  );
  if (match) {
    const user = getUserBySession(decodeURIComponent(match[1]));
    return user?.role === "admin";
  }
  return false;
}

export async function setAdminSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, sessionCookieOptions(12 * 3600));
}

export async function clearAdminSessionCookie() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, "", sessionCookieOptions(0));
}

export function adminUnauthorized() {
  return NextResponse.json({ error: "未授权" }, { status: 401 });
}

export { createAdminSession, revokeAdminSession, isAdminPassword };
