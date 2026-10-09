"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DIMENSION_LABEL,
  POLL_DIMENSIONS,
  POLL_OPTIONS,
  type PollAnswers,
  type PollDimension,
  type PollOption,
} from "@/lib/poll-options";
import type { PollStats } from "@/lib/poll";

type Props = { initialStats: PollStats; isLoggedIn: boolean };

/* ---------- 每个维度的主题色 ---------- */

const THEME: Record<PollDimension, { base: string; ramp: string[] }> = {
  work_hours: { base: "#1F6B4A", ramp: ["#BFDCCB", "#7FB894", "#3F8A62", "#1F6B4A"] },
  salary: {
    base: "#A85C12",
    ramp: [
      "#F2E3C4",
      "#E8CD9A",
      "#DFB772",
      "#D6A14E",
      "#CC8B2E",
      "#BC7A1D",
      "#A85C12",
      "#8A4B0E",
      "#6B3A0A",
    ],
  },
  rest_days: { base: "#2F6B8F", ramp: ["#C9E2ED", "#93C3D8", "#5A97B4", "#2F6B8F"] },
};

const GRID = "#CFC8B8";
const TXT = "#5F6A64";

const DIM_DESC: Record<PollDimension, string> = {
  work_hours: "每天实际工作多少小时（含加班，不含午休）",
  salary: "当前税前月薪大致落在哪一挡",
  rest_days: "按公司制度平均每周休息几天",
};

const X_CAPTION: Record<PollDimension, string> = {
  work_hours: "每日工作时长（小时）",
  salary: "月薪挡位（元）",
  rest_days: "每周休息天数",
};

/* ---------- 工具 ---------- */

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

/** 饼图分组：挡位多时聚合，避免碎片化 */
function salaryRange(lo: number, hi: number): string[] {
  const keys: string[] = [];
  for (let v = lo; v < hi; v += 500) keys.push(`s${v}`);
  return keys;
}

const PIE_GROUPS: Record<PollDimension, { label: string; keys: string[] }[]> = {
  work_hours: [
    { label: "≤7 小时", keys: ["le7"] },
    { label: "7.5–9 小时", keys: ["h75", "h8", "h85", "h9"] },
    { label: "9.5–11 小时", keys: ["h95", "h10", "h105", "h11"] },
    { label: "≥11.5 小时", keys: ["h115", "ge12"] },
  ],
  salary: [
    { label: "3k 以下", keys: ["le2999"] },
    { label: "3k–5k", keys: salaryRange(3000, 5000) },
    { label: "5k–8k", keys: salaryRange(5000, 8000) },
    { label: "8k–12k", keys: salaryRange(8000, 12000) },
    { label: "12k–16k", keys: salaryRange(12000, 16000) },
    { label: "16k–20k", keys: salaryRange(16000, 20000) },
    { label: "20k–25k", keys: salaryRange(20000, 25000) },
    { label: "25k–30k", keys: salaryRange(25000, 30000) },
    { label: "30k 及以上", keys: ["ge30000"] },
  ],
  rest_days: [
    { label: "≤1 天（单休及更少）", keys: ["le1"] },
    { label: "1.5 天（大小周）", keys: ["r15"] },
    { label: "2 天（双休）", keys: ["r2"] },
    { label: "≥3 天", keys: ["ge3"] },
  ],
};

/** 柱状图 / 折线图共用 X 轴刻度 */
function xTicks(
  dim: PollDimension,
  options: PollOption[],
): { i: number; label: string }[] {
  const ticks: { i: number; label: string }[] = [];
  options.forEach((o, i) => {
    if (dim === "salary") {
      if (o.key === "le2999") ticks.push({ i, label: "<3k" });
      const m = o.key.match(/^s(\d+)$/);
      if (m && Number(m[1]) % 5000 === 0) {
        ticks.push({ i, label: `${Number(m[1]) / 1000}k` });
      }
      if (o.key === "ge30000") ticks.push({ i, label: "30k+" });
    } else if (dim === "work_hours") {
      ticks.push({
        i,
        label:
          o.key === "le7" ? "≤7" : o.key === "ge12" ? "12+" : o.key.slice(1),
      });
    } else {
      ticks.push({
        i,
        label:
          o.key === "le1"
            ? "≤1天"
            : o.key === "r15"
              ? "1.5天"
              : o.key === "r2"
                ? "2天"
                : "≥3天",
      });
    }
  });
  return ticks;
}

function Empty({ text = "还没有投票，来做第一个。" }: { text?: string }) {
  return <p className="py-10 text-center text-sm text-haze">{text}</p>;
}

/* ---------- 图 1：柱状图（票数分布） ---------- */

