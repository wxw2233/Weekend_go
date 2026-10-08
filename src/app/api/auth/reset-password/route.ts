import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { requireJson } from "@/lib/http-guard";
import { normalizeEmail, validateEmail, verifyEmailCode } from "@/lib/email-code";
import { findUserByEmail, resetUserPasswordByEmail } from "@/lib/user-auth";
import { logWarn } from "@/lib/log";

export async function POST(request: Request) {
  const badCt = requireJson(request);
  if (badCt) return badCt;

  const ip = clientIp(request);
  const limited = rateLimit(`reset-pw:${ip}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `操作过于频繁，请 ${limited.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效请求体" }, { status: 400 });
  }

  const emailRaw = typeof body.email === "string" ? body.email : "";
  const emailCode = typeof body.emailCode === "string" ? body.emailCode : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  const email = normalizeEmail(emailRaw);
  const emailError = validateEmail(email);
  if (emailError) {
    return NextResponse.json({ error: emailError }, { status: 400 });
  }
  if (!emailCode.trim()) {
    return NextResponse.json({ error: "请输入邮箱验证码" }, { status: 400 });
  }
  if (!newPassword) {
    return NextResponse.json({ error: "请输入新密码" }, { status: 400 });
  }

  if (!verifyEmailCode(email, "reset", emailCode)) {
    return NextResponse.json({ error: "邮箱验证码错误或已过期" }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user) {
    // Code was valid but no account: pretend success (anti-enumeration).
    logWarn("reset_unknown_email", { ip });
    return NextResponse.json({ ok: true });
  }

  const result = resetUserPasswordByEmail(email, newPassword);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  logWarn("password_reset_via_email", { userId: user.id });
  return NextResponse.json({ ok: true });
}
