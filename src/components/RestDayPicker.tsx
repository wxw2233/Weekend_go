"use client";

import { useEffect } from "react";
import type { RestType } from "@/lib/types";
import {
  WEEK_LABELS,
  defaultDaysForRestType,
  maxDaysForRestType,
} from "@/lib/rest-days";

type Props = {
  restType: RestType;
  value: number[];
  onChange: (days: number[]) => void;
};

export default function RestDayPicker({ restType, value, onChange }: Props) {
  const disabled = restType === "不休";
  const max = maxDaysForRestType(restType);

  useEffect(() => {
    if (restType === "不休") {
      if (value.length) onChange([]);
      return;
    }
    if (value.length === 0) {
      onChange(defaultDaysForRestType(restType));
      return;
    }
    // clamp if type changed and current selection exceeds max
    if (max !== null && value.length > max) {
      onChange(value.slice(0, max));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restType]);

  function toggle(index: number) {
    if (disabled) return;
    if (value.includes(index)) {
      onChange(value.filter((d) => d !== index));
      return;
    }
    if (max !== null && value.length >= max) {
      onChange(max === 1 ? [index] : [value[0]!, index].filter((v, i, a) => a.indexOf(v) === i).slice(0, max));
      return;
    }
    onChange([...value, index].sort((a, b) => a - b));
  }

  return (
    <div>
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="选择每周休息日"
      >
        {WEEK_LABELS.map((d, i) => {
          const on = value.includes(i);
          return (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => toggle(i)}
              aria-pressed={on}
              className={[
                "flex h-10 w-10 items-center justify-center rounded-md font-mono text-sm font-bold transition sm:h-11 sm:w-11",
                disabled
                  ? "cursor-not-allowed bg-[#EDE8DC] text-haze opacity-60"
                  : on
                    ? "bg-rest text-white shadow-sm"
                    : "bg-[#EDE8DC] text-haze hover:bg-rest-soft hover:text-rest-deep",
              ].join(" ")}
            >
              {d}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-haze">
        {disabled
          ? "该类型无需选择具体休息日"
          : restType === "双休"
            ? "正好选择 2 天（可轮休，不限周六周日）"
            : restType === "单休"
              ? "只能选择 1 天"
              : restType === "大小周"
                ? "选择 1 天代表休息日"
                : restType === "排班制"
                  ? "可多选可能休息的日子"
                  : "点选每周休息日"}
      </p>
    </div>
  );
}