function BarChart({ dim, stats }: { dim: PollDimension; stats: PollStats }) {
  const options = POLL_OPTIONS[dim];
  const counts = stats.counts[dim];
  const total = stats.totals[dim];
  const W = 720;
  const H = 235;
  const left = 40;
  const right = W - 14;
  const top = 24;
  const bottom = 196;
  const plotW = right - left;
  const plotH = bottom - top;
  const maxCount = Math.max(1, ...options.map((o) => counts[o.key] ?? 0));
  const color = THEME[dim].base;
  const ticks = xTicks(dim, options);

  if (total === 0) return <Empty />;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`${DIMENSION_LABEL[dim]}票数分布柱状图`}
    >
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={left}
          x2={right}
          y1={bottom - f * plotH}
          y2={bottom - f * plotH}
          stroke={GRID}
          strokeOpacity="0.4"
          strokeWidth="0.5"
        />
      ))}
      <line x1={left} x2={right} y1={bottom} y2={bottom} stroke={GRID} strokeWidth="1" />
      <line x1={left} x2={left} y1={top - 6} y2={bottom} stroke={GRID} strokeWidth="1" />

      {options.map((o, i) => {
        const c = counts[o.key] ?? 0;
        const h = (c / maxCount) * plotH;
        const slot = plotW / options.length;
        const bw = Math.min(slot * 0.62, 64);
        const x = left + i * slot + (slot - bw) / 2;
        return (
          <g key={o.key}>
            <rect
              x={x}
              y={bottom - h}
              width={bw}
              height={c > 0 ? h : 0.5}
              rx={1.5}
              fill={c > 0 ? color : GRID}
              opacity={c > 0 ? 0.92 : 0.5}
            >
              <title>{`${o.label}：${c} 票（${pct(c, total)}）`}</title>
            </rect>
            {c > 0 && (
              <text
                x={x + bw / 2}
                y={bottom - h - 4}
                fontSize="9.5"
                fill={TXT}
                textAnchor="middle"
              >
                {pct(c, total)}
              </text>
            )}
          </g>
        );
      })}

      {ticks.map((t) => {
        const x = left + (t.i + 0.5) * (plotW / options.length);
        return (
          <text
            key={`${t.i}-${t.label}`}
            x={x}
            y={bottom + 15}
            fontSize="11"
            fill={TXT}
            textAnchor="middle"
          >
            {t.label}
          </text>
        );
      })}
      <text x={left - 6} y={top + 4} fontSize="11" fill={TXT} textAnchor="end">
        {maxCount}
      </text>
      <text x={left - 6} y={bottom + 4} fontSize="11" fill={TXT} textAnchor="end">
        0
      </text>
      <text x={W / 2} y={H - 4} fontSize="11" fill={TXT} textAnchor="middle">
        {X_CAPTION[dim]} · 柱上为占比，悬停看票数
      </text>
    </svg>
  );
}

/* ---------- 图 2：饼图（占比构成） ---------- */

