// Scans a tree for leftover Chinese (CJK) text in tracked text files.
// Usage: node tools/i18n/check.mjs [--dir <tree>]
// Exits non-zero when any Chinese text is found.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;
const TEXT_EXT = new Set([".js", ".mjs", ".cjs", ".json", ".md", ".yml", ".yaml", ".html", ".ps1", ".cmd", ".txt"]);
const SKIP_DIRS = new Set([".git", "node_modules", "assets", "i18n"]);
// The translation dictionary is Chinese by design.
const SKIP_FILES = new Set([join("tools", "i18n", "zh-en.json")]);

export function findCjk(root) {
  const hits = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(full);
        continue;
      }
      const rel = relative(root, full);
      if (SKIP_FILES.has(rel)) continue;
      const ext = entry.name.slice(entry.name.lastIndexOf("."));
      if (!TEXT_EXT.has(ext)) continue;
      if (statSync(full).size > 4 * 1024 * 1024) continue;
      const text = readFileSync(full, "utf8");
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (CJK.test(lines[i])) hits.push({ file: rel.split(sep).join("/"), line: i + 1, text: lines[i].trim().slice(0, 120) });
      }
    }
  };
  walk(root);
  return hits;
}

// CLI entry point: only run when executed directly, never when imported.
const invokedDirectly = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const argDir = process.argv.indexOf("--dir");
  const root = argDir >= 0 ? process.argv[argDir + 1] : join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
  const hits = findCjk(root);
  if (hits.length === 0) {
    console.log(`check-cjk: OK - no Chinese text under ${root}`);
    process.exit(0);
  }
  console.error(`check-cjk: ${hits.length} line(s) with Chinese text under ${root}`);
  for (const h of hits.slice(0, 60)) console.error(`  ${h.file}:${h.line}: ${h.text}`);
  if (hits.length > 60) console.error(`  ... and ${hits.length - 60} more`);
  process.exit(1);
}
