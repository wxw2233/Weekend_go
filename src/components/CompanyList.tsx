"use client";

import { useEffect, useMemo, useState } from "react";
import type { Company } from "@/lib/types";
import type { CompanyVoteStat } from "@/lib/company-votes";
import CompanyRow from "@/components/CompanyRow";

const PAGE_SIZE = 8;

export default function CompanyList({
  companies,
  votes,
}: {
  companies: Company[];
  votes?: Record<string, CompanyVoteStat>;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(companies.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [companies]);

  const current = Math.min(page, totalPages);
  const visible = useMemo(
    () => companies.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [companies, current],
  );

  return (
    <div>
      <ul className="mt-3 grid gap-2.5 sm:mt-4 sm:grid-cols-2 sm:gap-3">
        {visible.map((c) => (
          <li key={c.id}>
            <CompanyRow company={c} votes={votes?.[c.id]} />
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <nav
          className="mt-5 flex flex-wrap items-center justify-center gap-2"
          aria-label="分页"
        >
          <button
            type="button"
            className="btn-ghost !min-h-10 px-3"
            disabled={current <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </button>
          <span className="min-h-10 px-2 text-sm font-medium text-haze">
            {current} / {totalPages}
          </span>
          <button
            type="button"
            className="btn-ghost !min-h-10 px-3"
            disabled={current >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            下一页
          </button>
        </nav>
      )}
    </div>
  );
}
