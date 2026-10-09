import { existsSync, mkdirSync, promises as fs } from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "crypto";
import { seedCompanies } from "@/data/seed";
import { logError, logWarn } from "@/lib/log";
import type {
  Claim,
  Comment,
  CommentWithMeta,
  Company,
  RestType,
  ReviewStatus,
  Submission,
} from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "app.db");

let db: DatabaseSync | null = null;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function getDb(): DatabaseSync {
  if (db) return db;
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      restType TEXT NOT NULL,
      source TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      evidenceHint TEXT NOT NULL DEFAULT '',
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      companyName TEXT NOT NULL,
      restType TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT '',
      industry TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      evidenceNote TEXT NOT NULL DEFAULT '',
      contact TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      reviewedAt TEXT,
      reviewNote TEXT,
      companyRef TEXT
    );
    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      companyName TEXT NOT NULL,
      restType TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT '',
      industry TEXT NOT NULL DEFAULT '',
      policySummary TEXT NOT NULL DEFAULT '',
      evidenceNote TEXT NOT NULL DEFAULT '',
      contactName TEXT NOT NULL DEFAULT '',
      contact TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      reviewedAt TEXT,
      reviewNote TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_sessions (
      token TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL,
      userId TEXT NOT NULL,
      username TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      parentId TEXT,
      replyToUsername TEXT
    );
    CREATE TABLE IF NOT EXISTS comment_likes (
      commentId TEXT NOT NULL,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (commentId, userId)
    );
    CREATE TABLE IF NOT EXISTS email_codes (
      email TEXT NOT NULL,
      scene TEXT NOT NULL,
      code TEXT NOT NULL,
      exp TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      lastSent TEXT NOT NULL,
      PRIMARY KEY (email, scene)
    );
    CREATE TABLE IF NOT EXISTS poll_votes (
      dimension TEXT NOT NULL,
      voterKey TEXT NOT NULL,
      choice TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      PRIMARY KEY (dimension, voterKey)
    );
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
    CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(userId);
    CREATE INDEX IF NOT EXISTS idx_comments_company ON comments(companyId, createdAt);
  `);

  try {
    db.exec(`ALTER TABLE comments ADD COLUMN parentId TEXT`);
  } catch {
    // exists
  }
  try {
    db.exec(`ALTER TABLE comments ADD COLUMN replyToUsername TEXT`);
  } catch {
    // exists
  }
  try {
    db.exec(`ALTER TABLE submissions ADD COLUMN companyRef TEXT`);
  } catch {
    // exists
  }
  try {
    db.exec(`ALTER TABLE submissions ADD COLUMN restDays TEXT`);
  } catch {
    // exists
  }
  try {
    db.exec(`ALTER TABLE claims ADD COLUMN restDays TEXT`);
  } catch {
    // exists
  }
  try {
    db.exec(`ALTER TABLE companies ADD COLUMN restDays TEXT`);
  } catch {
    // exists
  }
  try {
    db.exec(`ALTER TABLE submissions ADD COLUMN position TEXT`);
  } catch {
    // exists
  }
  try {
    db.exec(`ALTER TABLE companies ADD COLUMN position TEXT`);
  } catch {
    // exists
  }

  try {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`);
  } catch {
    // column already exists
  }

  try {
    db.exec(`ALTER TABLE users ADD COLUMN email TEXT`);
  } catch {
    // column already exists
  }
  try {
    // Partial unique index: multiple NULLs allowed (legacy users), one email per account.
    db.exec(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL`,
    );
  } catch {
    // index already exists
  }

  const count = db.prepare("SELECT COUNT(*) AS n FROM companies").get() as {
    n: number;
  };
  if (count.n === 0) {
    const insert = db.prepare(
      `INSERT OR IGNORE INTO companies
        (id, name, industry, city, restType, source, note, evidenceHint, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const c of seedCompanies) {
      insert.run(
        c.id,
        c.name,
        c.industry,
        c.city,
        c.restType,
        c.source,
        c.note,
        c.evidenceHint,
        c.updatedAt,
      );
    }
  }

  return db;
}

