import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/user-auth-http";
import { listUserComments } from "@/lib/store";

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  return NextResponse.json({ items: listUserComments(user.id) });
}
