const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const db = new DatabaseSync(path.join(__dirname, "..", "data", "app.db"));
const rows = db.prepare("SELECT id, parentId FROM comments").all();
const byId = new Map(rows.map((r) => [r.id, r.parentId]));
let fixed = 0;

function rootOf(id) {
  let cur = id;
  const seen = new Set();
  while (true) {
    if (seen.has(cur)) return cur;
    seen.add(cur);
    const p = byId.get(cur);
    if (!p) return cur;
    cur = p;
  }
}

const update = db.prepare("UPDATE comments SET parentId = ? WHERE id = ?");
for (const r of rows) {
  if (!r.parentId) continue;
  const root = rootOf(r.id);
  if (root !== r.parentId && root !== r.id) {
    update.run(root, r.id);
    byId.set(r.id, root);
    fixed++;
  } else if (root === r.id && r.parentId) {
    // orphan parent missing — keep as root
    update.run(null, r.id);
    byId.set(r.id, null);
    fixed++;
  }
}
console.log("FIXED_PARENTS=" + fixed);
db.close();
