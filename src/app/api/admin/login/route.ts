import { NextResponse } from "next/server";
import {
  createAdminSession,
  isAdminPassword,
  setAdminSessionCookie,
} from "@/lib/admin-auth";
import { clientIp, failCooldownPeek, markFail, rateLimitPeek, rateLimitRecord } from "@/lib/rate-limit";
import { logWarn } from "@/lib/log";
import { requireJson } from "@/lib/http-guard";

export async function POST(request: Request) {
  const badCt = requireJson(request);
  if (badCt) return badCt;

  const ip = clientIp(request);
  const okKey = `admin-login:ok:${ip}`;
  const failKey = `admin-login:fail:${ip}`;

  const failPeek = failCooldownPeek(failKey, 3_000);
  if (!failPeek.ok) {
    return NextResponse.json(
      { error: `尝试过于频繁，请 ${failPeek.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }
  const burst = rateLimitPeek(okKey, 5, 15 * 60 * 1000);
  if (!burst.ok) {
    return NextResponse.json(
      { error: `尝试过于频繁，请 ${burst.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    markFail(failKey);
    return NextResponse.json({ error: "无效请求体" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!isAdminPassword(token)) {
    markFail(failKey);
    logWarn("admin_login_failed", { ip });
    return NextResponse.json({ error: "口令错误" }, { status: 401 });
  }

  const session = createAdminSession();
  await setAdminSessionCookie(session);
  rateLimitRecord(okKey);
  return NextResponse.json({ ok: true });
}
