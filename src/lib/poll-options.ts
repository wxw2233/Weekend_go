export type PollDimension = "work_hours" | "salary" | "rest_days";

export type PollOption = {
  key: string;
  label: string;
};

export const POLL_DIMENSIONS: PollDimension[] = [
  "work_hours",
  "salary",
  "rest_days",
];

export const DIMENSION_LABEL: Record<PollDimension, string> = {
  work_hours: "平均每日工作时间",
  salary: "当前薪资挡位",
  rest_days: "休息制度",
};

/** 每日实际工作时长（含加班） */
export const WORK_HOURS_OPTIONS: PollOption[] = [
  { key: "le7", label: "7 小时及以内" },
  { key: "h75", label: "7.5 小时" },
  { key: "h8", label: "8 小时" },
  { key: "h85", label: "8.5 小时" },
  { key: "h9", label: "9 小时" },
  { key: "h95", label: "9.5 小时" },
  { key: "h10", label: "10 小时" },
  { key: "h105", label: "10.5 小时" },
  { key: "h11", label: "11 小时" },
  { key: "h115", label: "11.5 小时" },
  { key: "ge12", label: "12 小时及以上" },
];

/** 月薪挡位：3000–30000 每 500 元一挡，两端开口 */
export const SALARY_OPTIONS: PollOption[] = [
  { key: "le2999", label: "月薪 3000 以下" },
  ...Array.from({ length: 54 }, (_, i) => {
    const lo = 3000 + i * 500;
    return {
      key: `s${lo}`,
      label: `月薪 ${lo.toLocaleString("zh-CN")}–${(lo + 499).toLocaleString("zh-CN")}`,
    };
  }),
  { key: "ge30000", label: "月薪 30,000 及以上" },
];

/** 每周休息天数 */
export const REST_DAYS_OPTIONS: PollOption[] = [
  { key: "le1", label: "每周休 ≤1 天（单休及更少）" },
  { key: "r15", label: "每周休 1.5 天（大小周）" },
  { key: "r2", label: "每周休 2 天（双休）" },
  { key: "ge3", label: "每周休 ≥3 天" },
];

export const POLL_OPTIONS: Record<PollDimension, PollOption[]> = {
  work_hours: WORK_HOURS_OPTIONS,
  salary: SALARY_OPTIONS,
  rest_days: REST_DAYS_OPTIONS,
};

export function isValidChoice(dimension: PollDimension, choice: string): boolean {
  return POLL_OPTIONS[dimension].some((o) => o.key === choice);
}

export type PollAnswers = Partial<Record<PollDimension, string>>;
