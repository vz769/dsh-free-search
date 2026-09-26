# Translation tooling (`tools/i18n/`)

This fork is an English-only translation of [DDDMUC/dsh-free-search](https://github.com/DDDMUC/dsh-free-search).
These files keep the translation reproducible when upstream releases a new version.

| File | Purpose |
|---|---|
| `zh-en.json` | The dictionary: `pairs` (exact Chinese line → English line), `removals` (exact chunks deleted from upstream) and `blocks` (multi-line replacements). Generated from the v0.4.39 translation diff. |
| `translate.mjs` | Applies the dictionary (plus `.cmd` renames) to a checkout. Idempotent, reports entries that no longer match. |
| `check.mjs` | Fails if any text file contains Chinese characters. |

## Everyday commands

```sh
node tools/i18n/check.mjs                 # verify: no Chinese text anywhere
node tools/i18n/translate.mjs             # re-apply the dictionary to this checkout
node tools/i18n/translate.mjs --dir PATH  # apply it to another checkout (e.g. a fresh upstream clone)
```

## Porting a new upstream release

```sh
git fetch upstream
git checkout -b upstream-vX.Y.Z upstream/master
node tools/i18n/translate.mjs --dir .     # applies the dictionary; unmatched entries are listed at the end
node tools/i18n/check.mjs                 # whatever Chinese remains still needs translating
git diff                                  # review, then merge into master and re-run check.mjs
```

`translate.mjs` prints a `note:` block listing dictionary entries still present in the tree — those are
exactly the strings upstream rewrote. Translate them by hand, then add the new `[zh, en]` pair to
`zh-en.json` (or ask an agent to do it) so the next release is mechanical again.

Verified on upstream `424bd41` (v0.4.39): applying the dictionary to a pristine clone reproduces this
fork's `lib/index.js`, `lib/client.js`, `cordis.patch.yml`, `tools/server.mjs`, `tools/switch-engine.html`,
`tools/switch-engine.ps1` and both launcher scripts byte-for-byte.

## What the dictionary does not cover

**`README.md` is translated by hand** (its restructure is not a line-for-line swap). When porting a release,
apply these steps to the upstream README:

1. Drop the language nav line (`[中文](#中文) · [English](#english)`) and the whole `## 中文` section,
   through the `## English` heading; promote the English body to the top level.
2. Replace the Chinese intro paragraph (line 3 upstream) with an English one, and add the English-only fork note.
3. Translate the trailing `## safeSearch 安全搜索过滤` section and move it before `### License`.
4. Remove the `**EN / 中文**` bullet from the settings list and the "Chinese/English toggle" mentions in
   *Web Settings UI*, *Switching Engines from the Chat* and *How It Works*.
5. Update the config example: `lang: en  # search localization (Wikipedia host, SerpBase hl/gl)`, and the
   Wikipedia platform row (`en.wikipedia.org` by default, `lang: zh` selects `zh.wikipedia.org`).
6. Name the launchers explicitly: `start-engine-switcher.cmd` and `start-deepseek-harness.cmd`.

Screenshots in `assets/*.png` still show the upstream Chinese UI; replace them if you want a fully English repo.

## Defaults changed by the translation

| Setting | Upstream | This fork | Why |
|---|---|---|---|
| `lang` | `zh` | `en` | the field also drives the Wikipedia platform host and the SerpBase `hl`/`gl`; the UI language toggle was removed |
| `ACCEPT_LANG` (fallback header) | `zh-CN,zh;q=0.9,en;q=0.8` | `en-US,en;q=0.9` | consistent English default |
| `bingMarket` | `zh-CN` | `zh-CN` (unchanged) | search-result localization is a user preference, not UI language — change it in the plugin settings if you want `en-US` |