let legacyMigrated = false;

async function migrateLegacyJson() {
  if (legacyMigrated) return;
  const database = getDb();
  const subCount = (
    database.prepare("SELECT COUNT(*) AS n FROM submissions").get() as {
      n: number;
    }
  ).n;
  const claimCount = (
    database.prepare("SELECT COUNT(*) AS n FROM claims").get() as { n: number }
  ).n;

  if (subCount === 0) {
    try {
      const raw = await fs.readFile(path.join(dataDir, "submissions.json"), "utf-8");
      const items = JSON.parse(raw) as Submission[];
      const insert = database.prepare(
        `INSERT OR IGNORE INTO submissions
          (id, companyName, restType, city, industry, note, evidenceNote, contact, status, createdAt, reviewedAt, reviewNote)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const s of items) {
        insert.run(
          s.id,
          s.companyName,
          s.restType,
          s.city,
          s.industry,
          s.note,
          s.evidenceNote,
          s.contact,
          s.status,
          s.createdAt,
          s.reviewedAt ?? null,
          s.reviewNote ?? null,
        );
        if (s.status === "approved") {
          upsertCompanyFromSubmission(s, database);
        }
      }
    } catch {
      // no legacy file
    }
  }

  if (claimCount === 0) {
    try {
      const raw = await fs.readFile(path.join(dataDir, "claims.json"), "utf-8");
      const items = JSON.parse(raw) as Claim[];
      const insert = database.prepare(
        `INSERT OR IGNORE INTO claims
          (id, companyName, restType, city, industry, policySummary, evidenceNote, contactName, contact, status, createdAt, reviewedAt, reviewNote)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const c of items) {
        insert.run(
          c.id,
          c.companyName,
          c.restType,
          c.city,
          c.industry,
          c.policySummary,
          c.evidenceNote,
          c.contactName,
          c.contact,
          c.status,
          c.createdAt,
          c.reviewedAt ?? null,
          c.reviewNote ?? null,
        );
        if (c.status === "approved") {
          upsertCompanyFromClaim(c, database);
        }
      }
    } catch {
      // no legacy file
    }
  }

  legacyMigrated = true;
}

function upsertCompanyFromSubmission(s: Submission, database = getDb()) {
  const noteParts = [s.note || "用户提交，已通过审核."];
  if (s.position) noteParts.push(`岗位：${s.position}`);
  database
    .prepare(
      `INSERT INTO companies (id, name, industry, city, restType, source, note, evidenceHint, updatedAt, restDays, position)
       VALUES (?, ?, ?, ?, ?, 'user', ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name, industry=excluded.industry, city=excluded.city,
         restType=excluded.restType, source=excluded.source, note=excluded.note,
         evidenceHint=excluded.evidenceHint, updatedAt=excluded.updatedAt,
         restDays=excluded.restDays, position=excluded.position`,
    )
    .run(
      `u-${s.id}`,
      s.companyName,
      s.industry || "未分类",
      s.city || "未知",
      s.restType,
      noteParts.join("；"),
      s.evidenceNote || "用户材料",
      (s.reviewedAt || s.createdAt).slice(0, 10),
      s.restDays && s.restDays.length ? JSON.stringify(s.restDays) : null,
      s.position ?? null,
    );
}

function upsertCompanyFromClaim(c: Claim, database = getDb()) {
  database
    .prepare(
      `INSERT INTO companies (id, name, industry, city, restType, source, note, evidenceHint, updatedAt, restDays)
       VALUES (?, ?, ?, ?, ?, 'certified', ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name, industry=excluded.industry, city=excluded.city,
         restType=excluded.restType, source=excluded.source, note=excluded.note,
         evidenceHint=excluded.evidenceHint, updatedAt=excluded.updatedAt,
         restDays=excluded.restDays`,
    )
    .run(
      `claim-${c.id}`,
      c.companyName,
      c.industry || "未分类",
      c.city || "未知",
      c.restType,
      c.policySummary || "企业认领并提交休息制度说明。",
      c.evidenceNote || "企业认领材料",
      (c.reviewedAt || c.createdAt).slice(0, 10),
      c.restDays && c.restDays.length ? JSON.stringify(c.restDays) : null,
    );
}

