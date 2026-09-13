import { NextResponse } from "next/server";
import { setUserSessionCookie } from "@/lib/user-auth-http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  createUser,
  createUserSession,
  findUserByUsername,
  normalizeUsername,
  validatePassword,
  validateUsername,
} from "@/lib/user-auth";
import { requireJson } from "@/lib/http-guard";

export async function POST(request: Request) {
  const badCt = requireJson(request);
  if (badCt) return badCt;

  const limited = rateLimit(`register:${clientIp(request)}`, 5, 60 * 60 * 1000);
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

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

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

  const user = createUser(normalizeUsername(username), password);
  const token = createUserSession(user.id);
  await setUserSessionCookie(token);

  return NextResponse.json({
    ok: true,
    user: { id: user.id, username: user.username, role: user.role },
  });
}
