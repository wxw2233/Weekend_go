import { NextResponse } from "next/server";
import { createSubmission, getCompany } from "@/lib/store";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { REST_TYPES, type RestType } from "@/lib/types";
import { parseRestDays, validateRestDays } from "@/lib/rest-days";
import { requireJson } from "@/lib/http-guard";
import { getRequestUser, userUnauthorized } from "@/lib/user-auth-http";
import { anyContainsBannedWords } from "@/lib/banned-words";

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

  const limited = rateLimit(`correct:${clientIp(request)}`, 5, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `提交过于频繁，请 ${limited.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效请求体" }, { status: 400 });
  }

  const restType = body.restType as RestType;
  if (!REST_TYPES.includes(restType)) {
    return NextResponse.json({ error: "休息制度无效" }, { status: 400 });
  }

  const str = (v: unknown, max = 500) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";

  const note = str(body.note);
  const evidenceNote = str(body.evidenceNote);
  if (!note && !evidenceNote) {
    return NextResponse.json(
      { error: "请填写补充说明或依据" },
      { status: 400 },
    );
  }

  const restDays = parseRestDays(body.restDays);
  const restDaysError = validateRestDays(restType, restDays);
  if (restDaysError) {
    return NextResponse.json({ error: restDaysError }, { status: 400 });
  }

  if (anyContainsBannedWords(note, evidenceNote, str(body.contact, 80))) {
    return NextResponse.json(
      { error: "内容包含不允许的文字，请修改后重试" },
      { status: 400 },
    );
  }

  const sub = await createSubmission({
    companyName: company.name,
    restType,
    city: company.city,
    industry: company.industry,
    note: note || "来自详情页纠错",
    evidenceNote,
    contact: str(body.contact, 80),
    companyRef: company.id,
    restDays,
  });

  return NextResponse.json({ ok: true, id: sub.id, status: sub.status });
}
