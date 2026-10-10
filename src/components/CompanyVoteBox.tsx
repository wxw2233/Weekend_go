"use client";

import { useState } from "react";
import Link from "next/link";
import type { CompanyVoteChoice, CompanyVoteStat } from "@/lib/company-votes";
import VoteBar from "@/components/VoteBar";

type Props = {
  companyId: string;
  initialStat: CompanyVoteStat;
  initialMyVote: CompanyVoteChoice | null;
  isLoggedIn: boolean;
  backHref: string;
};

export default function CompanyVoteBox({
  companyId,
  initialStat,
  initialMyVote,
  isLoggedIn,
  backHref,
}: Props) {
  const [stat, setStat] = useState<CompanyVoteStat>(initialStat);
  const [myVote, setMyVote] = useState<CompanyVoteChoice | null>(initialMyVote);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function vote(choice: CompanyVoteChoice) {
    if (busy || myVote === choice) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/companies/${companyId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ choice }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "提交失败，请稍后再试");
      } else {
        setStat(data.stats);
        setMyVote(data.myVote);
      }
    } catch {
      setError("网络异常，请稍后再试");
    } finally {
      setBusy(false);
    }
  }

  function VoteButton({ choice, label }: { choice: CompanyVoteChoice; label: string }) {
    const active = myVote === choice;
    const isReal = choice === "real";
    return (
      <button
        type="button"
        onClick={() => vote(choice)}
        disabled={busy || !isLoggedIn}
        className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md border-2 px-4 text-sm font-bold transition disabled:opacity-60 sm:flex-none sm:px-6 ${
          active
            ? isReal
              ? "border-rest bg-rest text-white"
              : "border-danger bg-danger text-white"
            : isReal
              ? "border-rest/50 bg-white text-rest hover:bg-rest-soft/40"
              : "border-danger/40 bg-white text-danger hover:bg-danger-soft/30"
        }`}
      >
        {active && (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
            <path d="M6.5 11.5 3 8l1-1 2.5 2.5L11.5 4l1 1-6 6.5z" />
          </svg>
        )}
        {label}
      </button>
    );
  }

  return (
    <div className="mt-5 rounded-lg border border-line bg-white/85 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="text-base font-bold text-ink">真假对赌</h2>
        <p className="text-xs text-haze">
          {isLoggedIn
            ? myVote
              ? `你已投「${myVote === "real" ? "真" : "假"}」· 点另一个可改票`
              : "这家企业的双休是真的吗？投一票"
            : "登录后参与投票 · 只看不投也欢迎"}
        </p>
      </div>

      <div className="mt-3">
        <VoteBar stat={stat} size="lg" />
      </div>

      {isLoggedIn ? (
        <>
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
            <VoteButton choice="real" label="真 · 确实双休" />
            <VoteButton choice="fake" label="假 · 名不副实" />
          </div>
          {error && (
            <p className="mt-2 text-sm text-danger" role="status">
              {error}
            </p>
          )}
        </>
      ) : (
        <div className="mt-4 flex flex-col items-start gap-2.5 rounded-md border border-dashed border-line bg-rest-soft/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink/85">
            登录后即可参与真假投票，每人每企业一票，可随时改票。
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(backHref)}`}
            className="inline-flex min-h-10 shrink-0 items-center rounded-md bg-rest px-5 text-sm font-bold text-white transition hover:bg-rest-deep"
          >
            登录 / 注册
          </Link>
        </div>
      )}
    </div>
  );
}