function DonutChart({ dim, stats }: { dim: PollDimension; stats: PollStats }) {
  const counts = stats.counts[dim];
  const total = stats.totals[dim];
  const cx = 100;
  const cy = 100;
  const r = 78;
  let angle = 0;
  const slices = PIE_GROUPS[dim].map((g, i) => {
    const c = g.keys.reduce((s, k) => s + (counts[k] ?? 0), 0);
    const sweep = total > 0 ? (c / total) * 360 : 0;
    const path =
      total > 0 && c > 0
        ? pieSlice(cx, cy, r, angle, angle + Math.min(sweep, 359.99))
        : "";
    angle += sweep;
    return {
      label: g.label,
      c,
      path,
      color: THEME[dim].ramp[i % THEME[dim].ramp.length],
    };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <svg
        viewBox="0 0 200 200"
        className="w-44 shrink-0"
        role="img"
        aria-label={`${DIMENSION_LABEL[dim]}占比饼图`}
      >
        <circle cx={cx} cy={cy} r={r} fill="#F1EFE8" stroke={GRID} strokeWidth="0.5" />
        {slices.map(
          (s) =>
            s.c > 0 && (
              <path
                key={s.label}
                d={s.path}
                fill={s.color}
                stroke="#FFFFFF"
                strokeWidth="1"
              >
                <title>{`${s.label}：${s.c} 票（${pct(s.c, total)}）`}</title>
              </path>
            ),
        )}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="#FFFFFF" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="600" fill="#0F1A14">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill={TXT}>
          票
        </text>
      </svg>
      <ul className="w-full space-y-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="flex-1 text-ink">{s.label}</span>
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

/* ---------- 图 3：折线图（累计占比） ---------- */

function CumulativeLine({
  dim,
  stats,
}: {
  dim: PollDimension;
  stats: PollStats;
}) {
  const options = POLL_OPTIONS[dim];
  const counts = stats.counts[dim];
  const total = stats.totals[dim];
  const W = 720;
  const H = 235;
  const left = 46;
  const right = W - 14;
  const top = 24;
  const bottom = 196;
  const plotW = right - left;
  const plotH = bottom - top;
  const color = THEME[dim].base;
  const ticks = xTicks(dim, options);

  if (total === 0) return <Empty text="还没有投票，暂无累计占比。" />;

  let cum = 0;
  const pts = options.map((o, i) => {
    cum += counts[o.key] ?? 0;
    return {
      x: left + (i + 0.5) * (plotW / options.length),
      y: bottom - (cum / total) * plotH,
      cum,
      label: o.label,
    };
  });
  const last = pts[pts.length - 1];
  const area =
    `M ${pts[0].x.toFixed(1)} ${bottom} ` +
    pts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
    ` L ${last.x.toFixed(1)} ${bottom} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`${DIMENSION_LABEL[dim]}累计占比折线图`}
    >
      {[0.25, 0.5, 0.75].map((f) => (
        <g key={f}>
          <line
            x1={left}
            x2={right}
            y1={bottom - f * plotH}
            y2={bottom - f * plotH}
            stroke={GRID}
            strokeOpacity="0.4"
            strokeWidth="0.5"
          />
          <text
            x={left - 6}
            y={bottom - f * plotH + 3.5}
            fontSize="10"
            fill={TXT}
            textAnchor="end"
          >
            {f * 100}%
          </text>
        </g>
      ))}
      <line x1={left} x2={right} y1={bottom} y2={bottom} stroke={GRID} strokeWidth="1" />
      <line x1={left} x2={right} y1={top} y2={top} stroke={GRID} strokeOpacity="0.4" strokeWidth="0.5" />
      <text x={left - 6} y={top + 3.5} fontSize="10" fill={TXT} textAnchor="end">
        100%
      </text>

      <path d={area} fill={color} opacity="0.12" />
      <polyline
        points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2.4" fill={color}>
          <title>{`${p.label}：累计 ${pct(p.cum, total)}`}</title>
        </circle>
      ))}

      {ticks.map((t) => {
        const x = left + (t.i + 0.5) * (plotW / options.length);
        return (
          <text
            key={`${t.i}-${t.label}`}
            x={x}
            y={bottom + 15}
            fontSize="11"
            fill={TXT}
            textAnchor="middle"
          >
            {t.label}
          </text>
        );
      })}
      <text x={W / 2} y={H - 4} fontSize="11" fill={TXT} textAnchor="middle">
        按挡位由低到高累计 · 最右端为 100%
      </text>
    </svg>
  );
}

/* ---------- 单个维度板块：投票 + 三图 ---------- */

type SectionProps = {
  dim: PollDimension;
  index: number;
  stats: PollStats;
  isLoggedIn: boolean;
  choice?: string;
  myVote?: string;
  busy: boolean;
  msg: { ok: boolean; text: string } | null;
  onSelect: (key: string) => void;
  onSubmit: () => void;
};

function DimensionSection({
  dim,
  index,
  stats,
  isLoggedIn,
  choice,
  myVote,
  busy,
  msg,
  onSelect,
  onSubmit,
}: SectionProps) {
  const theme = THEME[dim];
  const total = stats.totals[dim];
  const myLabel = myVote
    ? POLL_OPTIONS[dim].find((o) => o.key === myVote)?.label
    : undefined;

  return (
    <section className="rounded-lg border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: theme.base }}
          />
          {index + 1}. {DIMENSION_LABEL[dim]}
          <span className="text-xs font-normal text-haze">共 {total} 票</span>
        </h2>
        {myLabel && (
          <span className="rounded-full bg-rest-soft/60 px-2.5 py-1 text-xs font-semibold text-rest">
            你已投：{myLabel}
          </span>
        )}
      </div>

      {isLoggedIn ? (
        <>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              value={choice ?? ""}
              onChange={(e) => onSelect(e.target.value)}
              className="w-full flex-1 rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-rest focus:outline-none"
              aria-label={DIMENSION_LABEL[dim]}
            >
              <option value="">请选择…</option>
              {POLL_OPTIONS[dim].map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onSubmit}
              disabled={busy || !choice}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md px-6 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: theme.base }}
            >
              {busy ? "提交中…" : myVote ? "更新投票" : "投一票"}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-haze">
            {DIM_DESC[dim]} ·{" "}
            {myVote ? "重新选择挡位并提交即可修改" : "选择挡位后点击按钮提交"}
          </p>
          {msg && (
            <p
              className={`mt-1 text-sm ${msg.ok ? "text-rest" : "text-danger"}`}
              role="status"
            >
              {msg.text}
            </p>
          )}
        </>
      ) : (
        <div className="mt-4 flex flex-col items-start gap-2.5 rounded-md border border-dashed border-line bg-rest-soft/40 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-ink/85">
            {DIM_DESC[dim]}——<span className="font-semibold">登录后即可参与本板块投票</span>
            ，展示结果只统计挡位，不显示你的身份。
          </p>
          <Link
            href="/login?next=%2Fpoll"
            className="inline-flex min-h-10 shrink-0 items-center rounded-md px-5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: theme.base }}
          >
            登录 / 注册
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-md border border-line/70 p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-ink">票数分布 · 柱状图</h3>
          <div className="mt-3">
            <BarChart dim={dim} stats={stats} />
          </div>
        </div>
        <div className="rounded-md border border-line/70 p-4">
          <h3 className="text-sm font-semibold text-ink">占比构成 · 饼图</h3>
          <div className="mt-4">
            <DonutChart dim={dim} stats={stats} />
          </div>
        </div>
        <div className="rounded-md border border-line/70 p-4">
          <h3 className="text-sm font-semibold text-ink">累计占比 · 折线图</h3>
          <div className="mt-3">
            <CumulativeLine dim={dim} stats={stats} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 主组件 ---------- */

export default function PollBoard({ initialStats, isLoggedIn }: Props) {
  const [stats, setStats] = useState<PollStats>(initialStats);
  const [choices, setChoices] = useState<PollAnswers>({});
  const [myVotes, setMyVotes] = useState<PollAnswers>({});
  const [busy, setBusy] = useState<PollDimension | null>(null);
  const [msgs, setMsgs] = useState<
    Partial<Record<PollDimension, { ok: boolean; text: string }>>
  >({});

  useEffect(() => {
    if (!isLoggedIn) return;
    let alive = true;
    fetch("/api/poll/mine", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d?.ok || !d.votes) return;
        setMyVotes(d.votes);
        setChoices((p) => ({ ...p, ...d.votes }));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isLoggedIn]);

  async function submitOne(dim: PollDimension) {
    const key = choices[dim];
    if (!key) {
      setMsgs((p) => ({ ...p, [dim]: { ok: false, text: "请先选择一个挡位" } }));
      return;
    }
    setBusy(dim);
    setMsgs((p) => ({ ...p, [dim]: null }));
    try {
      const res = await fetch("/api/poll/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ answers: { [dim]: key } }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsgs((p) => ({
          ...p,
          [dim]: { ok: false, text: data.error || "提交失败，请稍后再试" },
        }));
      } else {
        setStats(data.stats);
        const isUpdate = Boolean(myVotes[dim]);
        setMyVotes((p) => ({ ...p, [dim]: key }));
        setMsgs((p) => ({
          ...p,
          [dim]: {
            ok: true,
            text: isUpdate ? "已更新你的投票！" : "已记录，感谢参与！可随时改票。",
          },
        }));
      }
    } catch {
      setMsgs((p) => ({ ...p, [dim]: { ok: false, text: "网络异常，请稍后再试" } }));
    } finally {
      setBusy(null);
    }
  }

  const participants = Math.max(
    stats.totals.work_hours,
    stats.totals.salary,
    stats.totals.rest_days,
  );

  return (
    <div className="space-y-6">
      <p className="rounded-md bg-rest-soft/50 px-4 py-2.5 text-center text-xs leading-5 text-ink/80">
        投票需登录，浏览无需登录 · 匿名展示，不收集任何个人身份信息 ·
        三个板块各自独立计票，每个板块一票，可随时修改
      </p>

      {POLL_DIMENSIONS.map((dim, i) => (
        <DimensionSection
          key={dim}
          dim={dim}
          index={i}
          stats={stats}
          isLoggedIn={isLoggedIn}
          choice={choices[dim]}
          myVote={myVotes[dim]}
          busy={busy === dim}
          msg={msgs[dim] ?? null}
          onSelect={(key) => setChoices((p) => ({ ...p, [dim]: key }))}
          onSubmit={() => submitOne(dim)}
        />
      ))}

      {participants > 0 && (
        <p className="text-center text-xs text-haze">
          已有约 {participants} 人参与 · 结果仅供娱乐与参考，不代表统计抽样 ·
          每人每个板块计一票（改票覆盖旧票）
        </p>
      )}
    </div>
  );
}