function rowToCompany(r: Record<string, unknown>): Company {
  return {
    id: String(r.id),
    name: String(r.name),
    industry: String(r.industry),
    city: String(r.city),
    restType: String(r.restType) as RestType,
    source: CompanySource(r.source),
    note: String(r.note ?? ""),
    evidenceHint: String(r.evidenceHint ?? ""),
    updatedAt: String(r.updatedAt),
    restDays: parseRestDays(r.restDays),
    position: r.position ? String(r.position) : undefined,
  };
}

function CompanySource(v: unknown): Company["source"] {
  const s = String(v);
  if (s === "certified" || s === "seed_jd" || s === "user" || s === "pending") {
    return s;
  }
  return "pending";
}

function parseRestDays(raw: unknown): number[] {
  if (typeof raw === "string" && raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const days = parsed
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
        return Array.from(new Set(days));
      }
    } catch {
      return [];
    }
  }
  return [];
}

function rowToSubmission(r: Record<string, unknown>): Submission {
  return {
    id: String(r.id),
    companyName: String(r.companyName),
    restType: String(r.restType) as RestType,
    city: String(r.city ?? ""),
    industry: String(r.industry ?? ""),
    note: String(r.note ?? ""),
    evidenceNote: String(r.evidenceNote ?? ""),
    contact: String(r.contact ?? ""),
    status: String(r.status) as ReviewStatus,
    createdAt: String(r.createdAt),
    reviewedAt: r.reviewedAt ? String(r.reviewedAt) : undefined,
    reviewNote: r.reviewNote ? String(r.reviewNote) : undefined,
    companyRef: r.companyRef ? String(r.companyRef) : null,
    restDays: parseRestDays(r.restDays),
    position: r.position ? String(r.position) : undefined,
  };
}

function rowToClaim(r: Record<string, unknown>): Claim {
  return {
    id: String(r.id),
    companyName: String(r.companyName),
    restType: String(r.restType) as RestType,
    city: String(r.city ?? ""),
    industry: String(r.industry ?? ""),
    policySummary: String(r.policySummary ?? ""),
    evidenceNote: String(r.evidenceNote ?? ""),
    contactName: String(r.contactName ?? ""),
    contact: String(r.contact ?? ""),
    status: String(r.status) as ReviewStatus,
    createdAt: String(r.createdAt),
    reviewedAt: r.reviewedAt ? String(r.reviewedAt) : undefined,
    reviewNote: r.reviewNote ? String(r.reviewNote) : undefined,
    restDays: parseRestDays(r.restDays),
  };
}

export async function listCompanies(): Promise<Company[]> {
  await migrateLegacyJson();
  const rows = getDb()
    .prepare("SELECT * FROM companies ORDER BY updatedAt DESC, name ASC")
    .all() as Record<string, unknown>[];
  return rows.map(rowToCompany);
}

