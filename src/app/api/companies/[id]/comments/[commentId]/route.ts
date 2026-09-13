import { NextResponse } from "next/server";
import { deleteComment, getComment } from "@/lib/store";
import { getRequestUser } from "@/lib/user-auth-http";

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string; commentId: string }> },
) {
  const { id, commentId } = await ctx.params;
  const comment = getComment(commentId);
  if (!comment || comment.companyId !== id) {
    return NextResponse.json({ error: "评论不存在" }, { status: 404 });
  }

  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const isOwner = user.id === comment.userId;
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "无权删除该评论" }, { status: 403 });
  }

  deleteComment(commentId);
  return NextResponse.json({ ok: true });
}
