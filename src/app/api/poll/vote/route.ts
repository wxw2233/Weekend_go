import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { requireJson } from "@/lib/http-guard";
import { castVote, getPollStats } from "@/lib/poll";
import { getRequestUser, userUnauthorized } from "@/lib/user-auth-http";
import type { PollAnswers, PollDimension } from "@/lib/poll-options";
import { POLL_DIMENSIONS } from "@/lib/poll-options";

export async function POST(request: Request) {
  const badCt = requireJson(request);
  if (badCt) return badCt;

  const user = await getRequestUser(request);
  if (!user) return userUnauthorized();

  const limited = rateLimit(`poll:vote:${user.id}`, 10, 60 * 60 * 1000);
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

  const rawAnswers = body.answers;
  if (typeof rawAnswers !== "object" || rawAnswers === null) {
    return NextResponse.json({ error: "缺少投票内容" }, { status: 400 });
  }

  const answers: PollAnswers = {};
  for (const dim of POLL_DIMENSIONS) {
    const v = (rawAnswers as Record<string, unknown>)[dim];
    if (typeof v === "string" && v) {
      answers[dim as PollDimension] = v;
    }
  }

  try {
    const result = castVote(`u:${user.id}`, answers);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, updated: result.updated, stats: getPollStats() });
  } catch (e) {
    console.error("poll vote failed", e);
    return NextResponse.json({ error: "服务器繁忙，请稍后再试" }, { status: 500 });
  }
}
