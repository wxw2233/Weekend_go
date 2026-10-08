import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { requireJson } from "@/lib/http-guard";
import { getRequestUser, userUnauthorized } from "@/lib/user-auth-http";
import { bindUserEmail, findUserByEmail } from "@/lib/user-auth";
import {
  normalizeEmail,
  validateEmail,
  verifyEmailCode,
} from "@/lib/email-code";
import { logInfo } from "@/lib/log";

export async function POST(request: Request) {
  const badCt = requireJson(request);
  if (badCt) return badCt;

  const user = await getRequestUser(request);
  if (!user) return userUnauthorized();

  const limited = rateLimit(`bind-email:${clientIp(request)}`, 5, 60 * 60 * 1000);
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
  const email = normalizeEmail(emailRaw);

  if (user.email) {
    return NextResponse.json(
      { error: "当前账号已绑定邮箱" },
      { status: 409 },
    );
  }
  const emailError = validateEmail(email);
  if (emailError) {
    return NextResponse.json({ error: emailError }, { status: 400 });
  }
  if (!emailCode.trim()) {
    return NextResponse.json({ error: "请输入邮箱验证码" }, { status: 400 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "该邮箱已被使用" }, { status: 409 });
  }
  if (!verifyEmailCode(email, "bind", emailCode)) {
    return NextResponse.json(
      { error: "邮箱验证码错误或已过期，请重新获取" },
      { status: 400 },
    );
  }

  const result = bindUserEmail(user.id, email);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  logInfo("email_bound", { userId: user.id });
  return NextResponse.json({ ok: true });
}