export async function getCompany(id: string): Promise<Company | undefined> {
  await migrateLegacyJson();
  const row = getDb()
    .prepare("SELECT * FROM companies WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? rowToCompany(row) : undefined;
}

export async function deleteCompany(id: string): Promise<boolean> {
  await migrateLegacyJson();
  const database = getDb();
  const existing = database
    .prepare("SELECT id FROM companies WHERE id = ?")
    .get(id) as { id?: string } | undefined;
  if (!existing) return false;

  database.exec("BEGIN IMMEDIATE");
  try {
    const commentIds = (
      database
        .prepare("SELECT id FROM comments WHERE companyId = ?")
        .all(id) as { id: string }[]
    ).map((r) => r.id);

    if (commentIds.length > 0) {
      const placeholders = commentIds.map(() => "?").join(",");
      database
        .prepare(
          `DELETE FROM comment_likes WHERE commentId IN (${placeholders})`,
        )
        .run(...commentIds);
      database
        .prepare(`DELETE FROM comments WHERE companyId = ?`)
        .run(id);
    }

    database.prepare("DELETE FROM companies WHERE id = ?").run(id);
    database.exec("COMMIT");
    return true;
  } catch (e) {
    database.exec("ROLLBACK");
    throw e;
  }
}

export async function createSubmission(input: {
  companyName: string;
  restType: RestType;
  city: string;
  industry: string;
  note: string;
  evidenceNote: string;
  contact: string;
  companyRef?: string | null;
  restDays?: number[];
  position?: string;
}): Promise<Submission> {
  await migrateLegacyJson();
  const restDays = input.restDays?.filter((d) => d >= 0 && d <= 6) ?? [];
  const sub: Submission = {
    id: randomUUID(),
    companyName: input.companyName.trim(),
    restType: input.restType,
    city: input.city.trim(),
    industry: input.industry.trim(),
    note: input.note.trim(),
    evidenceNote: input.evidenceNote.trim(),
    contact: input.contact.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
    companyRef: input.companyRef ?? null,
    restDays,
    position: input.position?.trim() || undefined,
  };
  getDb()
    .prepare(
      `INSERT INTO submissions
        (id, companyName, restType, city, industry, note, evidenceNote, contact, status, createdAt, companyRef, restDays, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
    )
    .run(
      sub.id,
      sub.companyName,
      sub.restType,
      sub.city,
      sub.industry,
      sub.note,
      sub.evidenceNote,
      sub.contact,
      sub.createdAt,
      sub.companyRef ?? null,
      JSON.stringify(restDays),
      sub.position ?? null,
    );
  return sub;
}

export async function createClaim(input: {
  companyName: string;
  restType: RestType;
  city: string;
  industry: string;
  policySummary: string;
  evidenceNote: string;
  contactName: string;
  contact: string;
  restDays?: number[];
}): Promise<Claim> {
  await migrateLegacyJson();
  const restDays = input.restDays?.filter((d) => d >= 0 && d <= 6) ?? [];
  const claim: Claim = {
    id: randomUUID(),
    companyName: input.companyName.trim(),
    restType: input.restType,
    city: input.city.trim(),
    industry: input.industry.trim(),
    policySummary: input.policySummary.trim(),
    evidenceNote: input.evidenceNote.trim(),
    contactName: input.contactName.trim(),
    contact: input.contact.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
    restDays,
  };
  getDb()
    .prepare(
      `INSERT INTO claims
        (id, companyName, restType, city, industry, policySummary, evidenceNote, contactName, contact, status, createdAt, restDays)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    )
    .run(
      claim.id,
      claim.companyName,
      claim.restType,
      claim.city,
      claim.industry,
      claim.policySummary,
      claim.evidenceNote,
      claim.contactName,
      claim.contact,
      claim.createdAt,
      JSON.stringify(restDays),
    );
  return claim;
}

export async function readSubmissions(): Promise<Submission[]> {
  await migrateLegacyJson();
  const rows = getDb()
    .prepare("SELECT * FROM submissions ORDER BY createdAt DESC")
    .all() as Record<string, unknown>[];
  return rows.map(rowToSubmission);
}

export async function readClaims(): Promise<Claim[]> {
  await migrateLegacyJson();
  const rows = getDb()
    .prepare("SELECT * FROM claims ORDER BY createdAt DESC")
    .all() as Record<string, unknown>[];
  return rows.map(rowToClaim);
}

export async function updateSubmissionStatus(
  id: string,
  status: ReviewStatus,
  reviewNote?: string,
): Promise<Submission | null> {
  await migrateLegacyJson();
  const database = getDb();
  const existing = database
    .prepare("SELECT * FROM submissions WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  if (!existing) return null;

  const reviewedAt = new Date().toISOString();
  database.exec("BEGIN IMMEDIATE");
  try {
    database
      .prepare(
        `UPDATE submissions SET status = ?, reviewNote = COALESCE(?, reviewNote), reviewedAt = ? WHERE id = ?`,
      )
      .run(status, reviewNote?.trim() || null, reviewedAt, id);

    const updated = rowToSubmission({
      ...existing,
      status,
      reviewNote: reviewNote?.trim() || existing.reviewNote,
      reviewedAt,
    });

    if (status === "approved") {
      if (updated.companyRef) {
        // Correction: update the original company entry.
        database
          .prepare(
            `UPDATE companies
             SET restType = ?, note = ?, evidenceHint = ?, updatedAt = ?,
                 restDays = ?, position = COALESCE(?, position)
             WHERE id = ?`,
          )
          .run(
            updated.restType,
            updated.note || String(existing.note ?? ""),
            updated.evidenceNote || String(existing.evidenceHint ?? ""),
            reviewedAt.slice(0, 10),
            updated.restDays && updated.restDays.length
              ? JSON.stringify(updated.restDays)
              : null,
            updated.position ?? null,
            updated.companyRef,
          );
      } else {
        upsertCompanyFromSubmission(updated, database);
      }
    } else if (status === "rejected") {
      database.prepare("DELETE FROM companies WHERE id = ?").run(`u-${id}`);
    }

    database.exec("COMMIT");
    return updated;
  } catch (e) {
    database.exec("ROLLBACK");
    throw e;
  }
}

export async function updateClaimStatus(
  id: string,
  status: ReviewStatus,
  reviewNote?: string,
): Promise<Claim | null> {
  await migrateLegacyJson();
  const database = getDb();
  const existing = database
    .prepare("SELECT * FROM claims WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  if (!existing) return null;

  const reviewedAt = new Date().toISOString();
  database.exec("BEGIN IMMEDIATE");
  try {
    database
      .prepare(
        `UPDATE claims SET status = ?, reviewNote = COALESCE(?, reviewNote), reviewedAt = ? WHERE id = ?`,
      )
      .run(status, reviewNote?.trim() || null, reviewedAt, id);

    const updated = rowToClaim({
      ...existing,
      status,
      reviewNote: reviewNote?.trim() || existing.reviewNote,
      reviewedAt,
    });

    if (status === "approved") {
      upsertCompanyFromClaim(updated, database);
    } else if (status === "rejected") {
      database.prepare("DELETE FROM companies WHERE id = ?").run(`claim-${id}`);
    }

    database.exec("COMMIT");
    return updated;
  } catch (e) {
    database.exec("ROLLBACK");
    throw e;
  }
}

export function filterCompanies(
  companies: Company[],
  opts: { q?: string; rest?: string; city?: string; source?: string },
): Company[] {
  const q = (opts.q || "").trim().toLowerCase();
  return companies.filter((c) => {
    if (opts.rest && opts.rest !== "全部" && c.restType !== opts.rest) {
      return false;
    }
    if (opts.city && opts.city !== "全部" && c.city !== opts.city) {
      return false;
    }
    if (opts.source && opts.source !== "全部" && c.source !== opts.source) {
      return false;
    }
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });
}

export function uniqueValues(companies: Company[], key: "city" | "industry") {
  return Array.from(new Set(companies.map((c) => c[key]))).sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
}

export function isAdminPassword(token: string | null): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    // Never fall back to a public default in production.
    if (process.env.NODE_ENV === "production") {
      logError("admin_token_missing", undefined, {
        msg: "ADMIN_TOKEN not set; admin password login disabled",
      });
      return false;
    }
    // Dev-only convenience token (still not a Bearer session).
    return Boolean(token) && token === "shuangxiu-admin";
  }
  return Boolean(token) && token === expected;
}

export function createAdminSession(ttlHours = 12): string {
  const database = getDb();
  const token = randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + ttlHours * 3600 * 1000);
  database
    .prepare(
      "INSERT INTO sessions (token, createdAt, expiresAt) VALUES (?, ?, ?)",
    )
    .run(token, now.toISOString(), expires.toISOString());
  return token;
}

