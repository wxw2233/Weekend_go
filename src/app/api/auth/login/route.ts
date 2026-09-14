import { NextResponse } from "next/server";
import { setUserSessionCookie } from "@/lib/user-auth-http";
import { clientIp, failCooldownPeek, markFail, rateLimitPeek, rateLimitRecord } from "@/lib/rate-limit";
import { createUserSession, revokeUserSessions, verifyPassword } from "@/lib/user-auth";
import { logWarn } from "@/lib/log";
import { requireJson } from "@/lib/http-guard";
import { verifyCaptcha } from "@/lib/captcha";

export async function POST(request: Request) {
  const badCt = requireJson(request);
  if (badCt) return badCt;

  const ip = clientIp(request);
  // counts every credential attempt, success or failure
  const tryKey = `login:try:${ip}`;
  const failKey = `login:fail:${ip}`;

  const failPeek = failCooldownPeek(failKey, 2_000);
  if (!failPeek.ok) {
    return NextResponse.json(
      { error: `操作过于频繁，请 ${failPeek.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }
  const burst = rateLimitPeek(tryKey, 10, 15 * 60 * 1000);
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

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  const captchaToken =
    typeof body.captchaToken === "string" ? body.captchaToken : "";
  const captchaText =
    typeof body.captchaText === "string" ? body.captchaText : "";

  if (!username.trim() || !password) {
    markFail(failKey);
    rateLimitRecord(tryKey);
    return NextResponse.json({ error: "请输入用户名和密码" }, { status: 400 });
  }

  if (!verifyCaptcha(captchaToken, captchaText)) {
    markFail(failKey);
    rateLimitRecord(tryKey);
    return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });
  }

  const user = verifyPassword(username, password);
  if (!user) {
    markFail(failKey);
    rateLimitRecord(tryKey);
    logWarn("login_failed", { ip });
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  // revoke other sessions after successful login
  revokeUserSessions(user.id);
  const token = createUserSession(user.id);
  await setUserSessionCookie(token);
  rateLimitRecord(tryKey);

  return NextResponse.json({
    ok: true,
    user: { id: user.id, username: user.username, role: user.role },
  });
}
