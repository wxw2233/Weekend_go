const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "app.db");
const db = new DatabaseSync(dbPath);
const has = db
  .prepare(`SELECT COUNT(*) AS n FROM companies WHERE id = ?`)
  .get("c-night");
if (!has.n) {
  db.prepare(
    `INSERT INTO companies (id, name, industry, city, restType, source, note, evidenceHint, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    "c-night",
    "夜航便利",
    "零售连锁",
    "重庆",
    "不休",
    "seed_jd",
    "24 小时门店，岗位无固定周休。",
    "门店招聘页",
    "2026-09-12",
  );
  console.log("INSERTED_C_NIGHT");
} else {
  console.log("HAS_C_NIGHT");
}
db.close();