export function validateAdminSession(token: string | null | undefined): boolean {
  if (!token) return false;
  const row = getDb()
    .prepare("SELECT expiresAt FROM sessions WHERE token = ?")
    .get(token) as { expiresAt?: string } | undefined;
  if (!row?.expiresAt) return false;
  return new Date(row.expiresAt).getTime() > Date.now();
}

export function revokeAdminSession(token: string | null | undefined) {
  if (!token) return;
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

function rowToComment(r: Record<string, unknown>): Comment {
  return {
    id: String(r.id),
    companyId: String(r.companyId),
    userId: String(r.userId),
    username: String(r.username),
    content: String(r.content),
    createdAt: String(r.createdAt),
    parentId: r.parentId ? String(r.parentId) : null,
    replyToUsername: r.replyToUsername ? String(r.replyToUsername) : null,
  };
}

export function listComments(companyId: string, limit = 200): Comment[] {
  const rows = getDb()
    .prepare(
      "SELECT * FROM comments WHERE companyId = ? ORDER BY createdAt DESC LIMIT ?",
    )
    .all(companyId, limit) as Record<string, unknown>[];
  return rows.map(rowToComment);
}

export function getComment(id: string): Comment | null {
  const row = getDb()
    .prepare("SELECT * FROM comments WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? rowToComment(row) : null;
}

export function createComment(input: {
  companyId: string;
  userId: string;
  username: string;
  content: string;
  parentId?: string | null;
  replyToUsername?: string | null;
}): Comment {
  const comment: Comment = {
    id: randomUUID(),
    companyId: input.companyId,
    userId: input.userId,
    username: input.username,
    content: input.content.slice(0, 500),
    createdAt: new Date().toISOString(),
    parentId: input.parentId ?? null,
    replyToUsername: input.replyToUsername ?? null,
  };
  getDb()
    .prepare(
      `INSERT INTO comments
        (id, companyId, userId, username, content, createdAt, parentId, replyToUsername)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      comment.id,
      comment.companyId,
      comment.userId,
      comment.username,
      comment.content,
      comment.createdAt,
      comment.parentId,
      comment.replyToUsername,
    );
  return comment;
}

export function deleteComment(id: string): boolean {
  const res = getDb().prepare("DELETE FROM comments WHERE id = ?").run(id);
  return Number(res.changes) > 0;
}

export function countCommentLikes(commentId: string): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM comment_likes WHERE commentId = ?")
    .get(commentId) as { n: number };
  return Number(row.n) || 0;
}

export function hasUserLikedComment(commentId: string, userId: string): boolean {
  const row = getDb()
    .prepare(
      "SELECT 1 AS ok FROM comment_likes WHERE commentId = ? AND userId = ?",
    )
    .get(commentId, userId) as { ok?: number } | undefined;
  return Boolean(row);
}

/** Returns true if now liked, false if unliked. Atomic via INSERT OR IGNORE + DELETE. */
export function toggleCommentLike(
  commentId: string,
  userId: string,
): boolean {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const del = db
      .prepare(
        "DELETE FROM comment_likes WHERE commentId = ? AND userId = ?",
      )
      .run(commentId, userId);
    if (Number(del.changes) > 0) {
      db.exec("COMMIT");
      return false;
    }
    db.prepare(
      "INSERT OR IGNORE INTO comment_likes (commentId, userId, createdAt) VALUES (?, ?, ?)",
    ).run(commentId, userId, new Date().toISOString());
    db.exec("COMMIT");
    return true;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function listCommentsWithMeta(
  companyId: string,
  viewerId?: string | null,
  limit = 200,
): CommentWithMeta[] {
  const rows = getDb()
    .prepare(
      "SELECT * FROM comments WHERE companyId = ? ORDER BY createdAt DESC LIMIT ?",
    )
    .all(companyId, limit) as Record<string, unknown>[];

  const counts = new Map<string, number>();
  const liked = new Set<string>();
  if (rows.length > 0) {
    const ids = rows.map((r) => String(r.id));
    const placeholders = ids.map(() => "?").join(",");
    const likeRows = getDb()
      .prepare(
        `SELECT commentId, userId FROM comment_likes WHERE commentId IN (${placeholders})`,
      )
      .all(...ids) as { commentId: string; userId: string }[];
    for (const lr of likeRows) {
      counts.set(lr.commentId, (counts.get(lr.commentId) || 0) + 1);
      if (viewerId && lr.userId === viewerId) liked.add(lr.commentId);
    }
  }

  return rows.map((r) => {
    const base = rowToComment(r);
    return {
      ...base,
      likeCount: counts.get(base.id) || 0,
      likedByMe: liked.has(base.id),
    };
  });
}

export function countCompanyComments(companyId: string): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM comments WHERE companyId = ?")
    .get(companyId) as { n: number };
  return Number(row.n) || 0;
}

export function listCommentsPage(
  companyId: string,
  viewerId: string | null | undefined,
  limit: number,
  offset: number,
): CommentWithMeta[] {
  const rows = getDb()
    .prepare(
      "SELECT * FROM comments WHERE companyId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?",
    )
    .all(companyId, limit, offset) as Record<string, unknown>[];

  const counts = new Map<string, number>();
  const liked = new Set<string>();
  if (rows.length > 0) {
    const ids = rows.map((r) => String(r.id));
    const placeholders = ids.map(() => "?").join(",");
    const likeRows = getDb()
      .prepare(
        `SELECT commentId, userId FROM comment_likes WHERE commentId IN (${placeholders})`,
      )
      .all(...ids) as { commentId: string; userId: string }[];
    for (const lr of likeRows) {
      counts.set(lr.commentId, (counts.get(lr.commentId) || 0) + 1);
      if (viewerId && lr.userId === viewerId) liked.add(lr.commentId);
    }
  }

  return rows.map((r) => {
    const base = rowToComment(r);
    return {
      ...base,
      likeCount: counts.get(base.id) || 0,
      likedByMe: liked.has(base.id),
    };
  });
}

export function listUserComments(userId: string, limit = 50): Array<
  CommentWithMeta & { companyName: string }
> {
  const rows = getDb()
    .prepare(
      `SELECT c.*, co.name AS companyName
       FROM comments c
       LEFT JOIN companies co ON co.id = c.companyId
       WHERE c.userId = ?
       ORDER BY c.createdAt DESC
       LIMIT ?`,
    )
    .all(userId, limit) as Record<string, unknown>[];

  const ids = rows.map((r) => String(r.id));
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const placeholders = ids.map(() => "?").join(",");
    const likeRows = getDb()
      .prepare(
        `SELECT commentId, COUNT(*) AS n FROM comment_likes WHERE commentId IN (${placeholders}) GROUP BY commentId`,
      )
      .all(...ids) as { commentId: string; n: number }[];
    for (const lr of likeRows) {
      counts.set(lr.commentId, Number(lr.n) || 0);
    }
  }

  return rows.map((r) => ({
    ...rowToComment(r),
    companyName: String(r.companyName || "未知企业"),
    likeCount: counts.get(String(r.id)) || 0,
    likedByMe: false,
  }));
}

export function canModerateComment(
  comment: Comment,
  viewer: { id: string; role: string } | null,
): boolean {
  if (!viewer) return false;
  if (viewer.role === "admin") return true;
  return viewer.id === comment.userId;
}

export { today };
