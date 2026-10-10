import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { requireJson } from "@/lib/http-guard";
import { getCompany } from "@/lib/store";
import { getRequestUser, userUnauthorized } from "@/lib/user-auth-http";
import {
  castCompanyVote,
  companyVoteStat,
  isValidCompanyVoteChoice,
} from "@/lib/company-votes";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const badCt = requireJson(request);
  if (badCt) return badCt;

  const user = await getRequestUser(request);
  if (!user) return userUnauthorized();

  const { id } = await ctx.params;
  const company = await getCompany(id);
  if (!company) {
    return NextResponse.json({ error: "企业不存在" }, { status: 404 });
  }

  const limited = rateLimit(`cvote:${user.id}`, 30, 60 * 1000);
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

  const choice = body.choice;
  if (!isValidCompanyVoteChoice(choice)) {
    return NextResponse.json(
      { error: "无效的投票选项" },
      { status: 400 },
    );
  }

  try {
    const result = castCompanyVote(`u:${user.id}`, id, choice);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      updated: result.updated,
      stats: companyVoteStat(id),
      myVote: choice,
    });
  } catch (e) {
    console.error("company vote failed", e);
    return NextResponse.json({ error: "服务器繁忙，请稍后再试" }, { status: 500 });
  }
}
