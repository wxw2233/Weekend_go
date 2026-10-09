export type DayType = "holiday" | "workoff" | "weekend" | "workday";

export const HOLIDAY_YEAR = 2026;

export type HolidayRange = {
  name: string;
  /** "MM-DD" */
  start: string;
  /** "MM-DD" */
  end: string;
};

/**
 * 2026 年放假安排，来源：国务院办公厅《关于2026年部分节假日安排的通知》
 * （2025 年 11 月 4 日发布，新华社 / 人民网多源核实）
 * 每年 11 月更新次年安排时，只需修改本文件。
 */
export const HOLIDAY_RANGES: HolidayRange[] = [
  { name: "元旦", start: "01-01", end: "01-03" },
  { name: "春节", start: "02-15", end: "02-23" },
  { name: "清明节", start: "04-04", end: "04-06" },
  { name: "劳动节", start: "05-01", end: "05-05" },
  { name: "端午节", start: "06-19", end: "06-21" },
  { name: "中秋节", start: "09-25", end: "09-27" },
  { name: "国庆节", start: "10-01", end: "10-07" },
];

/** 调休补班日（周末上班） */
export const WORKOFF_DAYS: string[] = [
  "01-04",
  "02-14",
  "02-28",
  "05-09",
  "09-20",
  "10-10",
];

export const HOLIDAY_SOURCE =
  "国务院办公厅《关于2026年部分节假日安排的通知》（2025年11月4日发布）";

function md(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function dayInfo(date: Date): { type: DayType; holidayName?: string } {
  const key = md(date);
  for (const r of HOLIDAY_RANGES) {
    if (key >= r.start && key <= r.end) {
      return { type: "holiday", holidayName: r.name };
    }
  }
  if (WORKOFF_DAYS.includes(key)) return { type: "workoff" };
  const wd = date.getDay();
  if (wd === 0 || wd === 6) return { type: "weekend" };
  return { type: "workday" };
}

export function yearStats() {
  let holiday = 0;
  let workoff = 0;
  let weekend = 0;
  let workday = 0;
  for (let m = 0; m < 12; m++) {
    const days = new Date(HOLIDAY_YEAR, m + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const t = dayInfo(new Date(HOLIDAY_YEAR, m, d)).type;
      if (t === "holiday") holiday++;
      else if (t === "workoff") workoff++;
      else if (t === "weekend") weekend++;
      else workday++;
    }
  }
  return {
    holiday,
    workoff,
    weekend,
    workday,
    totalRest: holiday + weekend,
    totalDays: holiday + workoff + weekend + workday,
  };
}

function dateFromKey(year: number, key: string): Date {
  return new Date(year, Number(key.slice(0, 2)) - 1, Number(key.slice(3)));
}

export type NextHoliday = {
  name: string;
  date: Date;
  /** 距今天数；0 表示假期进行中 */
  days: number;
  /** true = 2027 年安排尚未发布，日期为公历固定日 */
  tentative: boolean;
};

export function nextHolidayInfo(now: Date = new Date()): NextHoliday {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // 假期进行中
  const key = md(today);
  const ongoing = HOLIDAY_RANGES.find(
    (r) => HOLIDAY_YEAR === today.getFullYear() && key >= r.start && key <= r.end,
  );
  if (ongoing) {
    return { name: ongoing.name, date: today, days: 0, tentative: false };
  }
  // 下一个尚未开始的假期
  for (const r of HOLIDAY_RANGES) {
    const start = dateFromKey(HOLIDAY_YEAR, r.start);
    if (start >= today) {
      return {
        name: r.name,
        date: start,
        days: Math.round((start.getTime() - today.getTime()) / 86400000),
        tentative: false,
      };
    }
  }
  // 2026 年假期已全部结束 → 次年元旦（公历固定日；2027 年安排通常 11 月发布）
  const ny = new Date(HOLIDAY_YEAR + 1, 0, 1);
  return {
    name: "元旦",
    date: ny,
    days: Math.round((ny.getTime() - today.getTime()) / 86400000),
    tentative: true,
  };
}

export function nextWorkoff(now: Date = new Date()): Date | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const candidates = WORKOFF_DAYS.map((k) => dateFromKey(HOLIDAY_YEAR, k))
    .filter((d) => d >= today)
    .sort((a, b) => a.getTime() - b.getTime());
  return candidates[0] ?? null;
}

export type MonthCell = {
  day: number;
  type: DayType;
  holidayName?: string;
};

export type MonthData = {
  label: string;
  /** 周一 = 0 … 周日 = 6 的前导空位数 */
  leadingBlanks: number;
  cells: MonthCell[];
};

export function monthData(month: number): MonthData {
  const first = new Date(HOLIDAY_YEAR, month, 1);
  const daysInMonth = new Date(HOLIDAY_YEAR, month + 1, 0).getDate();
  const cells: MonthCell[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(HOLIDAY_YEAR, month, d);
    const info = dayInfo(date);
    cells.push({
      day: d,
      type: info.type,
      holidayName: info.holidayName,
    });
  }
  return {
    label: `${month + 1} 月`,
    leadingBlanks: (first.getDay() + 6) % 7, // 周一开头
    cells,
  };
}
