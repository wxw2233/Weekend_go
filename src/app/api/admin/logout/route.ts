import { NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  readAdminTokenFromRequest,
  revokeAdminSession,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const token = await readAdminTokenFromRequest(request);
  revokeAdminSession(token);
  await clearAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
