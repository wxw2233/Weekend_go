"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { type RestType, type ReviewStatus } from "@/lib/types";
import { formatRestDays } from "@/lib/rest-days";

type Submission = {
  id: string;
  companyName: string;
  restType: RestType;
  city: string;
  industry: string;
  note: string;
  evidenceNote: string;
  contact: string;
  status: ReviewStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  companyRef?: string | null;
  restDays?: number[];
};

type Claim = {
  id: string;
  companyName: string;
  restType: RestType;
  city: string;
  industry: string;
  policySummary: string;
  evidenceNote: string;
  contactName: string;
  contact: string;
  status: ReviewStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  restDays?: number[];
};

type Tab = "pending" | "approved" | "rejected" | "claims" | "companies";

type CompanyLite = {
  id: string;
  name: string;
  restType: RestType;
  city: string;
  industry: string;
  source: string;
};

const statusLabel: Record<ReviewStatus, string> = {
  pending: "待核实",
  approved: "已通过",
  rejected: "已驳回",
};

export default function AdminDashboard({ token }: { token: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [tab, setTab] = useState<Tab>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("unauthorized");
      const data = await res.json();
      setSubmissions(data.submissions || []);
      setClaims(data.claims || []);
      const cRes = await fetch("/api/companies", { credentials: "same-origin" });
      if (cRes.ok) {
        const cData = await cRes.json();
        setCompanies(cData.items || []);
      }
    } catch {
      setError("加载失败或口令无效。");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingSubs = useMemo(
    () => submissions.filter((s) => s.status === "pending"),
    [submissions],
  );
  const approvedSubs = useMemo(
    () => submissions.filter((s) => s.status === "approved"),
    [submissions],
  );
  const rejectedSubs = useMemo(
    () => submissions.filter((s) => s.status === "rejected"),
    [submissions],
  );

  async function review(
    kind: "submission" | "claim",
    id: string,
    status: ReviewStatus,
  ) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "same-origin",
        body: JSON.stringify({
          kind,
          id,
          status,
          reviewNote: noteDraft[id] || "",
        }),
      });
      if (!res.ok) throw new Error("review failed");
      await load();
    } catch {
      setError("操作失败，请重试。");
    } finally {
      setBusyId("");
    }
  }

  function renderSubs(list: Submission[], withActions: boolean) {
    if (list.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-line bg-white px-4 py-12 text-center">
          <p className="text-sm font-semibold text-ink">
            {withActions ? "没有待核实标注" : "这里还没有记录"}
          </p>
          <p className="mt-1 text-xs text-haze">
            {withActions ? "有新提交会出现在这里" : "通过或驳回后会归档到对应页签"}
          </p>
        </div>
      );
    }
    return (
      <ul className="divide-y divide-line border border-line bg-white">
        {list.map((s) => (
          <li key={s.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-semibold text-ink">
                  {s.companyName}
                  {s.companyRef && (
                    <span className="ml-2 align-middle rounded bg-rest-soft px-1.5 py-0.5 font-mono text-[10px] font-bold text-rest-deep">
                      企业纠错
                    </span>
                  )}
                </p>
                <p className="mt-1 font-mono text-xs text-haze">
                  {s.restType}
                  {formatRestDays(s.restDays) ? ` · 休${formatRestDays(s.restDays)}` : ""}
                  {" · "}
                  {s.city || "未知"} · {s.industry || "未分类"} ·{" "}
                  {new Date(s.createdAt).toLocaleString("zh-CN")}
                  {s.companyRef ? ` · ${s.companyRef}` : ""}
                </p>
              </div>
              <span className="font-mono text-xs text-haze">
                {statusLabel[s.status]}
              </span>
            </div>
            {s.note && (
              <p className="mt-3 text-sm leading-relaxed text-ink/80">{s.note}</p>
            )}
            {s.evidenceNote && (
              <p className="mt-2 text-sm text-haze">
                依据：{s.evidenceNote}
              </p>
            )}
            {s.contact && (
              <p className="mt-1 font-mono text-xs text-haze">
                联系：{s.contact}
              </p>
            )}
            {withActions && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  className="field sm:max-w-md"
                  placeholder="审核备注（可选）"
                  value={noteDraft[s.id] || ""}
                  onChange={(e) =>
                    setNoteDraft((d) => ({ ...d, [s.id]: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busyId === s.id}
                    onClick={() => review("submission", s.id, "approved")}
                  >
                    通过并入库
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={busyId === s.id}
                    onClick={() => review("submission", s.id, "rejected")}
                  >
                    驳回
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  function renderClaims(list: Claim[]) {
    if (list.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-line bg-white px-4 py-12 text-center">
          <p className="text-sm font-semibold text-ink">暂无企业认领</p>
          <p className="mt-1 text-xs text-haze">企业从「企业认领」页提交后会出现在这里</p>
        </div>
      );
    }
    return (
      <ul className="divide-y divide-line border border-line bg-white">
        {list.map((c) => (
          <li key={c.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-semibold text-ink">
                  {c.companyName}
                  {c.status === "approved" && (
                    <span className="ml-2 align-middle font-mono text-xs text-rest">
                      已认证
                    </span>
                  )}
                </p>
                <p className="mt-1 font-mono text-xs text-haze">
                  {c.restType} · {c.city || "未知"} · {c.industry || "未分类"} ·{" "}
                  {new Date(c.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
              <span className="font-mono text-xs text-haze">
                {statusLabel[c.status]}
              </span>
            </div>
            {c.policySummary && (
              <p className="mt-3 text-sm leading-relaxed text-ink/80">
                {c.policySummary}
              </p>
            )}
            {c.evidenceNote && (
              <p className="mt-2 text-sm text-haze">材料：{c.evidenceNote}</p>
            )}
            <p className="mt-1 font-mono text-xs text-haze">
              联系人：{c.contactName || "—"} · {c.contact}
            </p>
            {c.status === "pending" && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  className="field sm:max-w-md"
                  placeholder="审核备注（可选）"
                  value={noteDraft[c.id] || ""}
                  onChange={(e) =>
                    setNoteDraft((d) => ({ ...d, [c.id]: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busyId === c.id}
                    onClick={() => review("claim", c.id, "approved")}
                  >
                    认证通过
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={busyId === c.id}
                    onClick={() => review("claim", c.id, "rejected")}
                  >
                    驳回
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  async function deleteCompany(id: string, name: string) {
    if (!window.confirm(`确定删除企业「${name}」？评论也会一并删除。`)) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/companies/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "删除失败");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setBusyId("");
    }
  }

  function renderCompanies() {
    if (companies.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-line bg-white px-4 py-12 text-center">
          <p className="text-sm font-semibold text-ink">暂无企业</p>
        </div>
      );
    }
    return (
      <ul className="divide-y divide-line border border-line bg-white">
        {companies.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{c.name}</p>
              <p className="mt-0.5 font-mono text-xs text-haze">
                {c.restType} · {c.city || "未知"} · {c.industry || "未分类"} ·{" "}
                {c.source}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/sx/companies/${c.id}`}
                className="btn-ghost !min-h-9 px-3 !text-xs"
              >
                查看
              </Link>
              <button
                type="button"
                className="inline-flex min-h-9 items-center rounded-md border border-danger px-3 text-xs font-bold text-danger hover:bg-danger hover:text-white disabled:opacity-50"
                disabled={busyId === c.id}
                onClick={() => deleteCompany(c.id, c.name)}
              >
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "pending", label: "待核实标注", count: pendingSubs.length },
    { id: "approved", label: "已通过标注", count: approvedSubs.length },
    { id: "rejected", label: "已驳回标注", count: rejectedSubs.length },
    { id: "claims", label: "企业认领", count: claims.length },
    { id: "companies", label: "企业库", count: companies.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              "min-h-11 rounded-sm border px-4 text-sm font-semibold transition",
              tab === t.id
                ? "border-rest bg-rest text-paper"
                : "border-line bg-white text-ink hover:border-rest hover:text-rest",
            ].join(" ")}
          >
            {t.label}
            <span className="ml-2 font-mono text-xs opacity-80">{t.count}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="border border-caution/40 bg-caution-soft px-4 py-3 text-sm text-caution">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-haze">加载中…</p>
      ) : tab === "pending" ? (
        renderSubs(pendingSubs, true)
      ) : tab === "approved" ? (
        renderSubs(approvedSubs, false)
      ) : tab === "rejected" ? (
        renderSubs(rejectedSubs, false)
      ) : tab === "companies" ? (
        renderCompanies()
      ) : (
        renderClaims(claims)
      )}
    </div>
  );
}
