import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { requireJson } from "@/lib/http-guard";
import {
  EmailScene,
  issueEmailCode,
  normalizeEmail,
  resendCooldownOk,
  validateEmail,
} from "@/lib/email-code";
import { findUserByEmail } from "@/lib/user-auth";
import { getRequestUser } from "@/lib/user-auth-http";
import { mailConfigured, sendMail, verificationEmailHtml } from "@/lib/mailer";
import { logWarn } from "@/lib/log";

export async function POST(request: Request) {
  const badCt = requireJson(request);
  if (badCt) return badCt;

  const ip = clientIp(request);

  // IP-level cap: 5 sends per hour per IP.
  const ipLimited = rateLimit(`email-code:ip:${ip}`, 5, 60 * 60 * 1000);
  if (!ipLimited.ok) {
    return NextResponse.json(
      { error: `发送过于频繁，请 ${ipLimited.retryAfterSec} 秒后再试` },
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
  const scene: EmailScene =
    body.scene === "reset"
      ? "reset"
      : body.scene === "bind"
        ? "bind"
        : "register";
  const email = normalizeEmail(emailRaw);

  const emailError = validateEmail(email);
  if (emailError) {
    return NextResponse.json({ error: emailError }, { status: 400 });
  }

  // Binding requires a logged-in user.
  if (scene === "bind") {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (user.email) {
      return NextResponse.json(
        { error: "当前账号已绑定邮箱" },
        { status: 409 },
      );
    }
  }

  // Per-email caps: 1/min and 5/hour.
  const cooldown = resendCooldownOk(email, scene);
  if (!cooldown.ok) {
    return NextResponse.json(
      { error: `验证码已发送，请 ${cooldown.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }
  const emailLimited = rateLimit(`email-code:addr:${email}`, 5, 60 * 60 * 1000);
  if (!emailLimited.ok) {
    return NextResponse.json(
      { error: `该邮箱发送过于频繁，请 ${emailLimited.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }

  if (scene === "register" || scene === "bind") {
    if (findUserByEmail(email)) {
      return NextResponse.json({ error: "该邮箱已被使用" }, { status: 409 });
    }
  } else if (scene === "reset" && !findUserByEmail(email)) {
    // Anti-enumeration: pretend success, send nothing.
    return NextResponse.json({ ok: true });
  }

  if (!mailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      logWarn("email_code_no_smtp", { ip });
      return NextResponse.json(
        { error: "邮件服务暂不可用，请稍后再试" },
        { status: 503 },
      );
    }
    // dev: fall through, sendMail logs the code instead of sending
  }

  const code = issueEmailCode(email, scene);
  const purpose =
    scene === "register" ? "注册" : scene === "bind" ? "绑定邮箱" : "重置密码";
  try {
    await sendMail({
      to: email,
      subject: `双休go! ${purpose}验证码：${code}`,
      text: `你的${purpose}验证码是 ${code}，10 分钟内有效。如非本人操作请忽略本邮件。`,
      html: verificationEmailHtml(code, scene),
    });
  } catch {
    return NextResponse.json(
      { error: "邮件发送失败，请稍后再试" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
