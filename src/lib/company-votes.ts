import { getDb } from "@/lib/db";

export type CompanyVoteChoice = "real" | "fake";

export function isValidCompanyVoteChoice(v: unknown): v is CompanyVoteChoice {
  return v === "real" || v === "fake";
}

export type CompanyVoteStat = {
  real: number;
  fake: number;
};

/** 批量统计多企业的真/假票数（列表页一次查询） */
export function companyVoteStatsMap(
  companyIds: string[],
): Map<string, CompanyVoteStat> {
  const map = new Map<string, CompanyVoteStat>();
  for (const id of companyIds) map.set(id, { real: 0, fake: 0 });
  if (companyIds.length === 0) return map;
  try {
    const rows = getDb()
      .prepare(
        "SELECT companyId, choice, COUNT(*) AS n FROM company_votes GROUP BY companyId, choice",
      )
      .all() as { companyId: string; choice: string; n: number }[];
    for (const r of rows) {
      const stat = map.get(r.companyId);
      if (!stat) continue;
      if (r.choice === "real") stat.real = Number(r.n) || 0;
      else if (r.choice === "fake") stat.fake = Number(r.n) || 0;
    }
  } catch {
    // table not ready yet
  }
  return map;
}

export function companyVoteStat(companyId: string): CompanyVoteStat {
  return companyVoteStatsMap([companyId]).get(companyId)!;
}

/** 当前登录用户对某企业的已投票（未投返回 null） */
export function myCompanyVote(
  voterKey: string,
  companyId: string,
): CompanyVoteChoice | null {
  try {
    const row = getDb()
      .prepare(
        "SELECT choice FROM company_votes WHERE companyId = ? AND voterKey = ?",
      )
      .get(companyId, voterKey) as { choice: string } | undefined;
    if (!row) return null;
    return isValidCompanyVoteChoice(row.choice) ? row.choice : null;
  } catch {
    return null;
  }
}

/** 投票（改票覆盖），返回是否新建 */
export function castCompanyVote(
  voterKey: string,
  companyId: string,
  choice: CompanyVoteChoice,
): { ok: true; updated: boolean } | { ok: false; error: string } {
  const now = new Date().toISOString();
  const db = getDb();
  const existing = db
    .prepare(
      "SELECT choice FROM company_votes WHERE companyId = ? AND voterKey = ?",
    )
    .get(companyId, voterKey) as { choice: string } | undefined;
  db.prepare(
    `INSERT INTO company_votes (companyId, voterKey, choice, updatedAt)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(companyId, voterKey) DO UPDATE SET
       choice = excluded.choice, updatedAt = excluded.updatedAt`,
  ).run(companyId, voterKey, choice, now);
  return { ok: true, updated: existing ? existing.choice !== choice : false };
}
