const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const db = new DatabaseSync(path.join(__dirname, "..", "data", "app.db"));
db.prepare(`UPDATE companies SET restType = ? WHERE restType = ?`).run(
  "单休",
  "未知",
);
console.log(
  JSON.stringify(db.prepare(`SELECT COUNT(*) AS n FROM companies WHERE restType = ?`).get("未知")),
);
db.close();
