import type { RestType, SourceType } from "@/lib/types";
import { SOURCE_LABEL } from "@/lib/types";

const restStyles: Record<string, string> = {
  双休: "bg-rest text-white",
  大小周: "bg-caution text-white",
  单休: "bg-caution text-white",
  排班制: "bg-caution-soft text-caution",
  不休: "bg-danger text-white",
};

const sourceStyles: Record<string, string> = {
  certified: "bg-rest-soft text-rest-deep",
  seed_jd: "bg-[#EDE8DC] text-ink",
  user: "bg-white text-haze border border-line",
  pending: "bg-[#EDE8DC] text-haze",
};

export function RestBadge({ restType }: { restType: RestType }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-1 font-mono text-xs font-bold ${restStyles[restType] || "bg-[#EDE8DC] text-haze"}`}
    >
      {restType}
    </span>
  );
}

export function SourceBadge({ source }: { source: SourceType }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-bold ${sourceStyles[source]}`}
    >
      {SOURCE_LABEL[source]}
    </span>
  );
}
