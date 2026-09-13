import { NextResponse } from "next/server";
import {
  adminUnauthorized,
  isRequestAdmin,
} from "@/lib/admin-auth";
import {
  readClaims,
  readSubmissions,
  updateClaimStatus,
  updateSubmissionStatus,
} from "@/lib/db";
import type { ReviewStatus } from "@/lib/types";

export async function GET(request: Request) {
  if (!(await isRequestAdmin(request))) return adminUnauthorized();

  const [submissions, claims] = await Promise.all([
    readSubmissions(),
    readClaims(),
  ]);

  return NextResponse.json({
    submissions,
    claims,
    counts: {
      submissionPending: submissions.filter((s) => s.status === "pending").length,
      claimPending: claims.filter((c) => c.status === "pending").length,
    },
  });
}

export async function PATCH(request: Request) {
  if (!(await isRequestAdmin(request))) return adminUnauthorized();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效请求体" }, { status: 400 });
  }

  const kind = body.kind;
  const id = typeof body.id === "string" ? body.id : "";
  const status = body.status as ReviewStatus;
  const reviewNote =
    typeof body.reviewNote === "string" ? body.reviewNote.slice(0, 300) : "";

  if (!id || !["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 });
  }

  if (kind === "submission") {
    const updated = await updateSubmissionStatus(id, status, reviewNote);
    if (!updated) return NextResponse.json({ error: "未找到" }, { status: 404 });
    return NextResponse.json({ ok: true, item: updated });
  }

  if (kind === "claim") {
    const updated = await updateClaimStatus(id, status, reviewNote);
    if (!updated) return NextResponse.json({ error: "未找到" }, { status: 404 });
    return NextResponse.json({ ok: true, item: updated });
  }

  return NextResponse.json({ error: "kind 无效" }, { status: 400 });
}
