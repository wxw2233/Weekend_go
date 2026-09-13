import { NextResponse } from "next/server";
import {
  countCompanyComments,
  createComment,
  getComment,
  getCompany,
  listCommentsPage,
} from "@/lib/store";
import { getRequestUser } from "@/lib/user-auth-http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { requireJson } from "@/lib/http-guard";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const company = await getCompany(id);
  if (!company) {
    return NextResponse.json({ error: "企业不存在" }, { status: 404 });
  }
  const user = await getRequestUser(request);
  const { searchParams } = new URL(request.url);
  const pageRaw = Number(searchParams.get("page") || "1");
  if (!Number.isFinite(pageRaw) || pageRaw < 1 || pageRaw !== Math.floor(pageRaw)) {
    return NextResponse.json({ error: "page 参数无效" }, { status: 400 });
  }
  const page = Math.min(50, pageRaw);
  const sizeRaw = Number(searchParams.get("pageSize") || "10");
  const pageSize = Number.isFinite(sizeRaw)
    ? Math.min(20, Math.max(5, Math.floor(sizeRaw)))
    : 10;
  const offset = (page - 1) * pageSize;
  const total = countCompanyComments(id);
  const items = listCommentsPage(id, user?.id ?? null, pageSize, offset);
  return NextResponse.json({
    items,
    page,
    pageSize,
    total,
    hasMore: offset + items.length < total,
  });
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const badCt = requireJson(request);
  if (badCt) return badCt;

  const { id } = await ctx.params;
  const company = await getCompany(id);
  if (!company) {
    return NextResponse.json({ error: "企业不存在" }, { status: 404 });
  }

  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "请先登录再评论" }, { status: 401 });
  }

  const limited = rateLimit(
    `comment:${clientIp(request)}:${user.id}`,
    10,
    10 * 60 * 1000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: `评论过于频繁，请 ${limited.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效请求体" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content || content.length < 2) {
    return NextResponse.json({ error: "评论至少 2 个字" }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: "评论最多 500 字" }, { status: 400 });
  }

  let parentId: string | null = null;
  let replyToUsername: string | null = null;
  const rawParent = body.parentId;
  if (typeof rawParent === "string" && rawParent.trim()) {
    const parent = getComment(rawParent.trim());
    if (!parent || parent.companyId !== id) {
      return NextResponse.json({ error: "回复的评论不存在" }, { status: 400 });
    }
    let root = parent;
    const seen = new Set<string>([root.id]);
    while (root.parentId && !seen.has(root.parentId)) {
      seen.add(root.parentId);
      const next = getComment(root.parentId);
      if (!next) break;
      root = next;
    }
    parentId = root.id;
    replyToUsername = parent.username;
  }

  const comment = createComment({
    companyId: id,
    userId: user.id,
    username: user.username,
    content,
    parentId,
    replyToUsername,
  });

  return NextResponse.json({ ok: true, item: comment });
}
