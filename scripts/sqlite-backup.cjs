const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");

const src = process.argv[2];
const dest = process.argv[3];
if (!src || !dest) {
  console.error("usage: node sqlite-backup.cjs <src.db> <dest.db>");
  process.exit(2);
}

try {
  const db = new DatabaseSync(src);
  db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
  db.close();

  if (!fs.existsSync(dest)) {
    console.error("backup file missing");
    process.exit(1);
  }

  const check = new DatabaseSync(dest, { readOnly: true });
  const row = check.prepare("PRAGMA integrity_check").get();
  check.close();
  const result = String(row?.integrity_check ?? row?.["integrity_check"] ?? "");
  if (result && result !== "ok") {
    console.error("integrity_check failed:", result);
    process.exit(1);
  }

  console.log("OK", path.basename(dest), fs.statSync(dest).size);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
