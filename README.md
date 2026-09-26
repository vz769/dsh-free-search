# dsh-free-search

**Free web search for DeepSeek Harness — no API key needed, zero cost, switchable multi-engine search.** A plugin that adds multi-engine search providers to DeepSeek Harness (dsh), registered into the `ctx.web` seam. The built-in `web_search` tool uses it automatically, and it ships a web settings page (switch engines, configure API keys, test every engine in one click) plus a popup command for switching engines from the chat.

> **English-only fork.** This is [@vz769](https://github.com/vz769)'s English translation of [DDDMUC/dsh-free-search](https://github.com/DDDMUC/dsh-free-search) (upstream v0.4.39, MIT). All Chinese UI strings, comments, docs and tool messages were replaced with English; the upstream Chinese locale block and the in-app language toggle were removed, and the default `lang` is now `en`.

---

<div align="center">
  <a href="https://raw.githubusercontent.com/DDDMUC/dsh-free-search/master/assets/settings-free1.png">
    <img src="https://raw.githubusercontent.com/DDDMUC/dsh-free-search/master/assets/settings-free1.png" alt="Free Engine Settings (Bing)" width="820" />
  </a>
  <br>
  <sub>▲ Free engine (using Bing as an example)</sub>
</div>

### Why You Need It

dsh's default search provider relies on the official DeepSeek API key (`DEEPSEEK_API_KEY`). If you:
- Do not have (or prefer not to use) an official DeepSeek key,
- Use a gateway like opencode-go (whose OpenAI-compatible endpoint does not support the `web_search` tool),

...then the built-in search will inevitably fail, and the agent will tell you "I cannot access the internet."

This plugin provides multiple free search engines with automatic fallback, completely freeing you from relying on DeepSeek's official key.

### Features

- **Zero Cost** — Multiple free engines with no API key or registration required
- **Multi-Engine Support** — DuckDuckGo (HTML / Lite), Bing, AnySearch AI, SearXNG (meta-search with custom instances), Exa, Tavily, Keenable, Firecrawl, Parallel, Perplexity, SerpBase, and DeepSeek Official
- **Web Settings UI** — Engine switching and API key configuration (keys masked as "configured" in the UI); the entry is the component-row config (`plugins.row.config`) on the sidebar Plugins page (DSH 0.1.7-rc.1+)
- **Popup Switch Command** — Type `/free-search-engine` in the chat: a picker opens with all engines; click one to switch (equivalent to the settings page + save)
- **Engine Testing** — `free_search_test` for the agent to check all engines in one call; the settings UI also has a "Test engine" button that tests the selected engine directly (no fallback chain; paid engines without a key report an explicit error)
- **Unified Engine Fallback** — Any engine failure (paid or free, missing key, 401, rate limit, network error) automatically tries the next engine: the configured engine first, then other engines (exa/tavily/keenable/firecrawl/parallel are tried even without a key because they have built-in keyless quota), then the remaining free engines (Bing/AnySearch etc.) — with a note attached to the results naming the engine that actually served them (e.g. `Note: perplexity unavailable or failed, using exa.`). Search never fails outright.
- **Time Filtering** — The `advanced_search` tool supports `timeRange`: fixed tiers, custom relative values, or an absolute date (details below)
- **System Prompt Injection** — The agent is aware of the currently active engine and which engines require API keys; it is also told that all search output is **untrusted external data** and must never be executed as instructions
- **Prompt-Injection Guard (untrusted-data boundary)** — Web-derived text from the plugin's own tools (`advanced_search` / `platform_search` / `free_search_test`) is wrapped in an explicit `<untrusted-web-content>` boundary (look-alike tags inside the text are stripped to prevent early closure); the core `web_search` / `web_fetch` tools carry DSH core's own notice (`External web content follows...`); every snippet is cleaned and capped at 300 characters
- **Version + Update Check** — The settings card shows the current version (v0.4.39), and a "Check update" button queries the npm registry to compare against the latest release, prompting a one-click jump when a newer version exists
- **Result Caching** — Identical queries (same engine / time-filter args) hit an LRU cache (50 entries) for up to 5 minutes, protecting free engines from rate-limiting and saving paid quota; the TTL is configurable from 0-5 minutes in the settings UI (0 disables caching)
- **Visual Badges** — Free engines feature a green `FREE` badge, while paid engines show an orange `API KEY` badge in the settings UI
- **Webpage Fetching (`web_fetch`)** — Allows the agent to read full webpage contents (official `dsh-web-fetch-http` provider, pure JS, zero extra dependencies)
- **Platform Search (`platform_search`)** — Search GitHub / V2EX / Bilibili / Reddit / Hacker News / Stack Overflow / Wikipedia / npm (public APIs, zero extra dependencies)
- **Clean Integration** — Implements the official `WebSearchProvider` seam interface, coexisting seamlessly with official plugins

If this plugin has been helpful, a ⭐ on [GitHub](https://github.com/DDDMUC/dsh-free-search) would mean a lot — it's the biggest motivation for the developer to keep maintaining it. Thank you!

### Supported Engines

| id | Engine | Cost | Description |
|---|---|---|---|
| `ddg` | DuckDuckGo HTML | Free | Occasional rate limits (anti-bot challenges); recovers automatically |
| `ddg-lite` | DuckDuckGo Lite | Free | Lightweight version; same rate-limit behavior as above |
| `bing` | Bing | Free | **Default engine**, most stable; default Bing market `zh-CN` (configurable) |
| `anysearch` | AnySearch AI | Free | AI search, no key needed (anonymous quota) |
| `searxng` | SearXNG Meta Search | Free | Multi-instance automatic failover; supports custom instances |
| `exa` | Exa | Free | **Usable without a key** (anonymous MCP); configure a key for higher quota |
| `tavily` | Tavily | Free | **Usable without a key** (keyless anonymous); configure a key for higher quota |
| `keenable` | Keenable | Free | **Usable without a key** (anonymous MCP); configure a key for higher quota |
| `firecrawl` | Firecrawl | Free | **Usable without a key** (official keyless anonymous quota); configure a key for higher limits |
| `parallel` | Parallel | Free | **Works without a key** (official MCP anonymous quota); a key raises limits and enables precise time filtering |
| `perplexity` | Perplexity | Paid | Requires `PERPLEXITY_API_KEY` |
| `serpbase` | SerpBase | Paid | Requires `SERPBASE_API_KEY` (serpbase.dev, 100 free queries on signup) |
| `deepseek-official` | DeepSeek Official | Paid | Requires `DEEPSEEK_API_KEY` |

- **Default engine is `bing`** (free and most stable), ready to use out of the box after installation.
- **Auto-failover**: any engine failure (rate-limited free engine, or missing/invalid paid key, network error) automatically tries the next engine — the configured engine first, then other engines (exa/tavily/keenable/firecrawl/parallel are tried even without a key because they have built-in keyless quota), then the remaining free engines (Bing/AnySearch etc.) — with a note attached to the results naming the engine that actually served them (e.g. `Note: perplexity unavailable or failed, using exa.`). Search never fails outright because of engine issues.
- **Official Links in Settings**: Free engines display "Visit Website →", while paid engines display "Get API Key →" (opens in a new tab):
  - Exa: <https://dashboard.exa.ai/api-keys>
  - Tavily: <https://app.tavily.com/home>
  - Keenable: <https://keenable.ai/login>
  - Parallel: <https://platform.parallel.ai>
  - Perplexity: <https://www.perplexity.ai/settings/api>
  - SerpBase: <https://serpbase.dev>
  - DeepSeek: <https://platform.deepseek.com/api_keys>

#### Why are some engines free?

- **AnySearch**: its `v1/search` REST endpoint provides anonymous public search quota without registration or an API key. Quota is rate-limited (fine for daily queries), but as one of the free engines with mutual fallback it stays reliable.
- **Exa**: its public MCP endpoint (`mcp.exa.ai/mcp`) supports anonymous requests, so it works without a key; configuring `EXA_API_KEY` grants a higher usage quota.
- **Tavily**: offers keyless anonymous quota via the `x-tavily-access-mode: keyless` header — it works without a key; configuring `TAVILY_API_KEY` switches to the account tier for higher quota and more stable results.
- **Keenable**: without a key it is called via its public MCP endpoint (`api.keenable.ai/mcp`); configuring `KEENABLE_API_KEY` switches to the REST API (`api.keenable.ai/v1/search`) for higher quota and organization-scoped rate limits.
- **Firecrawl**: its `/v2/search` endpoint works **without a key** out of the box (the official docs state "No API key needed to get started", with anonymous rate limits); configuring `FIRECRAWL_API_KEY` raises the limits. Supports `tbs` time filtering (`qdr:h/d/w/m/y` and custom date ranges).

### Installation

```sh
git clone https://github.com/DDDMUC/dsh-free-search.git
dsh plugin --profile web add /path/to/dsh-free-search
```

Then restart:

```sh
dsh web
```

#### Sister Plugin: dsh-preset-workbench

A **sister plugin** by the same author: a **visual workbench for creating/editing agent presets** right inside Settings — sectioned prompts, 15 capability toggles, and built-in "Whale Girl / Liangshen Mode" templates, no YAML needed. Pair them up: **free-search gives your AI web search, preset-workbench shapes its persona & capabilities** — both free and zero-config.

- Repo: <https://github.com/DDDMUC/dsh-preset-workbench>
- Install: `dsh plugin --profile web add github:DDDMUC/dsh-preset-workbench`
- Usage: Settings → Preset Workbench

If preset-workbench is useful to you too, a ⭐ on its repo is always welcome. 🙏

#### Dependency Note

This plugin intentionally specifies `@deepseek-ai/dsh-settings` and `@deepseek-ai/dsh-tools` as `peerDependencies`: the DSH runtime must use a single instance from the installation tree. Always install the plugin using `dsh plugin --profile <profile> add ...`. Do **not** copy DSH core packages into a profile-local `node_modules`, as duplicate copies can break the tool scheduler.

### Usage

#### Web Settings (Recommended)

After installation, open the config page (DSH 0.1.7-rc.1+):

- Sidebar **Plugins** page → **Installed** group → `free-search` → click the `web-search-free` component row (the row's "configure" entry)

The config page provides:

- **Search engine**: Select an engine from the dropdown; changes take effect immediately upon saving.
- **API keys**: Enter keys for Exa / Tavily / Keenable / Firecrawl / Parallel / Perplexity / DeepSeek (password fields; displayed as "configured" once saved; Exa / Tavily / Keenable / Firecrawl / Parallel work without a key too).
  - **Recommended**: store paid-engine keys in the harness credential center `~/.dsh/.credentials.yaml` (e.g. `DEEPSEEK_API_KEY: sk-...`, same as the official LLM providers — one place for all keys). Resolution order: credentials center > settings page > environment variable; the settings-page fields remain for backward compatibility.
- **Test engine**: Tests the selected engine directly (no fallback chain; paid engines without a key report an explicit error).
- **Use Bing default**: stage a switch back to the stable free Bing engine; `Discard` only cancels unsaved edits
- **Platform search**: check platforms (GitHub / V2EX / Bilibili / Reddit / HN / Stack Overflow / Wikipedia / npm) to enable them for the `platform_search` tool (disabled platforms are skipped).

<table align="center" style="border: none; border-collapse: collapse;">
  <tr style="border: none;">
    <td align="center" width="50%" style="border: none; padding: 6px;">
      <a href="https://raw.githubusercontent.com/DDDMUC/dsh-free-search/master/assets/settings-free.png">
        <img src="https://raw.githubusercontent.com/DDDMUC/dsh-free-search/master/assets/settings-free.png" alt="Free Engine Settings" width="100%" />
      </a>
      <br>
      <sub>▲ <b>Free Engine</b> (shows green FREE badge and official website link)</sub>
    </td>
    <td align="center" width="50%" style="border: none; padding: 6px;">
      <a href="https://raw.githubusercontent.com/DDDMUC/dsh-free-search/master/assets/settings-apikey.png">
        <img src="https://raw.githubusercontent.com/DDDMUC/dsh-free-search/master/assets/settings-apikey.png" alt="Paid/API Key Engine Settings" width="100%" />
      </a>
      <br>
      <sub>▲ <b>Paid / API Key Engine</b> (shows orange API KEY badge and link to get an API key)</sub>
    </td>
  </tr>
</table>

#### Switching Engines from the Chat (/free-search-engine)

You can also switch the engine right from the chat — no need to open the settings page. Type `/free-search-engine`: a **picker opens with all engines** (the same interaction as `/model` for selecting a model). Click one to switch; the current engine is marked. Equivalent to switching and saving in the settings page.

The command only changes the preferred engine; search still goes through `web_search` + the unified fallback chain — even if the preferred engine fails, it automatically switches to others, never failing outright. The system prompt refreshes accordingly.

#### Configuration File

Since DSH 0.1.7-rc.1 the configuration is stored with the profile's plugin entry: the settings page and `/free-search-engine` both write the `config` of the `web-search-free` (`dsh-free-search`) entry in the active profile's `cordis.patch.yml`. The old `free-search:` section of `~/.dsh/settings.yaml` is imported once at startup; the file is then renamed to `settings.yaml.imported`.

```yaml
# config of that entry in profiles/<profile>/cordis.patch.yml:
provider: bing              # ddg / ddg-lite / bing / searxng / anysearch / exa / tavily / keenable / firecrawl / parallel / perplexity / serpbase / deepseek-official
lang: en                    # search localization (Wikipedia host, SerpBase hl/gl); default en
bingMarket: zh-CN           # Bing market
region: cn-zh               # DuckDuckGo region (optional)
searxngInstances:           # Custom SearXNG instances (optional)
  - https://your-instance.example
exaApiKey: ...              # Or configure via the web settings UI
tavilyApiKey: ...           # Or configure via the web settings UI
keenableApiKey: ...         # Or configure via the web settings UI
firecrawlApiKey: ...        # Or configure via the web settings UI
parallelApiKey: ...         # Or configure via the web settings UI
perplexityApiKey: ...
serpbaseApiKey: ...         # Or configure via the web settings UI
deepseekApiKey: ...
```

#### Asking the Agent to Test All Engines

Tell the agent *"Test all search engines"*, and it will call the `free_search_test` tool to check each engine sequentially and report back:

```
Search engine test:
- ddg: FAIL - DuckDuckGo is rate-limited right now (anti-bot challenge, usually temporary) - Bing works
- bing: OK (2 results, e.g. "DeepSeek Harness developer preview...")
- exa: FAIL - EXA_API_KEY not configured
```

#### Time Filtering (`advanced_search`)

Ask the agent for *"news from the last week"*, *"releases this month"*, *"updates from the last 3 days"*, or *"posts since July"*, and it will call the `advanced_search` tool with a `timeRange` parameter. It uses the same unified fallback chain, can force a specific `engine`, and returns the same shape as `web_search`.

**The `timeRange` parameter accepts three forms:**

| Form | Example | Meaning |
|---|---|---|
| Fixed tier | `day` / `week` / `month` / `year` | = 1 / 7 / 30 / 365 days |
| Custom relative | `12h`, `3d`, `2mo`, `1y` | last 12 hours / 3 days / 2 months / 1 year |
| Absolute date | `2026-07-01` | results published on or after that date |

**How each engine handles `timeRange`:**

| Engine | Parameter | Precise? | Notes |
|---|---|---|---|
| Exa | `startPublishedDate` | ✅ precise | custom days become an ISO date (N days ago); absolute dates pass through |
| Keenable | `published_after` | ✅ precise | relative values (`12h/3d/2mo/1y`) and absolute dates pass through |
| Tavily | `time_range` | ⚠️ approximate | only fixed tiers; custom days map to the nearest tier |
| Firecrawl | `tbs` | ⚠️ approximate | fixed tiers map to `qdr:d/w/m/y`; absolute dates use `cdr:1,cd_min:M/D/YYYY` (precise) |
| Parallel | `source_policy.after_date` with a key (precise); without a key the MCP path has no date parameter, so the window is written into the objective as a freshness hint (soft filter) | ✅ precise / ⚠️ soft | custom days become an ISO date (N days ago); absolute dates pass through |
| SearXNG | `time_range` | ⚠️ approximate | same as above |
| DuckDuckGo / Lite | `df` | ⚠️ approximate | same as above |
| Bing / AnySearch | — | ❌ ignored | no corresponding parameter |

**Nearest-tier mapping rule**: `≤2 days → day`, `≤14 days → week`, `≤90 days → month`, otherwise `year`. For example, `3d` becomes `day` on Tavily, and `2mo` becomes `month`.

**Engine-chain priority**: when a `timeRange` is present, engines that support time filtering (tavily / exa / keenable / firecrawl / parallel / searxng / ddg / ddg-lite) are moved to the front of the fallback chain, so the filter actually takes effect — even if the preferred engine is bing (which does not support filtering), a filtering-capable engine is tried first.

Example: *"Find DSH news from the last 3 days"* → agent calls `advanced_search` with `timeRange: "3d"`.

#### Fetch Webpage Content (`web_fetch`)

After searching, the agent can **read full webpage content** (e.g., *"Open the first link and summarize it"*). The `web_fetch` tool is enabled by default (official `dsh-web-fetch-http` provider):

- Automatically follows redirects and decodes HTML to plain text.
- Supports timeout and response size limits.
- ⚠️ Note: `web_fetch` does not have SSRF protection; the agent could theoretically access internal network addresses. Use as needed.

#### Platform Search (`platform_search`)

Ask the agent to search specific platforms (e.g., *"Search GitHub for deepseek harness"*, *"Find related videos on Bilibili"*, or *"Discussions about dsh on V2EX"*). The `platform_search` tool supports:

| Platform | Purpose |
|---|---|
| `github` | GitHub repository search (public API, free, no key required) |
| `v2ex` | V2EX hot / relevant topics |
| `bilibili` | Bilibili video / content search (public API) |
| `reddit` | Reddit posts / discussions (public JSON API; may be blocked by Reddit anti-bot in some network environments) |
| `hn` | Hacker News tech community discussions (official Algolia API) |
| `stackoverflow` | Stack Overflow Q&A (official public Stack Exchange API) |
| `wikipedia` | Wikipedia articles (en.wikipedia.org by default; `lang: zh` selects zh.wikipedia.org) |
| `npm` | npm package search (registry official API) |

All platform searches rely on public endpoints with zero external dependencies and no API keys — they work out of the box.

### Local Engine Switcher (`tools/`)

The `tools/` directory includes a lightweight, zero-dependency switcher:

- **`start-engine-switcher.cmd`** (Windows) — Double-click to launch a local Node server (`http://127.0.0.1:4789`) and automatically open the engine selector page in your browser.
- **`switch-engine.html`** — The selector UI: displays current engine status and allows one-click switching.
- **`server.mjs`** — The local backend service responsible for reading/writing `~/.dsh/profiles/web/cordis.patch.yml`.
- **`switch-engine.ps1`** — Headless PowerShell script: `powershell -File tools/switch-engine.ps1 -Engine bing`.
- **`start-deepseek-harness.cmd`** (Windows) — Starts `dsh web` with proxy environment variables set (port 3080) and opens the browser; exits immediately if it is already running.

Restart `dsh web` after switching to apply changes.

> The settings card mounts into the official `plugins.row.config` component-row slot on the sidebar Plugins page (built into DSH), and configuration reads/writes go through the plugin's own bridge. **No `dsh-web-ui` dependency — the plugin can be used standalone.**

### Proxy Note (for Users in Mainland China)

Engines like DuckDuckGo may require a proxy. Since Node.js `fetch` does not use the system proxy by default, set the following environment variables for the dsh process (Node 24+):

```sh
export NODE_USE_ENV_PROXY=1
export HTTPS_PROXY=http://127.0.0.1:7897   # Your proxy address
export HTTP_PROXY=http://127.0.0.1:7897
```

Windows users: The desktop shortcut already includes this configuration (`set NODE_USE_ENV_PROXY=1&& set HTTPS_PROXY=...`).

### How It Works

- `lib/index.js`: Host side. Implements `WebSearchProvider` (`id` / `available()` / `search()`), unified engine routing + auto-fallback (paid engines first, free as fallback); parses `timeRange` (fixed tiers / relative values / absolute dates) and forwards it to each engine; declares its editable config as volatile fields on the `web-search-free` composition entry and ships its own settings page (`plugins.row.config`); provides the `/api/dsh-free-search-settings` read/write bridge + `raw-search` debug endpoint; registers the `free_search_test`, `platform_search`, and `advanced_search` tools; dynamically injects the engine list into system prompts (auto-refreshes on settings change).
- `lib/client.js`: Browser side. React configuration card (engine select, key inputs, connectivity test), mounted into the official `plugins.row.config` component-row slot on the sidebar Plugins page; registers the `/free-search-engine` popup switch command (`commandUi` popupSelect, the same mechanism as `/model`).
- `cordis.patch.yml`: Plugin loader configuration.

### Safe Search Filter (`safeSearch`)

- New `safeSearch` option: `off` (engine default, no extra parameter) / `moderate` / `strict`
- Applies to Bing (adlt), DuckDuckGo HTML (adlt) and DuckDuckGo Lite (adlt)
- Default `off`: no extra filtering, the engine's own behavior is kept; switch it under Settings > Plugins > Free Search when needed

### License

MIT
