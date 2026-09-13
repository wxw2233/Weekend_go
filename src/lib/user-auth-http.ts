import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  USER_COOKIE,
  getUserBySession,
  type PublicUser,
} from "@/lib/user-auth";
import { sessionCookieOptions } from "@/lib/cookie-options";

export async function setUserSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(USER_COOKIE, token, sessionCookieOptions(7 * 24 * 3600));
}

export async function clearUserSessionCookie() {
  const jar = await cookies();
  jar.set(USER_COOKIE, "", sessionCookieOptions(0));
}

export function readUserTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${USER_COOKIE}=([^;]+)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getRequestUser(
  request: Request,
): Promise<PublicUser | null> {
  return getUserBySession(readUserTokenFromRequest(request));
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  return getUserBySession(jar.get(USER_COOKIE)?.value);
}

export function userUnauthorized() {
  return NextResponse.json({ error: "请先登录" }, { status: 401 });
}

export { USER_COOKIE };
