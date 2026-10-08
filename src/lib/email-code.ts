import { getDb } from "@/lib/db";
import { logWarn } from "@/lib/log";

/**
 * Email verification codes persisted in SQLite (NOT in-memory: Next.js bundles
 * each route separately, so module-level Maps are not shared between the send
 * and verify routes). Single active code per (email, scene).
 */

export type EmailScene = "register" | "reset";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60s between sends
const MAX_ATTEMPTS = 5;

type CodeRow = {
  email: string;
  scene: string;
  code: string;
  exp: string;
  attempts: number;
  lastSent: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const e = normalizeEmail(email);
  if (!e) return "请输入邮箱";
  if (e.length > 254) return "邮箱过长";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return "邮箱格式不正确";
  return null;
}

function getEntry(
  email: string,
  scene: EmailScene,
): CodeRow | undefined {
  return getDb()
    .prepare(
      "SELECT email, scene, code, exp, attempts, lastSent FROM email_codes WHERE email = ? AND scene = ?",
    )
    .get(normalizeEmail(email), scene) as CodeRow | undefined;
}

/** Check resend cooldown without consuming anything. */
export function resendCooldownOk(
  email: string,
  scene: EmailScene,
): { ok: boolean; retryAfterSec: number } {
  const entry = getEntry(email, scene);
  if (!entry) return { ok: true, retryAfterSec: 0 };
  const elapsed = Date.now() - Number(entry.lastSent);
  if (elapsed < RESEND_COOLDOWN_MS) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
    };
  }
  return { ok: true, retryAfterSec: 0 };
}

/** Generate and store a new code for the given email/scene (overwrites old). */
export function issueEmailCode(email: string, scene: EmailScene): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const now = Date.now();
  getDb()
    .prepare(
      `INSERT INTO email_codes (email, scene, code, exp, attempts, lastSent)
       VALUES (?, ?, ?, ?, 0, ?)
       ON CONFLICT(email, scene) DO UPDATE SET
         code = excluded.code, exp = excluded.exp, attempts = 0, lastSent = excluded.lastSent`,
    )
    .run(normalizeEmail(email), scene, code, String(now + CODE_TTL_MS), String(now));
  return code;
}

/** Consume-style verification; wrong attempts are counted, entry dies at MAX_ATTEMPTS. */
export function verifyEmailCode(
  email: string,
  scene: EmailScene,
  code: string,
): boolean {
  const e = normalizeEmail(email);
  const entry = getEntry(e, scene);
  if (!entry) return false;
  if (Date.now() > Number(entry.exp) || entry.attempts >= MAX_ATTEMPTS) {
    getDb()
      .prepare("DELETE FROM email_codes WHERE email = ? AND scene = ?")
      .run(e, scene);
    return false;
  }
  getDb()
    .prepare("UPDATE email_codes SET attempts = attempts + 1 WHERE email = ? AND scene = ?")
    .run(e, scene);
  const ok = entry.code === code.trim();
  if (ok) {
    getDb()
      .prepare("DELETE FROM email_codes WHERE email = ? AND scene = ?")
      .run(e, scene); // one-time use
  } else if (entry.attempts + 1 >= MAX_ATTEMPTS) {
    logWarn("email_code_locked", { scene });
    getDb()
      .prepare("DELETE FROM email_codes WHERE email = ? AND scene = ?")
      .run(e, scene);
  }
  return ok;
}
