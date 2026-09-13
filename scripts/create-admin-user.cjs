const { randomBytes, randomUUID, scryptSync } = require("crypto");
const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const username = process.env.ADMIN_USERNAME || "shuangxiu_admin";
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
if (!password || password.length < 12) {
  console.error(
    "需设置 ADMIN_BOOTSTRAP_PASSWORD（至少 12 位）。可选 ADMIN_USERNAME。",
  );
  process.exit(1);
}

const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "data", "app.db");
const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    createdAt TEXT NOT NULL
  );
`);
try {
  db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`);
} catch {
  // exists
}

const existing = db
  .prepare("SELECT id, role FROM users WHERE username = ?")
  .get(username);
const salt = randomBytes(16).toString("hex");
const passwordHash = scryptSync(password, salt, 64).toString("hex");
const now = new Date().toISOString();

if (existing) {
  db.prepare(
    "UPDATE users SET passwordHash = ?, salt = ?, role = 'admin' WHERE id = ?",
  ).run(passwordHash, salt, existing.id);
  console.log("UPDATED id=" + existing.id + " username=" + username + " role=admin");
} else {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO users (id, username, passwordHash, salt, role, createdAt) VALUES (?, ?, ?, ?, 'admin', ?)",
  ).run(id, username, passwordHash, salt, now);
  console.log("CREATED id=" + id + " username=" + username + " role=admin");
}
db.close();
