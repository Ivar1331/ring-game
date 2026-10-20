// Checks every puzzle file for mistakes before you push.
// Usage (from the project folder):  node tools/check-levels.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = { console };
vm.createContext(ctx);
const run = (f) => vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
run("js/i18n.js");
// load puzzles in the same order as index.html
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const files = [...html.matchAll(/src="(js\/levels\/[^"?]+)/g)].map((m) => m[1]);
const onDisk = fs.readdirSync(path.join(root, "js/levels")).filter((f) => f.endsWith(".js")).map((f) => "js/levels/" + f);
files.forEach(run);
vm.runInContext("this.__ = { LEVELS, UI, DIFFICULTIES }", ctx);
const { LEVELS, UI, DIFFICULTIES } = ctx.__;
const FLAGS = ["in", "jp", "fr", "ru", "cn", "br", "us", "gb", "th", "mx"];

let problems = 0;
const bad = (m) => { problems++; console.log("  ✗ " + m); };
for (const f of onDisk) if (!files.includes(f)) bad(`${f} is not listed in index.html, so it will not appear in the game`);

const keys = new Set();
for (const lv of LEVELS) {
  console.log(`${lv.emoji}  ${lv.name.en.padEnd(16)} ${lv.rings.length} rings, ${lv.items.length} items`);
  if (keys.has(lv.key)) bad(`duplicate puzzle key "${lv.key}"`);
  keys.add(lv.key);
  for (const f of ["name", "tagline"]) for (const l of ["en", "hi", "or"]) if (!lv[f] || !lv[f][l]) bad(`${lv.key}: missing ${f}.${l}`);
  if (lv.rings.length < 3) bad(`${lv.key}: needs at least 3 rings`);
  if (lv.items.length < 4) bad(`${lv.key}: needs at least 4 items`);
  if (lv.rings.length < 5) console.log(`    note: only ${lv.rings.length} rings, so Hard uses ${lv.rings.length}`);
  if (lv.items.length < 8) console.log(`    note: only ${lv.items.length} items, so Hard uses ${lv.items.length} slices`);
  if ([...lv.priority].sort().join() !== lv.rings.map((_, i) => i).join()) bad(`${lv.key}: "priority" must list every ring number once`);
  lv.rings.forEach((ring, j) => {
    for (const l of ["en", "hi", "or"]) if (!ring.name[l]) bad(`${lv.key}: ring ${j + 1} has no name in ${l}`);
    const seen = { en: new Map(), hi: new Map(), or: new Map(), icon: new Map() };
    lv.items.forEach((it) => {
      const v = it.values[j];
      if (ring.icon) {
        if (typeof v !== "string" || !v) return bad(`${lv.key}/${it.id}: ring "${ring.name.en}" needs a picture value`);
        if (v.startsWith("flag:") && !FLAGS.includes(v.slice(5))) bad(`${lv.key}/${it.id}: unknown flag "${v}" (known: ${FLAGS.join(", ")})`);
        if (seen.icon.has(v)) bad(`${lv.key}: "${v}" is used twice in ring "${ring.name.en}"`);
        seen.icon.set(v, it.id);
        return;
      }
      for (const l of ["en", "hi", "or"]) {
        if (!v || !v[l]) { bad(`${lv.key}/${it.id}: ring "${ring.name.en}" is missing ${l}`); continue; }
        const k = v[l].trim().toLowerCase();
        if (seen[l].has(k)) bad(`${lv.key}: "${v[l]}" (${l}) appears for both ${seen[l].get(k)} and ${it.id} in ring "${ring.name.en}" — each answer must be different`);
        seen[l].set(k, it.id);
      }
    });
  });
}
for (const l of ["hi", "or"]) for (const k of Object.keys(UI.en)) if (UI[l][k] === undefined) bad(`UI word "${k}" missing in ${l}`);
for (const d of DIFFICULTIES) for (const l of ["en", "hi", "or"]) if (!UI[l][d.key]) bad(`difficulty "${d.key}" has no name in ${l}`);

console.log(problems ? `\n${problems} problem(s) found.` : `\nAll ${LEVELS.length} puzzles look good ✓`);
process.exit(problems ? 1 : 0);
