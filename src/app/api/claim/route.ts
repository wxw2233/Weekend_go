import { NextResponse } from "next/server";
import { createClaim } from "@/lib/store";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { REST_TYPES, type RestType } from "@/lib/types";
import { parseRestDays, validateRestDays } from "@/lib/rest-days";
import { requireJson } from "@/lib/http-guard";

export async function POST(request: Request) {
  const badCt = requireJson(request);
  if (badCt) return badCt;

  const limited = rateLimit(`claim:${clientIp(request)}`, 3, 30 * 60 * 1000);
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

  const companyName =
    typeof body.companyName === "string" ? body.companyName.trim() : "";
  const restType = body.restType as RestType;
  const contact = typeof body.contact === "string" ? body.contact.trim() : "";

  if (!companyName || companyName.length > 80) {
    return NextResponse.json({ error: "企业名称无效" }, { status: 400 });
  }
  if (!REST_TYPES.includes(restType)) {
    return NextResponse.json({ error: "休息制度无效" }, { status: 400 });
  }
  if (!contact || contact.length > 80) {
    return NextResponse.json({ error: "请填写可核验的联系方式" }, { status: 400 });
  }

  const restDays = parseRestDays(body.restDays);
  const restDaysError = validateRestDays(restType, restDays);
  if (restDaysError) {
    return NextResponse.json({ error: restDaysError }, { status: 400 });
  }

  const str = (v: unknown, max = 800) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";

  const policySummary = str(body.policySummary);
  const evidenceNote = str(body.evidenceNote);
  if (!policySummary) {
    return NextResponse.json({ error: "请填写制度说明" }, { status: 400 });
  }
  if (!evidenceNote) {
    return NextResponse.json({ error: "请填写可核验材料说明" }, { status: 400 });
  }

  const claim = await createClaim({
    companyName,
    restType,
    city: str(body.city, 40),
    industry: str(body.industry, 40),
    policySummary,
    evidenceNote,
    contactName: str(body.contactName, 40),
    contact,
    restDays,
  });

  return NextResponse.json({ ok: true, id: claim.id, status: claim.status });
}
