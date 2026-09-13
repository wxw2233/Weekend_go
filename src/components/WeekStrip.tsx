import { restLevel, type RestType } from "@/lib/types";
import { WEEK_LABELS } from "@/lib/rest-days";

type Props = {
  restType: string;
  restDays?: number[] | null;
  compact?: boolean;
};

function litDays(restType: RestType, restDays?: number[] | null): boolean[] {
  const arr = Array.from({ length: 7 }, () => false);
  if (restDays && restDays.length > 0) {
    for (const d of restDays) {
      if (d >= 0 && d <= 6) arr[d] = true;
    }
    return arr;
  }
  switch (restType) {
    case "双休":
      arr[2] = true;
      arr[5] = true;
      return arr;
    case "大小周":
    case "单休":
      arr[6] = true;
      return arr;
    case "排班制":
      arr[1] = true;
      arr[4] = true;
      return arr;
    case "不休":
    default:
      return arr;
  }
}

const levelDay: Record<string, string> = {
  green: "bg-rest text-white",
  yellow: "bg-caution text-white",
  red: "bg-danger text-white",
  gray: "bg-[#EDE8DC] text-haze",
};

const levelOff: Record<string, string> = {
  green: "bg-rest-soft/70 text-rest-deep",
  yellow: "bg-caution-soft text-caution",
  red: "bg-danger-soft text-danger",
  gray: "bg-[#EDE8DC] text-haze",
};

export default function WeekStrip({
  restType,
  restDays,
  compact = false,
}: Props) {
  const type = restType as RestType;
  const lit = litDays(type, restDays);
  const level = restLevel(type, restDays);
  const daySize = compact
    ? "h-7 w-7 text-[10px] sm:h-8 sm:w-8 sm:text-[11px]"
    : "h-10 w-10 text-xs sm:h-12 sm:w-12 sm:text-sm";

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      role="img"
      aria-label={`休息制度：${restType}（一周休息天数示意）`}
    >
      {WEEK_LABELS.map((d, i) => {
        const on = lit[i];
        return (
          <div
            key={d}
            className={[
              daySize,
              "flex items-center justify-center rounded-md font-mono font-bold",
              on ? levelDay[level] : levelOff[level],
            ].join(" ")}
          >
            {d}
          </div>
        );
      })}
    </div>
  );
}
