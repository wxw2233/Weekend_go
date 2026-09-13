import type { RestType } from "@/lib/types";

export const WEEK_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

export function defaultDaysForRestType(restType: RestType): number[] {
  switch (restType) {
    case "双休":
      return [2, 5];
    case "大小周":
    case "单休":
    case "排班制":
      return [6];
    case "不休":
      return [];
    default:
      return [];
  }
}

/** Exactly-2 for dual; 1 for single/size-week; free for shift. */
export function maxDaysForRestType(restType: RestType): number | null {
  switch (restType) {
    case "双休":
      return 2;
    case "大小周":
    case "单休":
      return 1;
    case "排班制":
      return 7;
    case "不休":
      return 0;
    default:
      return null;
  }
}

export function validateRestDays(
  restType: RestType,
  days: number[],
): string | null {
  if (restType === "不休") return null;
  if (new Set(days).size !== days.length) {
    return "休息日不能重复选择";
  }
  if (days.length === 0) {
    return restType === "双休"
      ? "请选择每周休息的 2 天"
      : "请点选每周休息日";
  }
  if (restType === "双休" && days.length !== 2) {
    return "双休请正好选择 2 天";
  }
  if (restType === "单休" && days.length !== 1) {
    return "单休请选择 1 天";
  }
  if (restType === "大小周" && days.length !== 1) {
    return "大小周请点选 1 天代表休息日";
  }
  return null;
}

export function parseRestDays(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const days = raw
    .map((n) => Number(n))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  return Array.from(new Set(days));
}

export function formatRestDays(days?: number[]): string {
  if (!days || days.length === 0) return "";
  return days.map((d) => WEEK_LABELS[d] ?? "").filter(Boolean).join("、");
}

/** Prefer explicit restDays; otherwise fall back to type defaults. */
export function effectiveRestDays(
  restType: RestType,
  restDays?: number[] | null,
): number[] {
  if (restDays && restDays.length > 0) return restDays;
  return defaultDaysForRestType(restType);
}
