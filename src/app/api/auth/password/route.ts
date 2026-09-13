import { NextResponse } from "next/server";
import { getRequestUser, setUserSessionCookie } from "@/lib/user-auth-http";
import {
  changeUserPassword,
  createUserSession,
} from "@/lib/user-auth";
import { requireJson } from "@/lib/http-guard";

export async function POST(request: Request) {
  const badCt = requireJson(request);
  if (badCt) return badCt;

  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效请求体" }, { status: 400 });
  }

  const oldPassword =
    typeof body.oldPassword === "string" ? body.oldPassword : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";

  const result = changeUserPassword(user.id, oldPassword, newPassword);
  if (!result.ok) {
    return NextResponse.json({ error: result.error || "修改失败" }, { status: 400 });
  }

  const token = createUserSession(user.id);
  await setUserSessionCookie(token);
  return NextResponse.json({ ok: true });
}
