import type { Metadata } from "next";
import {
  HOLIDAY_SOURCE,
  HOLIDAY_YEAR,
  monthData,
  nextHolidayInfo,
  nextWorkoff,
  yearStats,
  type DayType,
} from "@/lib/holidays";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "休息日历 · 全年放假调休一图看清",
  description: `${HOLIDAY_YEAR} 年法定节假日、调休补班、周末安排日历热力图，下一个假期倒计时与全年休息构成统计。`,
};

const CELL_CLASS: Record<DayType, string> = {
  holiday: "bg-[#E24B4A]",
  workoff: "bg-caution",
  weekend: "bg-rest-soft",
  workday: "border border-line bg-white",
};

const TYPE_LABEL: Record<DayType, string> = {
  holiday: "法定放假",
  workoff: "调休补班",
  weekend: "周末",
  workday: "工作日",
};

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

function fmtDate(d: Date): string {
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

function fmtWeekday(d: Date): string {
  return `周${"日一二三四五六"[d.getDay()]}`;
}

export default function HolidayPage() {
  const stats = yearStats();
  const next = nextHolidayInfo();
  const nextWorkoffDay = nextWorkoff();
  const months = Array.from({ length: 12 }, (_, i) => monthData(i));

  const bars: { type: DayType; count: number }[] = [
    { type: "holiday", count: stats.holiday },
    { type: "workoff", count: stats.workoff },
    { type: "weekend", count: stats.weekend },
    { type: "workday", count: stats.workday },
  ];

  return (
    <>
      {/* 区块 1 · 倒计时横幅 */}
      <section className="border-b border-line bg-rest-deep">
        <div className="container-page py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rest-soft">
            Holiday Calendar
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
            休息日历 · {HOLIDAY_YEAR}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-rest-soft sm:text-base">
            全年放假、调休补班、周末安排一图看清。
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-white px-5 py-3 text-center">
                <p className="text-4xl font-bold leading-none text-rest-deep sm:text-5xl">
                  {next.days === 0 ? "今天" : next.days}
                </p>
                {next.days !== 0 && (
                  <p className="mt-1 text-xs font-semibold text-haze">天</p>
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {next.days === 0
                    ? `${next.name}假期进行中`
                    : `距离${next.name}还有 ${next.days} 天`}
                </p>
                <p className="mt-1 text-sm text-rest-soft">
                  {fmtDate(next.date)} · {fmtWeekday(next.date)}
                  {next.tentative && "（次年安排以官方通知为准）"}
                </p>
              </div>
            </div>
            {nextWorkoffDay && (
              <div className="rounded-lg border border-white/30 px-3.5 py-2 text-sm text-white">
                <span className="font-semibold text-[#F6C05C]">
                  调休提醒：
                </span>
                {fmtDate(nextWorkoffDay)}（{fmtWeekday(nextWorkoffDay)}
                ）上班
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 区块 2 · 全年日历热力图 */}
      <section className="container-page py-10 sm:py-12">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold text-ink">全年日历</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-haze">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-[#E24B4A]" />
              法定放假
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-caution" />
              调休补班
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-rest-soft" />
              周末
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border border-line bg-white" />
              工作日
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {months.map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-line bg-white p-4"
            >
              <h3 className="text-sm font-bold text-ink">{m.label}</h3>
              <div className="mt-2 grid grid-cols-7 gap-x-[3px] gap-y-[3px]">
                {WEEKDAYS.map((w) => (
                  <span
                    key={w}
                    className="flex h-5 items-center justify-center text-[10px] text-haze"
                  >
                    {w}
                  </span>
                ))}
                {Array.from({ length: m.leadingBlanks }).map((_, i) => (
                  <span key={`b${i}`} />
                ))}
                {m.cells.map((c) => (
                  <span
                    key={c.day}
                    title={`${m.label.replace(" ", "")}${c.day} 日 · ${
                      c.holidayName ?? TYPE_LABEL[c.type]
                    }`}
                    className={`flex h-5 w-full items-center justify-center rounded-sm text-[10px] leading-none ${CELL_CLASS[c.type]} ${
                      c.type === "holiday" || c.type === "workoff"
                        ? "font-semibold text-white"
                        : "text-haze"
                    }`}
                  >
                    {c.day}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 区块 3 · 全年休息构成 */}
      <section className="container-page pb-12">
        <div className="rounded-lg border border-line bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">全年休息构成</h2>
            <p className="text-sm text-haze">
              全年共休{" "}
              <span className="font-bold text-rest">{stats.totalRest}</span> 天
              （{stats.holiday} 天法定假 + {stats.weekend} 天周末），另有{" "}
              {stats.workoff} 个周末调休上班
            </p>
          </div>
          <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full">
            {bars.map(
              (b) =>
                b.count > 0 && (
                  <div
                    key={b.type}
                    style={{ flexGrow: b.count }}
                    title={`${TYPE_LABEL[b.type]}：${b.count} 天`}
                    className={`h-full ${
                      b.type === "holiday"
                        ? "bg-[#E24B4A]"
                        : b.type === "workoff"
                          ? "bg-caution"
                          : b.type === "weekend"
                            ? "bg-rest-soft"
                            : "bg-panel"
                    }`}
                  />
                ),
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-haze">
            {bars.map((b) => (
              <span key={b.type} className="inline-flex items-center gap-1.5">
                <span
                  className={`inline-block h-3 w-3 rounded-sm ${
                    b.type === "holiday"
                      ? "bg-[#E24B4A]"
                      : b.type === "workoff"
                        ? "bg-caution"
                        : b.type === "weekend"
                          ? "bg-rest-soft"
                          : "bg-panel"
                  }`}
                />
                {TYPE_LABEL[b.type]} {b.count} 天
              </span>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-haze">
          数据来源：{HOLIDAY_SOURCE}。以官方最新通知为准；次年安排通常于每年
          11 月发布，届时本页将同步更新。
        </p>
      </section>
    </>
  );
}
