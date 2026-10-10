import { NextResponse } from "next/server";
import { createSubmission } from "@/lib/store";
import {
  clientIp,
  failCooldownPeek,
  markFail,
  rateLimitPeek,
  rateLimitRecord,
} from "@/lib/rate-limit";
import { REST_TYPES, type RestType } from "@/lib/types";
import { parseRestDays, validateRestDays } from "@/lib/rest-days";
import { requireJson } from "@/lib/http-guard";
import { getRequestUser, userUnauthorized } from "@/lib/user-auth-http";
import { anyContainsBannedWords } from "@/lib/banned-words";

/**
 * 成功才计入主配额；1 分钟内成功 ≤3 次不触发。
 * 失败仅 10 秒冷却，不占成功配额。
 */
function checkSubmitLimit(ip: string) {
  const okKey = `submit:ok:${ip}`;
  const failKey = `submit:fail:${ip}`;
  const minute = rateLimitPeek(okKey, 3, 60_000);
  if (!minute.ok) {
    return { ok: false, retryAfterSec: minute.retryAfterSec, failKey, okKey };
  }
  const window = rateLimitPeek(okKey, 20, 10 * 60 * 1000);
  if (!window.ok) {
    return { ok: false, retryAfterSec: window.retryAfterSec, failKey, okKey };
  }
  const fail = failCooldownPeek(failKey, 10_000);
  if (!fail.ok) {
    return { ok: false, retryAfterSec: fail.retryAfterSec, failKey, okKey };
  }
  return { ok: true, retryAfterSec: 0, failKey, okKey };
}

export async function POST(request: Request) {
  const badCt = requireJson(request);
  if (badCt) return badCt;

  const user = await getRequestUser(request);
  if (!user) return userUnauthorized();

  const ip = clientIp(request);
  const limit = checkSubmitLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `操作过于频繁，请 ${limit.retryAfterSec} 秒后再试` },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    markFail(limit.failKey);
    return NextResponse.json({ error: "无效请求体" }, { status: 400 });
  }

  const companyName =
    typeof body.companyName === "string" ? body.companyName.trim() : "";
  const restType = body.restType as RestType;
  const position =
    typeof body.position === "string" ? body.position.trim().slice(0, 40) : "";

  if (!companyName || companyName.length > 80) {
    markFail(limit.failKey);
    return NextResponse.json({ error: "请填写企业名称" }, { status: 400 });
  }
  if (!REST_TYPES.includes(restType)) {
    markFail(limit.failKey);
    return NextResponse.json({ error: "休息制度无效" }, { status: 400 });
  }

  const restDays = parseRestDays(body.restDays);
  const restDaysError = validateRestDays(restType, restDays);
  if (restDaysError) {
    markFail(limit.failKey);
    return NextResponse.json({ error: restDaysError }, { status: 400 });
  }

  const str = (v: unknown, max = 500) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";

  const evidenceNote = str(body.evidenceNote);
  if (!evidenceNote) {
    markFail(limit.failKey);
    return NextResponse.json({ error: "请填写证据说明" }, { status: 400 });
  }

  const note = str(body.note);
  const contact = str(body.contact, 80);
  if (anyContainsBannedWords(companyName, note, evidenceNote, contact)) {
    markFail(limit.failKey);
    return NextResponse.json(
      { error: "内容包含不允许的文字，请修改后重试" },
      { status: 400 },
    );
  }

  const sub = await createSubmission({
    companyName,
    restType,
    city: str(body.city, 40),
    industry: str(body.industry, 40),
    position,
    note,
    evidenceNote,
    contact,
    restDays,
  });

  rateLimitRecord(limit.okKey);
  return NextResponse.json({ ok: true, id: sub.id, status: sub.status });
}
