import { NextResponse } from "next/server";
import { clearUserSessionCookie, readUserTokenFromRequest } from "@/lib/user-auth-http";
import { revokeUserSession } from "@/lib/user-auth";

export async function POST(request: Request) {
  revokeUserSession(readUserTokenFromRequest(request));
  await clearUserSessionCookie();
  return NextResponse.json({ ok: true });
}
