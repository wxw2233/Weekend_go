import { NextResponse } from "next/server";
import { setUserSessionCookie } from "@/lib/user-auth-http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  createUser,
  createUserSession,
  findUserByEmail,
  findUserByUsername,
  normalizeUsername,
  validatePassword,
  validateUsername,
} from "@/lib/user-auth";
import { requireJson } from "@/lib/http-guard";
import { verifyCaptcha } from "@/lib/captcha";
import { normalizeEmail, validateEmail, verifyEmailCode } from "@/lib/email-code";
import { logWarn } from "@/lib/log";

export async function POST(request: Request) {
  const badCt = requireJson(request);
  if (badCt) return badCt;

  // Kill switch: set REGISTRATION_OPEN=0 to close signups entirely.
  if (process.env.REGISTRATION_OPEN === "0") {
    return NextResponse.json({ error: "注册暂未开放" }, { status: 403 });
  }

  const limited = rateLimit(`register:${clientIp(request)}`, 3, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `注册过于频繁，请 ${limited.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效请求体" }, { status: 400 });
  }

  // Honeypot: hidden field real users never fill. Pretend success, create nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    const ip = clientIp(request);
    logWarn("register_honeypot_hit", { ip });
    return NextResponse.json({ ok: true });
  }

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  const emailRaw = typeof body.email === "string" ? body.email : "";
  const emailCode = typeof body.emailCode === "string" ? body.emailCode : "";
  const captchaToken =
    typeof body.captchaToken === "string" ? body.captchaToken : "";
  const captchaText =
    typeof body.captchaText === "string" ? body.captchaText : "";

  if (!verifyCaptcha(captchaToken, captchaText)) {
    return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });
  }

  const email = normalizeEmail(emailRaw);
  const emailError = validateEmail(email);
  if (emailError) {
    return NextResponse.json({ error: emailError }, { status: 400 });
  }
  if (!verifyEmailCode(email, "register", emailCode)) {
    return NextResponse.json(
      { error: "邮箱验证码错误或已过期，请重新获取" },
      { status: 400 },
    );
  }

  const usernameError = validateUsername(username);
  if (usernameError) {
    return NextResponse.json({ error: usernameError }, { status: 400 });
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  if (findUserByUsername(username)) {
    return NextResponse.json({ error: "用户名已被占用" }, { status: 409 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "该邮箱已被使用" }, { status: 409 });
  }

  const user = createUser(normalizeUsername(username), password, email);
  const token = createUserSession(user.id);
  await setUserSessionCookie(token);

  return NextResponse.json({
    ok: true,
    user: { id: user.id, username: user.username, role: user.role },
  });
}
