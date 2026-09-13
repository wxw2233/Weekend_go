import { NextResponse } from "next/server";
import { getComment, getCompany, toggleCommentLike, countCommentLikes } from "@/lib/store";
import { getRequestUser } from "@/lib/user-auth-http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string; commentId: string }> },
) {
  const { id, commentId } = await ctx.params;
  const company = await getCompany(id);
  if (!company) {
    return NextResponse.json({ error: "企业不存在" }, { status: 404 });
  }

  const comment = getComment(commentId);
  if (!comment || comment.companyId !== id) {
    return NextResponse.json({ error: "评论不存在" }, { status: 404 });
  }

  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "请先登录再点赞" }, { status: 401 });
  }

  const limited = rateLimit(`like:${user.id}`, 60, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "操作过于频繁，请稍后再试" },
      { status: 429 },
    );
  }

  const liked = toggleCommentLike(commentId, user.id);
  return NextResponse.json({
    ok: true,
    liked,
    likeCount: countCommentLikes(commentId),
  });
}
