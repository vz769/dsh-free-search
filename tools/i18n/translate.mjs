// Re-applies the English translation to a dsh-free-search tree.
//
//   node tools/i18n/translate.mjs                 # translate this checkout in place
//   node tools/i18n/translate.mjs --dir <tree>    # translate another checkout (e.g. a new upstream release)
//   node tools/i18n/translate.mjs --check         # only run the Chinese-text check
//
// The dictionary (zh-en.json) holds exact-string replacements; the RULES below hold the
// structural edits that are not simple Chinese->English line swaps. Every step is idempotent:
// when a string is already English it is skipped and reported as "already applied".
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { findCjk } from "./check.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? (argv[i + 1] ?? true) : undefined;
};
const root = flag("--dir") || join(here, "..", "..");
const checkOnly = argv.includes("--check");

const dict = JSON.parse(readFileSync(join(here, "zh-en.json"), "utf8"));

// Files the dictionary and rename rules apply to. README.md is intentionally absent:
// its restructure (drop the Chinese section, keep English) is documented in tools/i18n/README.md.
const FILES = [
  "lib/index.js",
  "lib/client.js",
  "cordis.patch.yml",
  "tools/server.mjs",
  "tools/switch-engine.html",
  "tools/switch-engine.ps1",
  "tools/start-engine-switcher.cmd",
  "tools/start-deepseek-harness.cmd",
];

// Upstream ships two launchers whose file names are Chinese; the fork renames them.
const RENAMES = [
  ["tools/启动搜索引擎切换器.cmd", "tools/start-engine-switcher.cmd"],
  ["tools/启动DeepSeekHarness.cmd", "tools/start-deepseek-harness.cmd"],
];

// Structural edits that no line diff can express. Empty today: every v0.4.39 change is
// captured as data in zh-en.json. Add entries here when a future port needs one.
const RULES = [];

const applyAll = (text, needle, replacement) => {
  if (needle === "" || !text.includes(needle)) return { text, count: 0 };
  return { text: text.split(needle).join(replacement), count: text.split(needle).length - 1 };
};

function translateFile(file) {
  let text = readFileSync(join(root, file), "utf8");
  const original = text;
  const report = { pairs: 0, removals: 0, blocks: 0, rules: 0 };

  for (const [zh, en] of dict.pairs) {
    const r = applyAll(text, zh, en);
    text = r.text;
    report.pairs += r.count;
  }
  for (const chunk of dict.removals) {
    const r = applyAll(text, chunk, "");
    text = r.text;
    report.removals += r.count;
  }
  for (const block of dict.blocks.filter((b) => b.file === file)) {
    const r = applyAll(text, block.old, block.new);
    text = r.text;
    report.blocks += r.count;
  }
  for (const [ruleFile, from, to] of RULES.filter((r) => r[0] === file)) {
    const r = applyAll(text, from, to);
    text = r.text;
    report.rules += r.count;
  }

  if (text !== original) writeFileSync(join(root, file), text, "utf8");
  return report;
}

if (!checkOnly) {
  for (const [from, to] of RENAMES) {
    const src = join(root, from);
    const dst = join(root, to);
    if (existsSync(src) && !existsSync(dst)) {
      renameSync(src, dst);
      console.log(`${from}: renamed to ${to}`);
    }
  }

  let total = 0;
  for (const file of FILES) {
    try {
      const r = translateFile(file);
      const n = r.pairs + r.removals + r.blocks + r.rules;
      total += n;
      console.log(`${file}: ${n} edit(s) [pairs ${r.pairs}, removals ${r.removals}, blocks ${r.blocks}, rules ${r.rules}]`);
    } catch (error) {
      console.error(`${file}: SKIPPED - ${error.message}`);
      process.exitCode = 1;
    }
  }
  console.log(`total edits applied: ${total}`);

  // Which dictionary entries no longer match? That is exactly where upstream rewrote text.
  const unmatched = [];
  for (const [zh] of dict.pairs) {
    const found = FILES.some((file) => readFileSync(join(root, file), "utf8").includes(zh));
    if (found) unmatched.push(zh);
  }
  if (unmatched.length) {
    console.log(`note: ${unmatched.length} dictionary entry(ies) still present (translate them manually):`);
    for (const zh of unmatched.slice(0, 30)) console.log(`  ${zh.trim().slice(0, 110)}`);
  }
}

const hits = findCjk(root);
if (hits.length === 0) {
  console.log("check: OK - no Chinese text left in text files (docs/README handled separately)");
} else {
  console.log(`check: ${hits.length} line(s) with Chinese text remain:`);
  for (const h of hits.slice(0, 40)) console.log(`  ${h.file}:${h.line}: ${h.text}`);
  if (hits.length > 40) console.log(`  ... and ${hits.length - 40} more`);
  if (!argv.includes("--quiet")) process.exitCode = 1;
}
