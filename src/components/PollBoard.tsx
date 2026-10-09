"use client";

import { useMemo, useState } from "react";
import {
  DIMENSION_LABEL,
  POLL_OPTIONS,
  type PollAnswers,
  type PollDimension,
  type PollOption,
} from "@/lib/poll-options";
import type { PollStats } from "@/lib/poll";

type Props = { initialStats: PollStats };

const PIE_COLORS = ["#1F6B4A", "#A85C12", "#8FCBB3", "#CFC8B8"];

function pct(n: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((n / total) * 1000) / 10}%`;
}

function pieSlice(
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
): string {
  const rad = (a: number) => ((a - 90) * Math.PI) / 180;
  const x0 = cx + r * Math.cos(rad(a0));
  const y0 = cy + r * Math.sin(rad(a0));
  const x1 = cx + r * Math.cos(rad(a1));
  const y1 = cy + r * Math.sin(rad(a1));
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

function SalaryChart({ stats }: { stats: PollStats }) {
  const options = POLL_OPTIONS.salary;
  const total = stats.totals.salary;
  const W = 720;
  const H = 250;
  const left = 44;
  const right = W - 46;
  const top = 24;
  const bottom = 210;
  const plotW = right - left;
  const plotH = bottom - top;

  const maxCount = Math.max(
    1,
    ...options.map((o) => stats.counts.salary[o.key] ?? 0),
  );
  const points: string[] = [];
  let cum = 0;
  options.forEach((o, i) => {
    cum += stats.counts.salary[o.key] ?? 0;
    const x = left + (i + 0.5) * (plotW / options.length);
    const y = bottom - (cum / Math.max(total, 1)) * plotH;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  });

  const ticks: { i: number; label: string }[] = [];
  options.forEach((o, i) => {
    if (o.key === "le2999") ticks.push({ i, label: "<3k" });
    const m = o.key.match(/^s(\d+)$/);
    if (m && Number(m[1]) % 5000 === 0) {
      ticks.push({ i, label: `${Number(m[1]) / 1000}k` });
    }
    if (o.key === "ge30000") ticks.push({ i, label: "30k+" });
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="薪资挡位分布柱状图与累计占比折线图"
    >
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={left}
          x2={right}
          y1={bottom - f * plotH}
          y2={bottom - f * plotH}
          stroke="#CFC8B8"
          strokeOpacity="0.4"
          strokeWidth="0.5"
        />
      ))}
      <line x1={left} x2={right} y1={bottom} y2={bottom} stroke="#CFC8B8" strokeWidth="1" />
      <line x1={left} x2={left} y1={top - 6} y2={bottom} stroke="#CFC8B8" strokeWidth="1" />
      <line x1={right} x2={right} y1={top - 6} y2={bottom} stroke="#CFC8B8" strokeWidth="0.5" strokeDasharray="3 3" />

      {options.map((o, i) => {
        const c = stats.counts.salary[o.key] ?? 0;
        const h = (c / maxCount) * plotH;
        const slot = plotW / options.length;
        const bw = Math.max(slot * 0.62, 2.5);
        const x = left + i * slot + (slot - bw) / 2;
        return (
          <rect
            key={o.key}
            x={x}
            y={bottom - h}
            width={bw}
            height={c > 0 ? h : 0.5}
            rx={1.5}
            fill={c > 0 ? "#1F6B4A" : "#CFC8B8"}
            opacity={c > 0 ? 0.9 : 0.5}
          >
            <title>{`${o.label}：${c} 票（${pct(c, total)}）`}</title>
          </rect>
        );
      })}

      {total > 0 && (
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="#A85C12"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      {total > 0 &&
        points.map((p, i) => {
          const [x, y] = p.split(",");
          return (
            <circle key={i} cx={x} cy={y} r="2.2" fill="#A85C12">
              <title>
                {`${options[i].label}：累计 ${pct(
                  options.slice(0, i + 1).reduce((s, o) => s + (stats.counts.salary[o.key] ?? 0), 0),
                  total,
                )}`}
              </title>
            </circle>
          );
        })}

      {ticks.map((t) => {
        const x = left + (t.i + 0.5) * (plotW / options.length);
        return (
          <text key={t.label} x={x} y={bottom + 16} fontSize="11" fill="#5F6A64" textAnchor="middle">
            {t.label}
          </text>
        );
      })}
      <text x={left - 6} y={top + 4} fontSize="11" fill="#5F6A64" textAnchor="end">
        {maxCount}
      </text>
      <text x={left - 6} y={bottom + 4} fontSize="11" fill="#5F6A64" textAnchor="end">
        0
      </text>
      <text x={right + 6} y={top + 4} fontSize="11" fill="#A85C12">
        100%
      </text>
      <text x={W / 2} y={H - 6} fontSize="11" fill="#5F6A64" textAnchor="middle">
        月薪挡位（元） · 绿柱=票数 · 橙线=累计占比
      </text>
    </svg>
  );
}

function RestPie({ stats }: { stats: PollStats }) {
  const options = POLL_OPTIONS.rest_days;
  const total = stats.totals.rest_days;
  const cx = 100;
  const cy = 100;
  const r = 78;
  let angle = 0;
  const slices = options.map((o, i) => {
    const c = stats.counts.rest_days[o.key] ?? 0;
    const sweep = total > 0 ? (c / total) * 360 : 0;
    const path =
      total > 0 && c > 0 ? pieSlice(cx, cy, r, angle, angle + Math.min(sweep, 359.99)) : "";
    angle += sweep;
    return { o, c, path, color: PIE_COLORS[i % PIE_COLORS.length] };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <svg viewBox="0 0 200 200" className="w-44 shrink-0" role="img" aria-label="每周休息天数分布饼图">
        <circle cx={cx} cy={cy} r={r} fill="#F1EFE8" stroke="#CFC8B8" strokeWidth="0.5" />
        {slices.map(
          (s) =>
            s.c > 0 && (
              <path key={s.o.key} d={s.path} fill={s.color} stroke="#FFFFFF" strokeWidth="1">
                <title>{`${s.o.label}：${s.c} 票（${pct(s.c, total)}）`}</title>
              </path>
            ),
        )}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="#FFFFFF" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="600" fill="#0F1A14">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#5F6A64">
          票
        </text>
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.o.key} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="flex-1 text-ink">{s.o.label}</span>
            <span className="shrink-0 font-semibold text-ink tabular-nums">
              {s.c}
            </span>
            <span className="w-14 shrink-0 text-right text-haze tabular-nums">
              {pct(s.c, total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WorkHoursBars({ stats }: { stats: PollStats }) {
  const options = POLL_OPTIONS.work_hours;
  const total = stats.totals.work_hours;
  const maxCount = Math.max(
    1,
    ...options.map((o) => stats.counts.work_hours[o.key] ?? 0),
  );
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5 sm:gap-2">
        {options.map((o) => {
          const c = stats.counts.work_hours[o.key] ?? 0;
          const h = Math.max((c / maxCount) * 100, c > 0 ? 4 : 1);
          return (
            <div key={o.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-ink tabular-nums">
                {total > 0 ? pct(c, total) : ""}
              </span>
              <div
                className={`w-full rounded-t-sm ${c > 0 ? "bg-rest" : "bg-line"}`}
                style={{ height: `${h}%` }}
                title={`${o.label}：${c} 票`}
              />
              <span className="text-[10px] leading-none text-haze">
                {o.key === "le7" ? "≤7" : o.key === "ge12" ? "12+" : o.key.slice(1)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[11px] text-haze">
        每日实际工作时长（小时，含加班） · 柱上为占比
      </p>
    </div>
  );
}

export default function PollBoard({ initialStats }: Props) {
  const [stats, setStats] = useState<PollStats>(initialStats);
  const [answers, setAnswers] = useState<PollAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const totalVotes = Math.max(
    stats.totals.work_hours,
    stats.totals.salary,
    stats.totals.rest_days,
  );

  function setAnswer(dim: PollDimension, key: string) {
    setAnswers((prev) => ({ ...prev, [dim]: key }));
  }

  async function submit() {
    const chosen = Object.fromEntries(
      Object.entries(answers).filter(([, v]) => v),
    ) as PollAnswers;
    if (Object.keys(chosen).length === 0) {
      setMessage({ ok: false, text: "请先至少选择一个挡位" });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/poll/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ answers: chosen }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ ok: false, text: data.error || "提交失败，请稍后再试" });
      } else {
        setStats(data.stats);
        setMessage({ ok: true, text: "已记录！感谢参与，随时可以改票。" });
      }
    } catch {
      setMessage({ ok: false, text: "网络异常，请稍后再试" });
    } finally {
      setSubmitting(false);
    }
  }

  const selects = useMemo(
    () =>
      (Object.keys(POLL_OPTIONS) as PollDimension[]).map((dim) => ({
        dim,
        options: POLL_OPTIONS[dim],
      })),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-ink">投出你的真实状态</h2>
          <p className="text-xs text-haze">
            匿名投票 · 不收集任何个人身份信息 · 每个维度一票，可随时修改
          </p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {selects.map(({ dim, options }) => (
            <label key={dim} className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">
                {DIMENSION_LABEL[dim]}
              </span>
              <select
                value={answers[dim] ?? ""}
                onChange={(e) => setAnswer(dim, e.target.value)}
                className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-rest focus:outline-none"
              >
                <option value="">请选择…</option>
                {options.map((o: PollOption) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="inline-flex min-h-11 items-center rounded-md bg-rest px-6 text-sm font-bold text-white transition hover:bg-rest-deep disabled:opacity-60"
          >
            {submitting ? "提交中…" : "提交投票"}
          </button>
          {message && (
            <p
              className={`text-sm ${message.ok ? "text-rest" : "text-danger"}`}
              role="status"
            >
              {message.text}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-ink">当前薪资挡位分布</h2>
          <p className="text-xs text-haze">共 {stats.totals.salary} 票</p>
        </div>
        <div className="mt-4">
          {stats.totals.salary > 0 ? (
            <SalaryChart stats={stats} />
          ) : (
            <p className="py-10 text-center text-sm text-haze">
              还没有薪资投票，来做第一个。
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">每日工时分布</h2>
            <p className="text-xs text-haze">共 {stats.totals.work_hours} 票</p>
          </div>
          <div className="mt-6">
            {stats.totals.work_hours > 0 ? (
              <WorkHoursBars stats={stats} />
            ) : (
              <p className="py-10 text-center text-sm text-haze">
                还没有工时投票，来做第一个。
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">每周休息天数</h2>
            <p className="text-xs text-haze">共 {stats.totals.rest_days} 票</p>
          </div>
          <div className="mt-6">
            <RestPie stats={stats} />
          </div>
        </div>
      </div>

      {totalVotes > 0 && (
        <p className="text-center text-xs text-haze">
          已有 {totalVotes} 人参与 · 结果仅供娱乐与参考，不代表统计抽样 ·
          每人每个维度计一票（改票覆盖旧票）
        </p>
      )}
    </div>
  );
}
