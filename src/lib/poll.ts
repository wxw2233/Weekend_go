import { createHash } from "crypto";
import { getDb } from "@/lib/db";
import {
  POLL_DIMENSIONS,
  POLL_OPTIONS,
  isValidChoice,
  type PollAnswers,
  type PollDimension,
} from "@/lib/poll-options";

export function voterKeyFromIp(ip: string): string {
  return createHash("sha256")
    .update(`sx-poll:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

export type PollStats = {
  totals: Record<PollDimension, number>;
  counts: Record<PollDimension, Record<string, number>>;
};

const emptyStats = (): PollStats => ({
  totals: { work_hours: 0, salary: 0, rest_days: 0 },
  counts: { work_hours: {}, salary: {}, rest_days: {} },
});

export function getPollStats(): PollStats {
  const stats = emptyStats();
  try {
    const rows = getDb()
      .prepare(
        "SELECT dimension, choice, COUNT(*) AS n FROM poll_votes GROUP BY dimension, choice",
      )
      .all() as { dimension: string; choice: string; n: number }[];
    for (const r of rows) {
      const dim = r.dimension as PollDimension;
      if (!POLL_DIMENSIONS.includes(dim)) continue;
      const n = Number(r.n) || 0;
      stats.counts[dim][r.choice] = n;
      stats.totals[dim] += n;
    }
  } catch {
    // table not ready yet
  }
  return stats;
}

export function getMyVotes(voterKey: string): PollAnswers {
  const out: PollAnswers = {};
  try {
    const rows = getDb()
      .prepare("SELECT dimension, choice FROM poll_votes WHERE voterKey = ?")
      .all(voterKey) as { dimension: string; choice: string }[];
    for (const r of rows) {
      const dim = r.dimension as PollDimension;
      if (POLL_DIMENSIONS.includes(dim) && isValidChoice(dim, r.choice)) {
        out[dim] = r.choice;
      }
    }
  } catch {
    // table not ready yet
  }
  return out;
}

export function castVote(
  voterKey: string,
  answers: PollAnswers,
): { ok: true; updated: PollDimension[] } | { ok: false; error: string } {
  const dims = POLL_DIMENSIONS.filter((d) => answers[d]);
  if (dims.length === 0) {
    return { ok: false, error: "请至少选择一项" };
  }
  for (const d of dims) {
    const choice = answers[d]!;
    if (!isValidChoice(d, choice)) {
      return { ok: false, error: "选项无效，请刷新页面重试" };
    }
  }

  const now = new Date().toISOString();
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const upsert = db.prepare(
      `INSERT INTO poll_votes (dimension, voterKey, choice, updatedAt)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(dimension, voterKey) DO UPDATE SET
         choice = excluded.choice, updatedAt = excluded.updatedAt`,
    );
    for (const d of dims) {
      upsert.run(d, voterKey, answers[d]!, now);
    }
    db.exec("COMMIT");
    return { ok: true, updated: dims };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function pollOptionCount(dimension: PollDimension): number {
  return POLL_OPTIONS[dimension].length;
}
