"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Props = {
  cities: string[];
  restTypes: string[];
};

export default function FilterBar({ cities, restTypes }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const rest = searchParams.get("rest") || "全部";
  const city = searchParams.get("city") || "全部";
  const sort = searchParams.get("sort") || "default";

  const apply = useCallback(
    (next: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(next).forEach(([k, v]) => {
        if (!v || v === "全部") params.delete(k);
        else params.set(k, v);
      });
      const qs = params.toString();
      router.push(qs ? `/sx?${qs}` : "/sx");    },
    [router, searchParams],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      const current = searchParams.get("q") || "";
      if (q !== current) apply({ q });
    }, 300);
    return () => clearTimeout(t);
  }, [q, apply, searchParams]);

  return (
    <div className="grid gap-2 rounded-lg border border-line bg-white p-2.5 sm:grid-cols-[1.6fr_1fr_1fr_1fr] sm:gap-3 sm:p-3">
      <input
        className="field"
        placeholder="企业 / 行业 / 城市"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="搜索"
        type="search"
        enterKeyHint="search"
      />
      <div className="grid grid-cols-2 gap-2 sm:contents">
        <select
          className="field"
          value={rest}
          onChange={(e) => apply({ rest: e.target.value })}
          aria-label="休息制度"
        >
          <option>全部</option>
          {restTypes.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select
          className="field"
          value={city}
          onChange={(e) => apply({ city: e.target.value })}
          aria-label="城市"
        >
          <option>全部</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          className="field col-span-2 sm:col-span-1"
          value={sort}
          onChange={(e) => apply({ sort: e.target.value === "default" ? "" : e.target.value })}
          aria-label="排序"
        >
          <option value="default">默认排序</option>
          <option value="comments">评论最多</option>
          <option value="trust">真实度最高</option>
        </select>
      </div>
    </div>
  );
}
