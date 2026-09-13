import { NextResponse } from "next/server";
import { clearUserSessionCookie, readUserTokenFromRequest } from "@/lib/user-auth-http";
import { deleteUserAccount } from "@/lib/user-auth";
import { requireJson } from "@/lib/http-guard";

export async function POST(request: Request) {
  const badCt = requireJson(request);
  if (badCt) return badCt;

  const cookieToken = readUserTokenFromRequest(request);
  // need current user before delete
  const { getUserBySession } = await import("@/lib/user-auth");
  const user = getUserBySession(cookieToken);
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效请求体" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json({ error: "请输入密码" }, { status: 400 });
  }

  if (user.role === "admin") {
    return NextResponse.json(
      { error: "管理员账号暂不支持自助注销" },
      { status: 400 },
    );
  }

  const result = deleteUserAccount(user.id, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error || "注销失败" }, { status: 400 });
  }

  await clearUserSessionCookie();
  return NextResponse.json({ ok: true });
}
