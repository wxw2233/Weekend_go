import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { getDb } from "@/lib/db";

export const USER_COOKIE = "sx_user_session";

export type UserRole = "user" | "admin";

export type PublicUser = {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
  email?: string | null;
};

function toRole(v: unknown): UserRole {
  return v === "admin" ? "admin" : "user";
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

export function normalizeUsername(username: string): string {
  return username.trim();
}

const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "root",
  "system",
  "<admin>",
  "shuangxiu-admin",
  "shuangxiu_admin",
]);

export function validateUsername(username: string): string | null {
  const name = normalizeUsername(username);
  if (name.length < 2 || name.length > 32) {
    return "用户名长度需在 2–32 个字符之间";
  }
  if (!/^[\w一-龥.-]+$/u.test(name)) {
    return "用户名仅支持中英文、数字、下划线、点和短横线";
  }
  if (RESERVED_USERNAMES.has(name.toLowerCase())) {
    return "该用户名不可用";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8 || password.length > 72) {
    return "密码长度需在 8–72 位之间";
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "密码需同时包含字母和数字";
  }
  return null;
}

export function findUserByUsername(username: string): PublicUser | null {
  const row = getDb()
    .prepare("SELECT id, username, role, createdAt FROM users WHERE username = ?")
    .get(normalizeUsername(username)) as
    | { id: string; username: string; role?: string; createdAt: string }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    role: toRole(row.role),
    createdAt: row.createdAt,
  };
}

export function findUserByEmail(email: string): PublicUser | null {
  const row = getDb()
    .prepare("SELECT id, username, role, createdAt FROM users WHERE email = ?")
    .get(email) as
    | { id: string; username: string; role?: string; createdAt: string }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    role: toRole(row.role),
    createdAt: row.createdAt,
  };
}

export function createUser(
  username: string,
  password: string,
  email?: string,
): PublicUser {
  const name = normalizeUsername(username);
  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  // Registration never grants admin; promote only via trusted script/DB.
  const role: UserRole = "user";
  getDb()
    .prepare(
      "INSERT INTO users (id, username, passwordHash, salt, role, createdAt, email) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(id, name, passwordHash, salt, role, createdAt, email ?? null);
  return { id, username: name, role, createdAt };
}

export function verifyPassword(username: string, password: string): PublicUser | null {
  const name = normalizeUsername(username);
  const row = getDb()
    .prepare(
      "SELECT id, username, passwordHash, salt, role, createdAt FROM users WHERE username = ?",
    )
    .get(name) as
    | {
        id: string;
        username: string;
        passwordHash: string;
        salt: string;
        role?: string;
        createdAt: string;
      }
    | undefined;
  if (!row) return null;
  const hashed = hashPassword(password, row.salt);
  const a = Buffer.from(hashed, "hex");
  const b = Buffer.from(row.passwordHash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return {
    id: row.id,
    username: row.username,
    role: toRole(row.role),
    createdAt: row.createdAt,
  };
}

export function createUserSession(userId: string, ttlHours = 7 * 24): string {
  const token = randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + ttlHours * 3600 * 1000);
  getDb()
    .prepare(
      "INSERT INTO user_sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)",
    )
    .run(token, userId, now.toISOString(), expires.toISOString());
  return token;
}

export function revokeUserSessions(userId: string) {
  getDb().prepare("DELETE FROM user_sessions WHERE userId = ?").run(userId);
}

export function getUserBySession(token: string | null | undefined): PublicUser | null {
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.username, u.role, u.createdAt, u.email, s.expiresAt
       FROM user_sessions s
       JOIN users u ON u.id = s.userId
       WHERE s.token = ?`,
    )
    .get(token) as
    | {
        id: string;
        username: string;
        role?: string;
        createdAt: string;
        email?: string | null;
        expiresAt: string;
      }
    | undefined;
  if (!row) return null;
  if (new Date(row.expiresAt).getTime() <= Date.now()) return null;
  return {
    id: row.id,
    username: row.username,
    role: toRole(row.role),
    createdAt: row.createdAt,
    email: row.email ?? null,
  };
}

export function revokeUserSession(token: string | null | undefined) {
  if (!token) return;
  getDb().prepare("DELETE FROM user_sessions WHERE token = ?").run(token);
}

export function changeUserPassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
): { ok: boolean; error?: string } {
  const row = getDb()
    .prepare(
      "SELECT id, username, passwordHash, salt, role, createdAt FROM users WHERE id = ?",
    )
    .get(userId) as
    | {
        id: string;
        username: string;
        passwordHash: string;
        salt: string;
        role?: string;
        createdAt: string;
      }
    | undefined;
  if (!row) return { ok: false, error: "用户不存在" };

  const hashedOld = hashPassword(oldPassword, row.salt);
  const a = Buffer.from(hashedOld, "hex");
  const b = Buffer.from(row.passwordHash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: "原密码不正确" };
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) return { ok: false, error: passwordError };

  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(newPassword, salt);
  getDb()
    .prepare("UPDATE users SET passwordHash = ?, salt = ? WHERE id = ?")
    .run(passwordHash, salt, userId);
  // force re-login on other devices
  getDb().prepare("DELETE FROM user_sessions WHERE userId = ?").run(userId);
  return { ok: true };
}

export function resetUserPasswordByEmail(
  email: string,
  newPassword: string,
): { ok: boolean; error?: string } {
  const row = getDb()
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email) as { id?: string } | undefined;
  if (!row?.id) return { ok: false, error: "该邮箱未绑定账号" };

  const passwordError = validatePassword(newPassword);
  if (passwordError) return { ok: false, error: passwordError };

  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(newPassword, salt);
  getDb()
    .prepare("UPDATE users SET passwordHash = ?, salt = ? WHERE id = ?")
    .run(passwordHash, salt, row.id);
  // force re-login on all devices
  getDb().prepare("DELETE FROM user_sessions WHERE userId = ?").run(row.id);
  return { ok: true };
}

export function bindUserEmail(
  userId: string,
  email: string,
): { ok: boolean; error?: string } {
  try {
    const res = getDb()
      .prepare("UPDATE users SET email = ? WHERE id = ?")
      .run(email, userId);
    if (Number(res.changes) === 0) return { ok: false, error: "用户不存在" };
    return { ok: true };
  } catch (e) {
    // Unique index on email: someone already bound this address.
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return { ok: false, error: "该邮箱已被使用" };
    }
    throw e;
  }
}

export function deleteUserAccount(
  userId: string,
  password: string,
): { ok: boolean; error?: string } {
  const row = getDb()
    .prepare("SELECT id, passwordHash, salt FROM users WHERE id = ?")
    .get(userId) as
    | { id: string; passwordHash: string; salt: string }
    | undefined;
  if (!row) return { ok: false, error: "用户不存在" };

  const hashed = hashPassword(password, row.salt);
  const a = Buffer.from(hashed, "hex");
  const b = Buffer.from(row.passwordHash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: "密码不正确" };
  }

  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("DELETE FROM user_sessions WHERE userId = ?").run(userId);
    db.prepare("DELETE FROM comment_likes WHERE userId = ?").run(userId);
    // Soft-delete comments so reply threads stay intact
    db.prepare(
      `UPDATE comments
       SET content = '[该用户已注销]', username = '已注销用户', userId = ?
       WHERE userId = ?`,
    ).run(`deleted-${userId}`, userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return { ok: true };
}
