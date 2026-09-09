# HUD Platform 0.1 — Existing HUD Implementation Inventory

**Status:** Internal working document — Migration Stage 1 (Architecture §40)
**Version:** 0.1
**Story:** `IncusLuminis/assets#2` (Epic #22, board `IncusLuminis/projects/7`)
**Feeds:** #4 (HUD Theme Contract 1.0), #3 (manifest JSON Schema)
**Scope:** HUD-01, HUD-02, HUD-03, HUD-04 only. HUD-05/06 excluded — see §0.2.
**Date:** 2026-09-09

---

## 0. Preface — how to read this, and two blocking discoveries

### 0.1 Sources inspected

Every claim below is traceable to a file path (and, where useful, a line number) in
the working checkout `IncusLuminis/shared/assets/` on branch `agent/mini-raw-video`,
or to a line in the pre-existing audit `widgets/docs/audit-hud01-06.md`
(dated 2026-05-24). Where this inventory and the audit disagree, the audit is
flagged **[AUDIT STALE]** and the code wins.

Primary inputs:

| Input | Path | Notes |
|---|---|---|
| Existing audit | `widgets/docs/audit-hud01-06.md` | Strong starting point; several sections now stale (§7 below) |
| Migration report | `widgets/docs/migration-report.md` | 2026-05-22; describes panel JS as "passive stub" — very stale |
| Widget contract | `widgets/docs/widget-contract.md` | Aspirational; the panels already violate parts of it (§11) |
| Styling rules | `widgets/docs/styling-rules.md` | Same — panels drifted from it |
| HUD-01 sources | `widgets/panels/hud-01/{index.html,hud-01.css,hud-01.js,README.md}` | 240 / 1267 / 1238 / 510 lines |
| HUD-02 sources | `widgets/panels/hud-02/{index.html,hud-02.css,hud-02.js,README.md}` | 221 / 1112 / 1058 / 33 lines |
| HUD-03 sources | `widgets/panels/hud-03/{index.html,hud-03.css,hud-03.js,README.md}` | 113 / 561 / 36 / 41 lines |
| HUD-04 sources | `widgets/panels/hud-04/{index.html,hud-04.css,hud-04.js,README.md}` | 126 / 635 / 72 / 42 lines |
| Shared CSS | `widgets/shared/css/{reset,tokens,base,animations,typography,layout,effects,mini-toggle}.css` | 40 / 45 / 136 / 121 / 62 / 193 / 217 / 81 lines |
| Shared JS | `widgets/shared/js/{hud-core,hud-mini,hud_papers,hud-loader,staging-svg-panels}.js` | 102 / 559 / 210 / 87 / 421 lines |
| HUD Playground | `products/visualization-studio/visualization-studio-tools/hud-playground/index.html` (2544 lines) | see §0.3 |

### 0.2 HUD-05 / HUD-06 are out of 0.1 scope

- **HUD-05 (`widgets/panels/hud-05/`, `nc-vv-*`) — Wide Video Panel.** Frame is a
  JS-drawn SVG (`hud-05.js` `drawWideVideoFrame()` runs on `DOMContentLoaded` +
  `ResizeObserver`). Runtime-computed geometry → belongs to the **Video / Static**
  renderer family, Platform **0.2** (Architecture §50, §51; Plan §1 naming note).
- **HUD-06 (`widgets/panels/hud-06/`, `nc-vs-*`) — Vertical Sidebar.** Same
  JS-drawn-SVG + `ResizeObserver` mechanism, portrait viewBox `320×480`. Same
  reason: runtime-drawn geometry, Video renderer, Platform 0.2.

Neither is packaged, contract-mapped, or validated in 0.1. HUD-07/08 also exist on
disk (`widgets/panels/hud-07/`, `hud-08/`) and are likewise out of scope.

### 0.3 BLOCKING DISCOVERY 1 — the migration input is not under version control

`widgets/panels/hud-01..08/`, `widgets/shared/css/`, `widgets/shared/js/`,
`widgets/docs/` and `widgets/playground/` are **untracked** in git
(`git status` shows `?? widgets/panels/` … on `agent/mini-raw-video`) and are
**absent from every branch**, including the integration branch
`feature/hud-platform-0.1` and `main` (`git ls-tree -r <branch> -- widgets/panels/`
returns nothing on all of them). They are *not* covered by `.gitignore`
(`git check-ignore` → not ignored); only the two `.png` assets under
`widgets/shared/assets/` are ignored by the raster rule.

What *is* tracked under `widgets/` is a **different** set of files —
`widgets/sandbox/blogger-hud01-02-wip/blogger-hud0{1,2}-template.{css,js}`,
`blogger-hud-shared.css`, `widgets/shared/js/hud-mini.js` — i.e. the
"blogger-template" lineage (§0.4), not the panel lineage this story inventories.

**Consequence:** Stories #11–#15 (Theme packaging) and the "every claim traceable
to a committed file" expectation both require these sources to exist on a branch.
**Owner / Coder action before P5:** commit the
`widgets/panels/hud-0N/` + `widgets/shared/` + `widgets/docs/` tree onto
`feature/hud-platform-0.1` (Plan §3 already lists `widgets/` as a retained
migration input — it just is not there yet). This inventory was produced against
the working-tree copy; treat the paths as authoritative once committed.

### 0.4 BLOCKING DISCOVERY 2 — there are two divergent HUD lineages, and the Playground loads the *other* one

Plan §1 says the Playground is "an `index.html` + a **copy** of the same
`widgets/` tree [that] loads panels directly, not through any runtime."

Reality:

1. `hud-playground/widgets` is a **symlink** to `shared/assets/widgets`
   (`ls -la` → `widgets -> ../../../../shared/assets/widgets`), not a copy.
2. `hud-playground/index.html` does **not** load `widgets/panels/hud-01..04/` at
   all. Its `<head>` loads
   `widgets/sandbox/blogger-hud01-02-wip/blogger-hud-shared.css`,
   `blogger-hud01-template.css`, `blogger-hud02-template.css`,
   `widgets/releases/blogger-pilot-hud03/blogger-hud03-template.css`,
   `widgets/panels/hud-10/assets/blogger-hud10-template.css`, plus
   `blogger-hud0{1,2}-template.js`, `hud0{1,2}-frame-adapt.js`, `hud-mini.js`,
   `hud_papers.js` and `Details.js`
   (`hud-playground/index.html:12-29`).

So the **canonical standalone panels** (`widgets/panels/hud-0N/`, documented by
`audit-hud01-06.md`, named by Plan §1 as the migration input) and the
**blogger-template panels** actually rendered in the Playground and shipped to
Blogger have **diverged**. The blogger-template lineage additionally carries:

- a `data-collapse` attribute with **three** values `maxi | mini | micro`
  (`hud-playground/index.html:674-679`), i.e. the closest existing thing to the
  Platform's variant model — and it is *not* in the panel lineage;
- an extensive CSS-custom-property theming system
  (`--nc-toggle-{maxi,mini,micro}-{top,left,scale}`, `--nc-title-*`,
  `--nc-image-*`, `--nc-video-*`, `--nc-micro-w/-h`, `--nc-aladin-*` …;
  `hud-playground/index.html:775-903`) that the panel-lineage CSS does not use;
- **HUD-10**, a portrait ("9:16-ish") panel that has no equivalent in
  `widgets/panels/hud-01..06/`.

**Consequence for #4 / #14 / #16:** "migrate the Playground to Runtime loading"
(#14) is not a matter of swapping a loader call — the Playground consumes a
different, richer implementation than the one being packaged. The owner must
decide **which lineage the 0.1 Themes are cut from**:
(a) `widgets/panels/hud-0N/` (this inventory's subject, matches audit + Plan), or
(b) `widgets/sandbox/blogger-hud01-02-wip/` + `releases/blogger-pilot-hud03/`
(what actually ships and what the Playground shows, and which already has
maxi/mini/micro + 9:16 via HUD-10).
This inventory documents lineage (a) as instructed, and flags every place
lineage (b) would change the answer.

---

## 1. Per-HUD inventory

Recording model: Architecture §40 Stage 1
(files · dependencies · renderer tech · HTML/CSS/SVG structure · JS deps ·
animation · data injection · mini/maxi · form factor · global assumptions).

---

### HUD-01 — "Object Lock" (`nc-ol-*`, root `.nc-hud-01`)

#### 1.1 Source location(s)

| | Path |
|---|---|
| Canonical panel | `widgets/panels/hud-01/{index.html, hud-01.css (1267), hud-01.js (1238), README.md (510)}` |
| Shared foundation | `widgets/shared/css/*` + `widgets/shared/js/{hud-core.js, hud_papers.js}` |
| Playground copy | **none** — Playground loads `widgets/sandbox/blogger-hud01-02-wip/blogger-hud01-template.{css,js}` + `hud01-frame-adapt.js` instead (`hud-playground/index.html:13,25,27`). Divergent lineage — §0.4. |
| Blogger embed | separate `<iframe src=".../hud-01/index.html">` per `audit §6` |

#### 1.2 Rendering technology

**SVG frame + CSS/HTML content + heavy JS.** Confirms the Arch §39 provisional
mapping **HUD-01 → SVG renderer family**.

- Frame: an inline `<svg class="nc-ol-frame-svg" viewBox="0 0 1200 420"
  preserveAspectRatio="none">` with hand-authored `<path d="M22 42 L112 42 …Z">`
  polygons — outer frame line, inner border, photo-area top/bottom lines, two
  side tabs, a sliding top `<rect>`, and **four coincident `<path>` copies** of
  the outer polygon for the contour-glow runner (`index.html:60-88`).
  `preserveAspectRatio="none"` + `vector-effect: non-scaling-stroke`
  (`hud-01.css:85`) → the frame **distorts** below 1200 px width but strokes stay
  1–2 px. This is a deliberate "stretch the box, keep the lines crisp" trick.
- Content (image well, reticle, data grid, toolbar, html-slot): plain
  positioned HTML + CSS, no SVG.
- Reticle: CSS-only (`<div>` rings/cross/corners with `border-radius` +
  `@keyframes hudRotate/hudPulseOuter/hudPulseInner`, `hud-01.css:141-283`).

#### 1.3 Files loaded + shared dependencies + load order

`index.html` `<head>`, in order (`index.html:17-41`):

1. inline `<script>` → `window.NC_HUD_01_CONFIG = { objectMode:true, vizierLimit:8 }`
2. Google Fonts: `<link rel=preconnect>` + `<link rel=stylesheet
   href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap">`
3. `../../shared/css/reset.css`
4. `../../shared/css/tokens.css`
5. `../../shared/css/base.css`
6. `../../shared/css/animations.css`
7. `../../shared/css/typography.css`
8. `../../shared/css/layout.css`
9. `../../shared/css/effects.css`
10. `./hud-01.css?v=16`

**HUD-01 does NOT load `mini-toggle.css` or `hud-mini.js`** — it has its own
inline mini/expanded implementation (§1.9). This part of the audit
(`audit §7` load-order note `[mini-toggle.css]`) is correct that it is optional;
`audit §2` implies `hud-mini.js` is "used by HUD-02 through HUD-06" — HUD-01 is
correctly excluded there but see §7 for the audit's stale "no mini toggle" claim.

`<body>` end, in order (`index.html:236-238`):
`../../shared/js/hud-core.js?v=3` → `../../shared/js/hud_papers.js?v=3` →
`./hud-01.js?v=8`.

Per-file size: `hud-01.css` 1267 lines, `hud-01.js` 1238 lines
(largest of the four; the audit's "≈1270 / ≈1240" is right).

#### 1.4 External dependencies (all confirmed against code)

| Dependency | URL | When it loads | Where |
|---|---|---|---|
| Google Fonts — Share Tech Mono | `fonts.googleapis.com/css2?family=Share+Tech+Mono` (+ `fonts.gstatic.com` font files) | **page load** (`<link>` in `<head>`) | `index.html:25-26` |
| Aladin Lite v3 (JS + CSS) | `aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.{js,min.css}` | **lazy** — injected by `loadAladinScript()` on object-mode init (auto-init at `initObjectMode()`, `hud-01.js:232`), 15 s timeout; `<link>`/`<script>` appended to `document.head` | `hud-01.js:55-56, 419-455` |
| SIMBAD TAP (object data) | `simbad.cds.unistra.fr/simbad/sim-tap/sync` (POST ADQL, JSON) | **page load** — `loadSimbadData()` fired from `initObjectMode()`, 12 s timeout, NGC 1300 fallback table baked into JS | `hud-01.js:61, 602-664` |
| VizieR VOTable (CATALOGS tab) | `vizier.cds.unistra.fr/viz-bin/votable` | **lazy** — on first CATALOGS tab activation, 10 s timeout, hard-coded fallback catalog list | `hud-01.js:109, 793-882` |
| ADS / publications (PAPERS tab) | via `HudPapers.load()` → SIMBAD TAP `has_ref` join; abstract links → `ui.adsabs.harvard.edu` | **lazy** — on first PAPERS tab activation | `shared/js/hud_papers.js:25,173`; `hud-01.js:935-961` |

**Owner decision 2026-09-09 (Plan §7 item 4): these stay AS-IS — lazy inside the
Theme, not refactored.** Recorded here so #4's JS / external-resource policy
(Arch §43, §53.3) can allowlist them in the manifest. Note the two that fire at
**page load** (Google Fonts, SIMBAD) — a strict "no network on mount" policy
would break HUD-01 as-is.

#### 1.5 HTML / CSS / SVG structure

- Root: `<main class="nc-hud01-stage">` → `<div class="nc-hud-01 nc-ol-widget"
  data-mode data-target-lock data-reticle data-aladdin data-info-mode>` →
  `<div class="nc-ol-panel">` (`index.html:45-58`).
- `.nc-hud01-stage` = standalone-page wrapper only (`padding:32px 0; background:
  var(--hud-bg); min-height:100vh`, `hud-01.css:11-15`) — **must be dropped when
  embedded in a Runtime mount** (it assumes it owns the viewport).
- `.nc-ol-widget` — `position:relative; width:100%; overflow:hidden;
  background:#000; font-family:"Share Tech Mono"; max-height:600px;
  transition:max-height 700ms` (`hud-01.css:24-34`). `max-height` + `overflow`
  are the mini/expanded clip mechanism.
- `.nc-ol-panel` — `width:120px` (animates to `min(1200px,100%)` via
  `@keyframes ncOlOpenHud`), `height:420px` fixed, `display:grid;
  grid-template-columns:520px 1fr`, `transform-origin:top center;
  transition:transform 700ms` (drives the mini scale) (`hud-01.css:38-67`).
- **Frame mechanism:** SVG `<path>` polygons at `z-index:30`
  (`.nc-ol-frame-svg{position:absolute; inset:0; z-index:30; pointer-events:none;
  overflow:visible}` — `hud-01.css:71-79`). `overflow:visible` is **required** so
  the 4-layer blur runner isn't hard-clipped at the SVG viewport
  (`audit §8.7` — confirmed, `hud-01.css:78`).
- **z-index layering (raw integers, no tokens):** content columns 1–4 · sweep 3 ·
  Aladin layer 2 · progress bar 25 · SVG frame 30 · toolbar 35 · toggle button
  36 · tooltip 50 (`hud-01.css:76,114,127,149,289,301,395,452,566,912,1139,1189`).
- Class namespace: **`nc-ol-`** (Object Lock) for panel internals;
  **`nc-hud-01`** / **`nc-hud-01-*`** for the mode-scoped root + Aladin layer +
  html-slot; shared utility classes are bare `nc-*`.

#### 1.6 JavaScript dependencies & modules

- `hud-01.js` is a single **IIFE** `(function(){ 'use strict'; … })()`
  (`hud-01.js:35, 1238`), boots on `DOMContentLoaded` / immediately if already
  parsed (`hud-01.js:1232-1236`).
- **Globals it reads:** `window.NC_HUD_01_CONFIG` (`{objectMode, vizierLimit}`,
  read once at module scope, `hud-01.js:174-177`); `window.HUDCore` (via
  `hud-core.js`); `window.HudPapers` (via `hud_papers.js`); `window.A` (Aladin,
  after CDN load).
- **Global it writes:** `window.NcHud01 = { setTargetLock, setReticle,
  setAladdin, initAladin, setAladinTarget, setInfoMode, loadSimbadData,
  loadVizierReferences, loadPapers, setTarget, setMode, getMode }`
  (`hud-01.js:1215-1228`) — an imperative post-hoc control API.
- `hud-core.js` exposes `window.HUDCore` = `{ qs, qsa, el, zeroPad, clamp,
  EventBus, bootFlicker }` — pure, no side effects on load
  (`shared/js/hud-core.js:96-102`).
- `hud_papers.js` exposes `window.HudPapers` = `{ load, render, invalidate }`,
  in-module cache + `AbortController` (`shared/js/hud_papers.js:22, 208`). Used by
  HUD-01, HUD-02, HUD-03, HUD-05 per its own header (HUD-03/04 in *this* lineage
  do **not** load it — `audit`/header stale, or refers to blogger lineage).
- **Single-instance-per-page:** `init()` does
  `widget = document.querySelector('.nc-hud-01')` (first match only,
  `hud-01.js:182-183`). `hud-01.js` header line 30-31 states the limitation
  explicitly ("scoped to the FIRST .nc-hud-01 … Multi-instance support requires
  an instance factory pattern"). Confirms `audit §8.1`.
- Event listeners added and **never removed**: toolbar `click` ×4, panel
  `animationend` (`{once:true}`), toggle `click`, panel `click`, `document`
  `keydown` (Escape → collapse, `hud-01.js:353-357`), plus Aladin's own
  listeners. No teardown path → **fails Arch §41 "event-listener leaks" and §43
  "cleanup is mandatory"** as-is.

#### 1.7 Animation mechanisms

| Animation | Mechanism | Source |
|---|---|---|
| Panel open (`120px → min(1200px,100%)`) | local `@keyframes ncOlOpenHud` 1.2 s, `forwards`; JS clears frozen `width` on `animationend` to restore fluidity (`hud-01.js:223-225`) | `hud-01.css` local |
| Panel breathing box-shadow | shared `@keyframes hudBreath` 5 s infinite | `animations.css:53-66` |
| Progress-bar scanner | shared `@keyframes hudProgressScan` on a child inside `overflow:hidden` | `animations.css:103-106`; `hud-01.css:385-427` |
| Reticle rings | shared `hudRotate` (10 s), `hudPulseOuter` (4 s), `hudPulseInner` (2.5 s) | `animations.css`; `hud-01.css:166-181` |
| Lock-box corners | shared `hudLockBoxPulse` 3.2 s | `animations.css:87-90` |
| TARGET LOCK label | shared `hudBlinkSoft` 1.4 s | `animations.css:81-84` |
| SVG top tab slide | local `@keyframes ncOlTopSvgSlider` 5 s | `hud-01.css:108` |
| Diagonal sweep beam | shared `.nc-panel-sweep` (geometry) + `@keyframes hudPanelSweep`; `.nc-ol-sweep` sets `z-index:3; opacity:.5` | `effects.css:198-217`; `hud-01.css:113-116` |
| **Contour-glow runner (4-layer SVG blur)** | 4 coincident `<path>` copies of the outer polygon, animated `stroke-dashoffset` around the perimeter at **22 s**; layers: wide aura 72 px `blur/large` → mid-outer 32 px → mid-inner 10 px → sharp centre line 2 px no-blur; `stroke-dasharray: 120 2956` (`hud-01.css:1197-1256`). Needs the SVG `overflow:visible`. `audit §8.8` notes perf risk on old mobiles — carried as-is (Plan §9.4). | `hud-01.css:1197-1256` |

No SMIL. Animations are CSS-keyframe or JS-nudged CSS.

#### 1.8 Data-injection mechanism (**most important for #4**)

Four distinct, uncoordinated mechanisms today:

1. **`window.NC_HUD_01_CONFIG`** — inline `<script>` at the top of `index.html`;
   fields `objectMode:boolean` and `vizierLimit:1–20`. Read **once** at module
   load (`hud-01.js:174`). Not reactive.
2. **`objectMode` switch** — `true` → object viewer (reticle / Aladin / SIMBAD /
   VizieR / ADS); `false` → generic HTML frame. Toggles which subtree is visible
   via `.nc-hud-01[data-mode="html"]` CSS rules (`hud-01.css:900-905`) and skips
   all network init (`hud-01.js:193-197, 366-380`).
3. **Direct `index.html` edit** — object title in `<h2 class="nc-ol-title">`,
   photo in `<img class="nc-ol-image" src>`, and in HTML mode the **entire body**
   is pasted raw between the `▼ PASTE BLOGGER HTML HERE ▼` markers inside
   `<div class="nc-hud-01-html-slot">` (`index.html:198-226` — currently holds a
   full Russian-language blog post with inline Blogger `<img>` markup).
4. **`window.NcHud01.*` runtime setters** — `setTarget()`, `setMode()`,
   `setInfoMode()`, `setAladinTarget()`, `loadSimbadData()` … a post-mount
   imperative API (`hud-01.js:1215-1228`), currently unused by the standalone
   page but available to an embedder.

The SIMBAD/VizieR/ADS content is **fetched, not injected** — the consumer supplies
only an object *name*; the panel owns the query and the rendering. This is exactly
the domain logic Vision §12 says a Theme must not contain — see §12 and Handoff.

#### 1.9 Current `mini` / `maxi` behaviour  **[AUDIT STALE — and the issue #2 AC is wrong here]**

The audit (`§4 HUD-01`, `§5 feature matrix`) and **issue #2's own acceptance
criteria** say *"HUD-01 has **no** mini toggle today."* **This is false in the
current code.** `hud-01.js` has an `initExpandCollapse()` function (labelled
"HUD01-7", `hud-01.js:238-362`) that:

- injects its **own** `<button class="nc-ol-toggle-btn">` into `.nc-ol-panel`
  (not `NcHudMini` — HUD-01 reimplements it inline, ~125 lines);
- **starts the panel collapsed** (`collapse()` called at the end of init,
  `hud-01.js:361`);
- `collapse()` adds `.is-mini`, sets `data-aladdin="off"` (so the photo shows
  large), `cursor:pointer`; `expand()` removes `.is-mini`, restores Aladin,
  creates the deferred Aladin instance if the CDN loaded while mini
  (`hud-01.js:288-295`);
- mini visual = `.nc-ol-panel` scaled to `scale(0.352)` via the transform
  transition (`hud-01.css:~1119-1126`); the toggle button counter-scales so it
  stays readable;
- `Escape` collapses; click anywhere on the mini panel expands.

So HUD-01 today is a **two-state** panel: **collapsed (mini) on load** ↔ expanded.
There is still **no `maxi` concept** and no third density — expanded HUD-01 *is*
what would become `maxi`.

**Recommended mapping onto Platform `mini` + `maxi`:**

| Platform variant | HUD-01 today | Notes for #4 |
|---|---|---|
| `maxi` (REQUIRED) | the **expanded** state — full 1200×420 grid, reticle + Aladin + DATA/PAPERS/CATALOGS toolbar | authored composition; drop `data-collapse`, force expanded, no toggle button |
| `mini` (REQUIRED) | the **collapsed** state — `scale(0.352)` crop of the panel, Aladin off, photo dominant, title visible | today it's a mechanical `transform:scale()` of the maxi DOM — **Arch §13 "not a scale factor" / §14 "MUST NOT mechanically scale" is violated**. #4 must decide: author a real reduced-density mini composition, or accept the transform-scale crop as a documented 0.1 compromise. |
| `micro` (OPTIONAL) | none in this lineage | the blogger lineage's `data-collapse="micro"` + `--nc-*-micro-*` vars (§0.4) is the only `micro` that exists; Plan §7 item 5 asks the owner to confirm `micro` stays out of 0.1. |

#### 1.10 Current form-factor behaviour

- One composition only: **landscape ~1200 × 420** (`viewBox="0 0 1200 420"`,
  `.nc-ol-panel{height:420px}`), fluid width down to a `@media (max-width:900px)`
  mobile reflow (`hud-01.css:1053+`).
- **No distinct 9:16 composition.** `preserveAspectRatio="none"` stretches the
  frame, it does not re-compose it. Per Vision §10 / Arch §14 / §54.14 a portrait
  HUD-01 **must be authored**, not derived. **Gap for #18.**

#### 1.11 Global assumptions / isolation risks

| Risk | Evidence | Severity for isolation |
|---|---|---|
| **Host-wide CSS selectors in the shared layer** — `*, *::before, *::after {box-sizing;margin;padding}` and `html{}` + `body{}` in `reset.css`; `body{background;color;font-family;min-height:100vh}` in `base.css` | `reset.css:3-18`; `base.css:4-10` | **High** — Arch §42 forbids exactly these; they will repaint the host `<body>`. Must be stripped / scoped at packaging (§13). |
| `:root { --hud-* }` custom properties in `tokens.css` | `tokens.css:3-45` | Low-Med — global but namespaced `--hud-*`; safe to keep if re-rooted on the Theme container. |
| `.nc-ol-widget *` universal-descendant reset (`box-sizing:border-box`) | `hud-01.css:19-22` | Low — scoped, but resets every descendant incl. injected consumer HTML in the html-slot. |
| `overflow:visible` on the frame SVG | `hud-01.css:78` | Med — the glow runner **paints outside the panel box**; a Shadow-DOM / clipped mount will crop it. |
| Google Fonts `<link>` in `<head>` | `index.html:25-26` | Med — under **Shadow DOM** an external `@import`/`<link>` in the shadow root does not inherit; font must be loaded in the host `<head>` or `@font-face`-inlined. Arch §41 "font overrides". |
| Aladin Lite injects its own `<script>`/`<link>` into `document.head` and builds its own DOM/CSS | `hud-01.js:419-455` | **High for Shadow DOM** — Aladin assumes a light-DOM document; Plan §2.8 explicitly makes Shadow DOM "validated, not assumed" for exactly this. |
| Blogger strips `<script>` from HTML gadgets → iframe-only embedding | `audit §8.5` | Context — the *reason* everything is a standalone page; not a Runtime concern but explains the architecture. |
| Single global instance names (`NcHud01`, `NC_HUD_01_CONFIG`, `#nc-hud-01-aladin-viewer` id) | `hud-01.js` throughout | Med — two HUD-01s on one page collide (ids + globals + first-match query). |
| Raw integer z-index up to 50 | §1.5 | Low-Med — can collide with host stacking contexts; Arch §41 "z-index collisions". |
| No lifecycle teardown | §1.6 | **High** — Arch §43 "cleanup is mandatory". |

#### 1.12 Candidate semantic slots (first pass → #4)

| Slot (Arch §15 vocab) | HUD-01 element(s) | Notes |
|---|---|---|
| `title` | `<h2 class="nc-ol-title">` (`index.html:141`) | also reused as heading inside html-slot |
| `media` / `visualization` | `<img class="nc-ol-image">` + `.nc-hud-01-aladdin` viewer + `.nc-ol-reticle` overlay | image is consumer data; Aladin + reticle are Theme-owned decoration driven by a *coordinate/name* input |
| `primary` (structured data) | `#nc-hud01-data-panel` DATA grid rows | **currently fetched from SIMBAD** — see below; consumer input is an object name, not the rows |
| `secondary` | CATALOGS panel (VizieR) + PAPERS panel (ADS) | same — fetched, tab-switched |
| `controls` | `.nc-ol-toolbar` (RETICLE toggle + DATA/PAPERS/CATALOGS tabs) | Theme-owned chrome, not consumer content |
| `status` | `.nc-ol-data-status` ("QUERYING SIMBAD…"), TARGET LOCK label, progress bar | Theme-owned |
| `content` (freeform) | `.nc-hud-01-html-slot` (HTML mode) | the one true "consumer supplies arbitrary HTML" slot today |
| `footer` | — | none distinct |

Open question for #4: HUD-01 has **two personalities** (object-viewer vs
html-frame). Does the Contract model that as one Theme with a capability flag, or
two Themes? (see Handoff.)

---

### HUD-02 — "Object Report" (`nc-or-*`, root `.nc-hud-02`)

Functional mirror of HUD-01 with a different frame shape and a **shared**
mini toggle. Everything below is *delta vs HUD-01*.

#### 1.13 Source, tech, files

- `widgets/panels/hud-02/{index.html (221), hud-02.css (1112), hud-02.js (1058), README.md (33)}`.
- Playground copy: **none** — `blogger-hud02-template.{css,js}` +
  `hud02-frame-adapt.js` instead (`hud-playground/index.html:14,26,28`).
- **SVG renderer family** (Arch §39) — confirmed.
- Load order identical to HUD-01 **plus** `../../shared/css/mini-toggle.css?v=3`
  (`index.html:41`) and, at `<body>` end,
  `../../shared/js/hud-mini.js?v=3` **before** `./hud-02.js?v=2`
  (`index.html:216-219`). Scripts: `hud-core.js` → `hud_papers.js` →
  `hud-mini.js` → `hud-02.js`.

#### 1.14 Frame / SVG structure — **different polygon, different z-index**

- `<svg class="nc-or-frame-svg" viewBox="0 0 1200 420" preserveAspectRatio="none">`
  with `<path class="nc-or-frame-main" d="M36 38 L270 38 L298 62 …Z">` (angled
  top-left, flat top-right), a `<path class="nc-or-frame-inner">`, a
  `<g class="nc-or-frame-teeth">` of six `<rect>`s + `nc-or-frame-teeth-box`
  along the bottom (`index.html:64-82`).
- **The main frame SVG is at `z-index:1` (behind the columns)**, unlike HUD-01's
  `z-index:30`. Because of that the contour runner cannot live in the same SVG —
  it is a **separate `<svg class="nc-or-runner-svg" viewBox="0 0 1200 420">`
  overlay at `z-index:40`** with its own 4 coincident `<path>`s
  (`index.html:90-100`; `hud-02.css:1021-1104`). `overflow:visible` on that
  overlay (`hud-02.css` runner section). Confirms `audit §4 HUD-02`.
- `.nc-or-panel` — `width:120px`→`min(1200px,100%)` via `ncOrOpenHud`,
  `height:420px`, `display:grid; grid-template-columns:30% 70%`, `overflow:clip`
  (`hud-02.css:35-53`).
- z-index ladder: frame 1 · runner-svg-in-html 2 · sweep 3 · loader 25 · toolbar
  35 · runner overlay 40 (`hud-02.css:62,91,99,362,514,1038`).

#### 1.15 Animation delta

- **No scrolling ticker** (`audit §5` matrix agrees — ticker "—" for HUD-02).
- **Loader bar**: 8 `<span>` segments, sequential opacity via **local**
  `@keyframes ncOrLoader1-8` (ported from HUD-03's `ncHpLoader`), skewed
  `skewX(49deg)` to match the frame notch (`hud-02.css:352-399, 960-1019`).
- Contour runner: same 4-layer blur system, **22 s**, `stroke-dasharray: 120 2751`
  (`hud-02.css:1047-1104`).
- Reticle / lock-box / breath / sweep: identical shared keyframes to HUD-01.

#### 1.16 JS delta

- IIFE, `window.NC_HUD_02_CONFIG` (`{objectMode, vizierLimit}`,
  `hud-02.js:169`), `widget = document.querySelector('.nc-hud-02')` first-match
  (`hud-02.js:177-178`) → single-instance.
- Writes `window.NcHud02 = { …same 12-method surface as NcHud01… }`
  (`hud-02.js:1035-1048`).
- **Mini toggle uses the shared module:** `initMiniToggle()` →
  `NcHudMini.init({ widget, panel:'.nc-or-panel', miniH:148, scale:0.352,
  onCollapse/onExpand → toggle data-aladdin + create deferred Aladin })`
  (`hud-02.js:1005-1032`).
- Same fetched-not-injected SIMBAD/VizieR/ADS content, same
  `aladin.cds.unistra.fr` lazy CDN + `simbad.cds.unistra.fr` at page load
  (`hud-02.js:53-59`).

#### 1.17 `mini` / `maxi` — HUD-02 (via `NcHudMini`)

`NcHudMini.init()` (`shared/js/hud-mini.js:44-555`):

- **Always boots into mini** — the last line of `init()` is `collapse(true)`
  (instant, no transition, `hud-mini.js:551`). So the standalone HUD-02 page
  **loads collapsed**.
- `scale: 0.352` → mini is a **`transform: scale(0.352)`** crop of the maxi panel
  (`hud-mini.js:180`), width pinned to `panelW` (default 901) with `!important`,
  `miniH:148` px `max-height` on the widget. FLIP animation between states
  (`hud-mini.js:230-372` expand, `374-531` collapse).
- Injects its own `<button class="nc-ol-toggle-btn">` (note: reuses the *HUD-01*
  button class name even for HUD-02/03; `hud-mini.js:148-149`).
- `NcHudMini` **also supports a third state, `micro`**, via
  `widget[data-collapse="micro"]` + CSS vars `--nc-micro-w/-h`,
  `--nc-title-micro-*`, `--nc-image-micro-*` (`hud-mini.js:52-68, 107-145`) —
  **but HUD-02's `index.html` sets no `data-collapse`, so this path is dead in
  this lineage.** It is live in the blogger lineage / Playground (§0.4). This is
  a shared-module coupling the Contract must be aware of.

Mapping recommendation: identical shape to HUD-01 §1.9 —
`maxi` = expanded, `mini` = the `scale(0.352)` crop (mechanical scale →
flag against Arch §13/§14), `micro` out of 0.1.

#### 1.18 Form factor / isolation

- Same as HUD-01: one landscape 1200×420 composition, `@media (max-width:900px)`
  reflow (`hud-02.css:917+`), **no 9:16**.
- Isolation risks identical to HUD-01 §1.11 **plus**: `hud-02.css:850-852` uses
  `.nc-hud-02[data-mode="html"] .nc-or-left …` attribute selectors; html-slot
  typography rules `.nc-hud-02-html-slot h1..h4, p, a` (`hud-02.css:878-915`) —
  scoped, fine. Two SVGs with coincident geometry (frame + runner overlay) → more
  surface for a clipped mount to break.

#### 1.19 Candidate slots

Same table as HUD-01 §1.12 (`nc-or-title`, `nc-or-image` + Aladin +
`nc-or-reticle`, `#nc-hud02-data-panel`, CATALOG/PAPERS panels, `.nc-or-toolbar`,
`.nc-or-data-status`, `.nc-hud-02-html-slot`). Same object-viewer-vs-html-frame
dual personality.

---

### HUD-03 — "HUD Post / Character Post" (`nc-hp-*`, root `.nc-hp-widget`)

#### 1.20 Source location(s)

- `widgets/panels/hud-03/{index.html (113), hud-03.css (561), hud-03.js (36), README.md (41)}`.
- Shared foundation: `shared/css/*` **+ `shared/css/mini-toggle.css`** +
  `shared/js/{hud-core.js, hud-mini.js}` (**not** `hud_papers.js` — no data APIs).
- Playground copy: **none in this lineage** — Playground loads
  `widgets/releases/blogger-pilot-hud03/blogger-hud03-template.css`
  (`hud-playground/index.html:18`), a separate "blogger-pilot" build.

#### 1.21 Rendering technology — **CSS `clip-path`, no SVG, near-zero JS**

Confirms Arch §39 provisional mapping **HUD-03 → CSS renderer family**.

- Frame = **CSS `clip-path: polygon(...)` on positioned `<div>`s**, not SVG:
  - `.nc-hp-frame-shell` — `position:absolute; inset:26px; border:3px solid
    rgba(80,220,255,.92); clip-path:polygon(0 22%, 0 100%, 96% 100%, 100% 72%,
    100% 6%, 21% 6%, 18% 5%, 12% 5%); filter:drop-shadow(...)×2`
    (`hud-03.css:58-79`);
  - `.nc-hp-frame-inner` — inset `72px 48px`, 1 px border, its own
    `clip-path:polygon(0 0,100% 0,100% 72%,96% 100%,0 100%)`
    (`hud-03.css:107-123`);
  - `.nc-hp-frame-mask-left/-right` — black `<div>`s with `skewX(-32deg)` that
    physically cover frame overlaps (`hud-03.css:83-103`);
  - `.nc-hp-frame-topline` — 4 `<span>`s (left / slope / right / side) forming the
    angled top-left corner, positioned by `calc()` against `--loader-left` /
    `--loader-width` custom properties on `.nc-hp-panel` (`hud-03.css:34-39,125+`).
- `.nc-hp-panel` — `width:min(1200px,100%); min-height:520px; padding:86px 92px;
  background:#000; overflow:visible; isolation:isolate; opacity:.65;
  animation: ncHpOpenHud 1.2s … forwards, hudBreath 5s infinite`
  (`hud-03.css:33-54`). **`isolation:isolate`** already creates a stacking
  context — helpful for a scoped-root mount.
- Content: `.nc-hp-content` → `.nc-hp-system` (label, e.g. "OUTPOST 32") →
  `<h2 class="nc-hp-title">` (character name) → `.nc-hp-text[lang=ru]` (freeform
  HTML) containing `<img class="nc-hp-float-image">` (**CSS `float:left`**)
  (`index.html:76-100`).
- z-index ladder (raw ints): frame-shell 1 · frame-inner 1 · sweep 2 · masks 3 ·
  topline 4 · loader 5 · ticker 5 · content 6 · mini-card 10
  (`hud-03.css:61,85,110,130,182,230,254,262,453`).

#### 1.22 External dependencies

**Only Google Fonts — Share Tech Mono**, `<link>` in `<head>` at page load
(`index.html:9-10`). **No Aladin, no SIMBAD/VizieR/ADS, no `hud_papers.js`.**
`audit §3.5` says `hud_papers.js` is "used only by HUD-01 and HUD-02" — that
matches the *panel* lineage; the `hud_papers.js` file header claims HUD-03/05 too
(blogger lineage). **[AUDIT / header inconsistent — panel HUD-03 does not use it.]**

#### 1.23 Animation mechanisms

| Animation | Mechanism | Source |
|---|---|---|
| Panel open (`scaleX(0 → 1)` from centre) | local `@keyframes ncHpOpenHud` 1.2 s `forwards` | `hud-03.css:52, 346-402` |
| Breathing box-shadow | shared `hudBreath` 5 s | `animations.css:53-66` |
| Loader bar — 8 segments sequential | **local** `@keyframes ncHpLoader1-8` (6.5 %/segment stagger) | `hud-03.css:346-402` |
| Ticker — continuous horizontal scroll | shared `@keyframes hudTickerScroll` 30 s linear infinite (`.nc-hp-frame-ticker span`) | `animations.css:93-98`; `hud-03.css:248` |
| Diagonal sweep beam | shared `.nc-panel-sweep` + `hudPanelSweep`; `.nc-hp-sweep` sets z/opacity | `effects.css:198-217`; `hud-03.css:251+` |

No SVG, no SMIL, no contour runner, no reticle.

#### 1.24 JavaScript dependencies & modules

- `hud-03.js` is **36 lines** — an IIFE whose only job is
  `NcHudMini.init({ widget:'.nc-hp-widget', panel:'.nc-hp-panel', miniH:148,
  scale:null /* crop, not transform */, expandedMaxH:2000 })`
  (`hud-03.js:16-22`), plus a one-frame transition-suppression on the mini card.
- Globals: reads `window.NcHudMini` + `window.HUDCore`; **writes none** (no
  `window.NcHud03`).
- `document.querySelector('.nc-hp-widget')` — first match → single-instance
  (`hud-03.js:8`).
- `scale: null` → `NcHudMini` runs in **crop mode** (no `transform:scale`): mini
  shows a separate `.nc-hp-mini-card` overlay (thumbnail `<img>` + name), and the
  full panel is `max-height`-clipped behind it (`hud-mini.js:188` — `overflow`
  toggled, no transform; `hud-03.css:439-543` mini-card styling).
- Listeners: `NcHudMini`'s button `click`, widget `click`, plus `transitionend`
  handlers with `setTimeout` fallbacks. Never removed → same teardown gap.

#### 1.25 Data-injection mechanism (→ #4)

**Edit `index.html` directly.** No config object, no fetch, no runtime API:

- `.nc-hp-system` inner text (system label);
- `<h2 class="nc-hp-title">` (character name);
- `<img class="nc-hp-float-image" src>` (portrait) — also duplicated in the
  `.nc-hp-mini-card` thumbnail (`index.html:37-40`, so the src must be changed in
  **two** places);
- body copy = raw HTML between the float image and the end of `.nc-hp-text`
  (`index.html:84-100`);
- ticker copy = `<span>` text inside `.nc-hp-frame-ticker` (`index.html:65-70`).

This is the cleanest "presentation frame + consumer content" model of the four —
no domain logic — and the best template for what the semantic-slot contract
replaces.

#### 1.26 `mini` / `maxi` — HUD-03

- Boots **mini** (`NcHudMini` `collapse(true)` at init).
- **Two states:** mini (dedicated `.nc-hp-mini-card` thumbnail + name overlay,
  authored separately in the HTML — *not* a scaled clone) ↔ expanded.
- No `maxi`, no `micro` (no `data-collapse` set).

**Recommended mapping:**

| Platform variant | HUD-03 today | Note for #4 |
|---|---|---|
| `maxi` | expanded panel (frame + system + title + floated portrait + text + ticker + loader) | force expanded, drop toggle |
| `mini` | the `.nc-hp-mini-card` (system label + thumbnail + name) | **this one is genuinely a distinct lower-density composition already** — closest of the four HUDs to Arch §13's intent. #4 can adopt it near-as-is. |
| `micro` | none | out of 0.1 |

#### 1.27 Form factor

- One composition: `width:min(1200px,100%); min-height:520px` — **fluid editorial
  landscape-to-square**; reflows at `@media (max-width:900px)`
  (`hud-03.css:403+`). The floated portrait + text is inherently reflowable but
  it is still **one authored layout**, not a 9:16 composition.
- **No 9:16.** Gap for #18. (The blogger lineage's HUD-10 is the portrait
  editorial panel — §0.4.)

#### 1.28 Global assumptions / isolation risks

| Risk | Evidence | Severity |
|---|---|---|
| Shared `reset.css` / `base.css` host-wide `*`, `html`, `body` selectors | as §1.11 | High |
| `.nc-hp-widget *` universal-descendant `box-sizing` | `hud-03.css:18-21` | Low |
| `.nc-hud03-stage { background:#000; min-height:100vh }` | `hud-03.css:10-14` | Med — viewport-owning wrapper, drop on mount |
| `.nc-hp-panel { background:#000 }` + `.nc-hp-widget { background:#000 }` hard-coded (not token) | `hud-03.css:26,46` | Low — opaque black assumed behind the panel |
| `float: left` on `.nc-hp-float-image` | `hud-03.css` float-image block | Med — float interacts with whatever container the Runtime mounts it in; text-wrap depends on `.nc-hp-text` width |
| `clip-path` frame + `filter: drop-shadow` | `hud-03.css:58-79` | Med — drop-shadow paints outside the box (`overflow:visible` on panel); a clipped/Shadow mount crops the glow, same as HUD-01's SVG runner |
| `--loader-left` / `--loader-width` custom props couple the topline `calc()` geometry to the loader | `hud-03.css:34-39`, README "document before changing either" | Low (packaging) |
| Frame CSS **duplicated** in HUD-04 (`C-01` in `migration-report.md`) | both files | Med — two Themes will carry near-identical frame CSS unless a shared component is extracted (a #4/#5 call) |
| No lifecycle teardown | `hud-03.js` | High (Arch §43) |
| Google Fonts `<link>` in `<head>` | `index.html:9-10` | Med under Shadow DOM |

#### 1.29 Candidate slots (→ #4)

| Slot | HUD-03 element |
|---|---|
| `subtitle` / `status` | `.nc-hp-system` ("OUTPOST 32") |
| `title` | `<h2 class="nc-hp-title">` (character name) |
| `media` | `.nc-hp-float-image` (portrait) |
| `content` / `primary` | `.nc-hp-text` freeform body HTML |
| `footer` / `status` | `.nc-hp-frame-ticker` scrolling text |
| (decoration, no slot) | `.nc-hp-frame-loader`, frame shell/inner/topline, sweep |
| mini-only | `.nc-hp-mini-card` = `{system, thumbnail, name}` → maps to `subtitle` + `media` + `title` at `mini` density |

---

### HUD-04 — "HUD Post with Media Embed" (`nc-hp-*`, root `.nc-hp-widget`)

Structurally **identical to HUD-03** (same `nc-hp-*` frame, same shared deps, same
`NcHudMini` crop-mode toggle). Delta only.

#### 1.30 Source, tech, deps

- `widgets/panels/hud-04/{index.html (126), hud-04.css (635), hud-04.js (72), README.md (42)}`.
- **CSS `clip-path` renderer family** (Arch §39) — confirmed; same frame divs as
  HUD-03, `hud-04.css` is a near-copy (`migration-report.md` C-01: "Frame CSS
  duplicated from HUD-03").
- Load order identical to HUD-03 (`shared/* → mini-toggle.css → hud-04.css`;
  scripts `hud-core.js → hud-mini.js → hud-04.js`, `index.html:122-124`).
- **External deps:** Google Fonts at page load **+ a HeyGen video `<iframe>`**
  `src="https://app.heygen.com/embeds/21a8ec0238bb4e54a153374163cb059f"` —
  present **twice** in the static HTML: once in `.nc-hp-mini-card`
  (`.nc-hp-mini-video-wrap`, `index.html:38-46`) and once in the main
  `.nc-hp-media.nc-hp-media-vertical` (`index.html:93-102`). Both load at page
  load; `hud-04.js` swaps `src` to `about:blank` to pause the hidden one.
  **No SIMBAD/Aladin/ADS.**

#### 1.31 Structure delta vs HUD-03

- The floated `<img>` is replaced by
  `<div class="nc-hp-media nc-hp-media-vertical">` — `float:left; width:28%;
  min-width:220px; max-width:360px; aspect-ratio: 9/16` containing a
  `<div class="nc-reconnect">RECONNECTING…</div>` + the HeyGen `<iframe>`
  (`hud-04.css:329-358`; `index.html:93-102`).
- `.nc-hp-media iframe { position:absolute; inset:0; width:100%; height:100%;
  object-fit:cover }` (`hud-04.css:360-369`).
- **`nc-hp-media-horizontal` (16/9) also exists in CSS** (`hud-04.css:353-358`)
  but is unused by `index.html` — a latent second aspect for the media block.

#### 1.32 `nc-reconnect` overlay — **[AUDIT STALE]**

`audit §4 HUD-04` says: *"`nc-reconnect` overlay … shown while iframe loads,
hidden on iframe `load` event … JS: detects iframe load, hides reconnect
overlay."* **The current code does not do this.** `hud-04.js` (72 lines) has
**no iframe `load` listener**. The reconnect label is now **pure CSS**:
`.nc-reconnect { position:absolute; inset:0; z-index:0 }` sits *behind* the
iframe; `.nc-hp-media iframe { z-index:1; transition:opacity .4s }` and
`.nc-hp-media iframe[src="about:blank"] { opacity:0 }`
(`hud-04.css:608-635`). So "RECONNECTING…" shows exactly while `hud-04.js` has
parked the iframe at `about:blank` (during collapse), and disappears when the
real `src` is restored (during expand). No load-event detection anywhere.

#### 1.33 JS delta

- `hud-04.js` (72 lines): `NcHudMini.init({ …, scale:null, expandedMaxH:2000,
  onCollapse, onExpand })` where the callbacks manage the **iframe lifecycle** —
  on collapse set main iframe `src='about:blank'` (and restart the mini iframe on
  subsequent collapses); on expand set mini iframe to `about:blank`
  (`hud-04.js:24-45`).
- Plus a **`MutationObserver`** on the widget's `class` attribute that restores
  the main iframe `src` the instant `.is-mini` is removed (before the 700 ms
  height transition finishes) so the video has time to load
  (`hud-04.js:50-58`). **This is the only `MutationObserver` in the four panels**
  and it is `.observe()`d with no `disconnect()` → leak.
- Writes no global. Single-instance (`document.querySelector('.nc-hp-widget')`).

#### 1.34 Animation, mini/maxi, form factor

- Animations identical to HUD-03 (`ncHpOpenHud` scaleX open, `ncHpLoader1-8`,
  `hudTickerScroll`, `hudBreath`, sweep).
- **mini/maxi:** same as HUD-03 — boots mini, `.nc-hp-mini-card` shows a
  **scaled live `<iframe>` preview** (`.nc-hp-mini-video-wrap` CSS transform,
  `hud-04.css:562+`) instead of a thumbnail image; expanded = full panel. No
  `maxi`, no `micro`.

  | Platform variant | HUD-04 today |
  |---|---|
  | `maxi` | expanded: frame + system + title + floated vertical video + text + ticker |
  | `mini` | `.nc-hp-mini-card` = system label + scaled video preview + name — again a genuine distinct low-density composition (adopt near-as-is) |
  | `micro` | none |

- **Form factor:** one fluid editorial composition; the *media block* is 9:16 but
  the *panel* is landscape-ish (`min(1200px,100%)`, `@media (max-width:900px)`
  reflow, `hud-04.css:428+`). **No 9:16 panel composition.** Gap for #18.

#### 1.35 Global assumptions / isolation risks

All of HUD-03 §1.28, **plus**:

| Risk | Evidence | Severity |
|---|---|---|
| HeyGen third-party `<iframe>` (`app.heygen.com`) ×2 in static DOM | `index.html:38-46, 93-102` | Med — cross-origin frame, autoplay/`encrypted-media` permissions, loads at page load; a "no third-party iframes" policy breaks HUD-04 |
| `MutationObserver` never disconnected | `hud-04.js:50-58` | High (Arch §43) |
| iframe `src` mutation as a lifecycle mechanism | `hud-04.js:33,37,43,54` | Med — Runtime `resize()` / variant changes must not fight this |
| `.nc-hp-media { float:left }` + `aspect-ratio` | `hud-04.css:331,350` | Med |
| duplicated `nc-hp-*` frame CSS (shared identity with HUD-03) | C-01 | Med (packaging) |

#### 1.36 Candidate slots

As HUD-03 §1.29 but `media` = `.nc-hp-media` (iframe/video/img container, with a
latent 16:9 vs 9:16 sub-mode). `.nc-reconnect` = Theme-owned `status`.

---

## 2. Renderer-family mapping — confirmed

| HUD | Arch §39 provisional | **Confirmed by code** | Evidence |
|---|---|---|---|
| HUD-01 | SVG family | **SVG** — inline `<svg>` polygon frame at z-30 + 4-layer SVG blur runner; content is HTML/CSS; JS-heavy (Aladin/SIMBAD) | `hud-01/index.html:60-88`, `hud-01.css:71-79,1197-1256` |
| HUD-02 | SVG family | **SVG** — two inline `<svg>`s (frame at z-1 + runner overlay at z-40), polygon paths, `preserveAspectRatio="none"` | `hud-02/index.html:64-100`, `hud-02.css:1021-1104` |
| HUD-03 | CSS family | **CSS** — frame is `clip-path: polygon()` on `<div>`s + `filter: drop-shadow`; **zero SVG**; 36-line JS (mini toggle only) | `hud-03/hud-03.css:58-123`, `hud-03.js` |
| HUD-04 | CSS family | **CSS** — identical `clip-path` frame to HUD-03; **zero SVG**; 72-line JS (mini toggle + iframe lifecycle) | `hud-04/hud-04.css:53-123`, `hud-04.js` |

The mapping **holds**. Nuances the Contract/renderers must absorb:

1. Both "SVG" HUDs still render **most pixels with CSS** (reticle, data grid,
   toolbar, html-slot, glow). The SVG renderer must host an HTML/CSS content
   layer, not just an SVG document.
2. Both "CSS" HUDs depend on **`filter: drop-shadow` + `overflow: visible`**
   painting outside the panel box — the CSS renderer's isolation strategy must
   not hard-clip.
3. All four rely on **shared CSS keyframes** (`animations.css`) and the shared
   **`.nc-panel-sweep`** (`effects.css`). Whatever the renderers do about the
   shared foundation layer (§13) applies to *both* families.
4. HUD-01 reimplements the mini toggle inline; HUD-02/03/04 use shared
   `NcHudMini`. Two toggle implementations across "one" renderer family each.

---

## 3. Cross-cutting: the shared foundation layer

Every panel loads, in this order: `reset → tokens → base → animations →
typography → layout → effects` `(→ mini-toggle)` `→ hud-0N`. JS:
`hud-core` `(→ hud_papers)` `(→ hud-mini)` `→ hud-0N`.

| Shared file | Lines | Role | Isolation notes |
|---|---|---|---|
| `reset.css` | 40 | `*`, `html`, `body`, `img/video/canvas/svg`, `input/button…`, `p/h1-6`, `ul/ol`, `a` resets | **host-wide selectors — Arch §42 violation**; must be scoped or dropped at packaging |
| `tokens.css` | 45 | `:root { --hud-* }` colours / spacing / z-index / type scale | global but `--hud-*` namespaced; re-root onto Theme container |
| `base.css` | 136 | `body { background/color/font-family/min-height:100vh }` + `.nc-panel*`, `.nc-row/-col`, `.nc-value`, `.nc-glow` utilities | `body{}` rule is **host-wide**; utilities are namespaced |
| `animations.css` | 121 | 15 `@keyframes` (`hudPulse/Rotate/Blink/Sweep/Flicker/PanelSweep/Breath/PulseOuter/PulseInner/BlinkSoft/LockBoxPulse/TickerScroll/ProgressScan/SlideIn`) + `.nc-anim-*` utility classes | keyframe names are **global identifiers** — collide if two Theme bundles define them; namespace or dedupe |
| `typography.css` | 62 | `.nc-heading-*`, `.nc-body`, `.nc-caption`, `.nc-data`, `.nc-tag` | namespaced; **panels barely use these** (they set their own type) |
| `layout.css` | 193 | `.nc-stage` (`100vw/100vh`), grids, flex helpers, `.nc-overlay-layer` (z `var(--hud-z-overlay)`) | `.nc-stage`/`.nc-widget-stage` are viewport-owning; panels don't use them |
| `effects.css` | 217 | `.nc-fx-*` glows/scanlines/noise/cuts + **`.nc-panel-sweep`** (the diagonal beam every panel uses) + `@keyframes ncGlitch` | `.nc-panel-sweep` uses `mix-blend-mode:screen` |
| `mini-toggle.css` | 81 | `.nc-mini-widget` (`overflow:hidden; transition:max-height`), `.nc-mini-panel` (`transition:transform`), `.nc-ol-toggle-btn` skin + tooltip | loaded by HUD-02/03/04, **not** HUD-01 (which styles its toggle in `hud-01.css`) |
| `hud-core.js` | 102 | `window.HUDCore` = qs/qsa/el/zeroPad/clamp/EventBus/bootFlicker; no load side-effects | global singleton |
| `hud-mini.js` | 559 | `window.NcHudMini.init(opts)` — FLIP mini/expand/**micro**; injects toggle button; **starts collapsed**; reads CSS vars `--nc-micro-*`, `--nc-*-micro-*` (blogger-lineage only) | global singleton; button-class name `nc-ol-toggle-btn` reused for all panels |
| `hud_papers.js` | 210 | `window.HudPapers` = load/render/invalidate — SIMBAD TAP `has_ref` → papers; in-module cache + AbortController | loaded by HUD-01/02 only in this lineage (header claims 03/05 too) |
| `hud-loader.js` | 87 | `window.HUDLoader` — iframe widget registry/mount | **not loaded by any of hud-01..04** — legacy/unused here |
| `staging-svg-panels.js` | 421 | staging helper; refs `via.placeholder.com`, `youtube.com/embed`, `share.heygen.com` | **not loaded by hud-01..04** — Playground/staging only |

**Key #4 decision (see Handoff):** do the four 0.1 Themes **share one copy** of
this foundation layer (a platform-provided base the renderers inject once), or
does **each Theme vendor its own copy** in its package (Arch §8.3
"self-contained text Themes preferred")? Recommendation in Handoff.

---

## 4. `mini` / `maxi` gap — summary

**What Arch §13 requires:** `mini` (REQUIRED) and `maxi` (REQUIRED) as *semantic
density / layout* modes, explicitly **"not merely scaling levels"** (§13),
**"MUST NOT infer … by … mechanically scaling"** (§14).

**What exists today:**

| HUD | States today | Boots as | Mechanism | Maps to `maxi` | Maps to `mini` |
|---|---|---|---|---|---|
| HUD-01 | expanded ↔ collapsed | **collapsed** | inline (`initExpandCollapse`), `transform: scale(0.352)` crop of the maxi DOM | expanded state | **mechanical scale** of maxi — §13/§14 concern |
| HUD-02 | expanded ↔ collapsed | **collapsed** | `NcHudMini`, `scale: 0.352` crop of the maxi DOM | expanded state | **mechanical scale** of maxi — §13/§14 concern |
| HUD-03 | expanded ↔ mini-card | **mini-card** | `NcHudMini` crop mode (`scale:null`) + separate authored `.nc-hp-mini-card` | expanded state | **genuine distinct composition** (adopt) |
| HUD-04 | expanded ↔ mini-card | **mini-card** | `NcHudMini` crop mode + authored `.nc-hp-mini-card` w/ scaled video | expanded state | **genuine distinct composition** (adopt) |

**Gaps / decisions for #4 + #19:**

1. **No `maxi` concept** — "expanded" is not authored as a variant, it is the
   default with the toggle removed. #4 must define `maxi` = the full panel.
2. **HUD-01 & HUD-02 `mini` is a CSS transform-scale**, not a re-composition —
   directly at odds with Arch §13/§14. #4/#19 decide: (a) author real mini
   compositions for 01/02 (work), or (b) accept transform-scale as a documented
   0.1 compromise for the SVG family and revisit in 0.2.
3. **HUD-03 & HUD-04 already have real `mini` compositions** (`.nc-hp-mini-card`)
   — low-risk to adopt.
4. **All four boot collapsed.** The Runtime's `new Hud({variant})` must be able to
   request `maxi` directly (no "load mini then expand" flash). Today the only way
   to a non-collapsed panel is a user click or `NcHud01/02` API call.
5. **`micro`** exists only in the blogger lineage (`NcHudMini` `data-collapse`,
   `--nc-*-micro-*`). Confirm out of 0.1 (Plan §7 item 5).
6. **The blogger lineage already solved most of this** (`maxi|mini|micro` +
   per-variant CSS vars) — if the owner picks lineage (b) (§0.4), items 1–4
   mostly evaporate. This is the strongest argument for revisiting the
   lineage question before #4 freezes.

---

## 5. Form-factor (16:9 / 9:16) gap — summary

**What Arch §14 requires:** a complete Theme MUST provide
`mini×16:9, mini×9:16, maxi×16:9, maxi×9:16`; each ratio is an **explicit
composition**; the Runtime **MUST NOT** rotate/scale landscape into portrait
(§14, §54.14).

**What exists today (this lineage):**

| HUD | Composition(s) | 9:16? |
|---|---|---|
| HUD-01 | one landscape `1200×420` (viewBox) + `@media(max-width:900px)` reflow | **none** |
| HUD-02 | one landscape `1200×420` + `@media(max-width:900px)` reflow | **none** |
| HUD-03 | one fluid editorial `min(1200px,100%)`, `min-height:520px` + `@media` reflow | **none** (floated image reflow ≠ a portrait composition) |
| HUD-04 | one fluid editorial; *media block* is 9:16 but panel is landscape-ish | **none** at panel level |

**None of HUD-01…04 has a distinct 9:16 composition.** `@media` reflow and
`preserveAspectRatio="none"` stretch are **not** compositions in the Arch §14
sense.

**Decision for #4 + #18:** the four Themes' `9:16` compositions **must be
authored from scratch** — they cannot be derived. #18 should scope this as
"author + validate 4 new portrait compositions" or explicitly declare
`9:16` **unsupported** for the 0.1 Themes and log it as a known 0.1 gap
(Arch §31 additive-evolution allows adding a ratio later without a breaking
change). Note: the blogger lineage's **HUD-10** is an existing portrait editorial
panel — if lineage (b) is chosen, HUD-03/04's portrait story has a starting
point.

---

## 6. Top migration constraints (hardest first)

1. **The migration input is not committed (§0.3).** Nothing downstream (#11–#15,
   traceability) can proceed until `widgets/panels/hud-0N/` + `widgets/shared/` +
   `widgets/docs/` are on `feature/hud-platform-0.1`. *Owner/Coder, before P5.*
2. **Two divergent lineages; the Playground loads the non-inventoried one
   (§0.4).** #4 must pick the source lineage; #14/#16 ("Playground → Runtime")
   are much bigger than a loader swap because the Playground currently shows a
   richer implementation (maxi/mini/micro, CSS-var theming, HUD-10) than the one
   being packaged. *Owner decision, before #4 freezes.*
3. **HUD-01/02 Aladin lazy-init + `document.head` injection + single-instance +
   `window.A` global.** Aladin assumes a light-DOM document and mutates
   `document.head`; Plan §2.8 makes Shadow DOM "validated, not assumed" for this
   exact reason. Single global ids (`#nc-hud-01-aladin-viewer`), single global
   API (`NcHud01`), first-match `querySelector` → **one instance per page**. The
   SVG renderer + isolation strategy must tolerate this or the CSS-scoped-root
   fallback (Plan §2.8) is the only viable path for 01/02 in 0.1.
4. **HUD-01/02 `mini` = `transform: scale(0.352)`** of the maxi DOM — violates
   Arch §13/§14 "not a scale factor / no mechanical scaling". Either author real
   mini compositions (cost) or document the compromise (§4).
5. **No lifecycle teardown anywhere.** All four panels add listeners
   (`click`, `keydown`, `animationend`, `transitionend`, `ResizeObserver` in
   05/06, `MutationObserver` in 04) and **never remove them**; HUD-01/02 hold
   Aladin instances; timers/`AbortController`s in `hud_papers.js`. Arch §43
   "cleanup is mandatory" + §25 `destroy()` require a teardown path that does not
   exist — the renderers must add one around unchanged Theme code.
6. **Host-wide CSS in the shared layer** (`reset.css` `*`/`html`/`body`,
   `base.css` `body{}`) — Arch §42 violation; must be transformed/scoped at
   packaging (Arch §42 "legacy styles may be transformed or scoped"). Shared
   `@keyframes` names are global identifiers that collide across Theme bundles.
7. **HUD-03/04 `clip-path` frame + `filter: drop-shadow` painting outside the
   box** (`overflow: visible` on `.nc-hp-panel`), and HUD-01's SVG glow runner
   (`overflow: visible` on the SVG) — any clipped or Shadow-DOM mount crops the
   glow. The CSS renderer's isolation must preserve overflow-visible glow, or the
   visual output changes (Arch §39 "existing output should be preserved").
8. **HUD-03/04 duplicated `nc-hp-*` frame CSS** (`migration-report.md` C-01) —
   two Themes will carry ~250 identical lines unless #5 defines a shared frame
   component; the standalone constraint (Plan §3, styling-rules §"Standalone")
   historically blocked deduping.
9. **HUD-04 HeyGen third-party iframe** ×2 in static DOM, loading at page load,
   with a `src`-mutation lifecycle and a `MutationObserver`. Any JS/iframe policy
   in #4 must permit it (owner decision 2026-09-09: deps stay as-is).
10. **`hud-mini.js` is shared across both lineages** and carries blogger-only
    code paths (`data-collapse="micro"`, `--nc-*-micro-*` CSS vars). Packaging it
    per-Theme freezes a version; sharing it couples the two lineages' toggle
    behaviour.

---

## 7. Where the existing audit (`widgets/docs/audit-hud01-06.md`) is stale

| Audit claim | Location | Reality (2026-09-09) |
|---|---|---|
| "HUD-01 … no mini/expand toggle"; feature matrix "Mini/expand toggle: HUD-01 —" | `§4 HUD-01`, `§5` | **False.** `hud-01.js:238-362` `initExpandCollapse()` ("HUD01-7") — inline mini toggle, boots collapsed, `scale(0.352)`. Issue #2's AC repeats this stale claim. |
| HUD-01 CSS "≈1 270 lines", JS "≈1 240" | `§4` | ~right (1267 / 1238). |
| "PAPERS panel — ADS papers integration (not yet implemented)" for HUD-01 | `§4` | Implemented — `hud-01.js:935-961` via `HudPapers.load()` (SIMBAD `has_ref`, ADS abstract links). `index.html:158` placeholder text is stale. |
| HUD-04 "`nc-reconnect` overlay … hidden on iframe `load` event … JS detects iframe load" | `§4 HUD-04` | **False.** No `load` listener in `hud-04.js`. Reconnect label is pure CSS keyed off `iframe[src="about:blank"]` (`hud-04.css:608-635`); JS only swaps `src` on collapse/expand. |
| "hud_papers.js … Used only by HUD-01 and HUD-02" (§3.5) vs file header "Used by HUD-01, HUD-02, HUD-03, HUD-05" | `§3.5` / `hud_papers.js:20` | Panel HUD-03 (`hud-03/index.html`) does **not** load `hud_papers.js`. The "03/05" claim reflects the blogger/legacy lineage, not `widgets/panels/`. |
| "hud-mini.js … Used by HUD-02 through HUD-06"; options list (no `micro`) | `§3.4` | `hud-mini.js` now also implements a **`micro`** state (`data-collapse="micro"`, CSS-var driven) — unused in the panel lineage, used by the blogger lineage. |
| Repo layout `HUD/widgets/` with no `mini-toggle.css`, `layout.css` in shared | `§2` | shared CSS now has 8 files incl. `layout.css`, `mini-toggle.css`; shared JS has `hud-loader.js`, `staging-svg-panels.js` too. |
| "No build step, no backend … Pure vanilla" | `§1` | Still true for the panels; but HUD-01/02 do live network I/O at page load (SIMBAD) + lazy (Aladin/VizieR/ADS), which `widget-contract.md` §"JS rules" forbids ("No external network calls in widget JS"). |
| Version strings table (`hud-01.css v16`, `hud-02.css v11`, `hud-mini.js v3` …) | `§7` | `index.html` now shows `hud-01.css?v=16`, `hud-01.js?v=8`, `hud-02.css?v=11`, `hud-02.js?v=2`, `hud-03.css?v=6`, `hud-03.js?v=3`, `hud-04.css?v=7`, `hud-04.js?v=4`, `mini-toggle.css?v=3`, `hud-mini.js?v=3`. Cache-bust query strings are inconsistent between files and will be irrelevant post-packaging (content-hashed URLs, Arch §34). |

`migration-report.md` (2026-05-22) is **substantially** stale — it describes all
panel JS as "Passive stub" and predates HUD01-1…HUD01-7, the Aladin/SIMBAD work,
and `NcHudMini`. Use it only for the C-01…C-06 cleanup-candidate list and the
"promoted to shared" keyframe provenance.

`widget-contract.md` / `styling-rules.md` are **aspirational** and the panels
already diverge: raw integer z-index (rules say "never"), hard-coded
`rgba(80,220,255,…)` instead of tokens (rules say "never hardcode"), live network
I/O in widget JS (contract says "no external network calls"). #4 must be written
against **observed behaviour**, not these docs.

---

## 8. Handoff to #4 (Contract 1.0) and #3 (manifest JSON Schema)

Concrete decisions those stories must make, each traceable to a finding above:

### For #4 — HUD Theme Contract 1.0

| # | Decision | Driven by |
|---|---|---|
| H1 | **Source lineage** for the 0.1 Themes: `widgets/panels/hud-0N/` (audited here) **or** `widgets/sandbox/blogger-hud01-02-wip/` + `releases/blogger-pilot-hud03/` (what ships + what the Playground shows, already has maxi/mini/micro + HUD-10). *Owner call — blocks everything.* | §0.4 |
| H2 | **`maxi` = the expanded panel** with the toggle removed; define it as an authored variant, not "default minus chrome". | §4 |
| H3 | **`mini` for HUD-01/02**: accept `transform: scale(0.352)` crop as a documented 0.1 compromise, **or** require authored mini compositions. (HUD-03/04 `mini` = adopt `.nc-hp-mini-card` as-is.) | §1.9, §4 |
| H4 | **`micro`**: out of 0.1 (Plan §7.5) — but the Contract's variant enum should reserve it, since `hud-mini.js` already implements it. | §3, §4 |
| H5 | **`9:16` compositions do not exist** — Contract states either "author 4 new portrait compositions in #18" or "`9:16` declared unsupported for 0.1 Themes, added later per Arch §31". | §5 |
| H6 | **Semantic slot vocabulary** — ratify from §1.12 / §1.19 / §1.29 / §1.36: `title, subtitle, system→(subtitle|status), primary, secondary, status, footer, content, media, visualization, controls`. Decide whether `system`/`ticker` get dedicated slots or fold into `subtitle`/`footer`. | §1.12, §1.29 |
| H7 | **HUD-01/02 dual personality** (object-viewer vs html-frame): one Theme with a `capability`/`mode` flag, or two Themes (`hud-01-object`, `hud-01-html`)? The html-slot is the only "arbitrary consumer HTML" slot; object mode is domain logic. | §1.8 |
| H8 | **Fetched-not-injected content policy.** HUD-01/02 fetch SIMBAD/VizieR/ADS from an object *name*; Vision §12 forbids domain logic in a Theme. Contract must either (a) allow a Theme to declare a `data-source` capability + allowlisted endpoints, or (b) require the consumer to pass resolved rows into `primary`/`secondary` (bigger migration). Owner already said deps stay as-is (2026-09-09) → (a) is implied. | §1.4, §1.8 |
| H9 | **External-resource allowlist** in the manifest: `fonts.googleapis.com` + `fonts.gstatic.com` (page load), `aladin.cds.unistra.fr` (lazy), `simbad.cds.unistra.fr` (page load), `vizier.cds.unistra.fr` (lazy), `ui.adsabs.harvard.edu` (link target), `app.heygen.com` (HUD-04 iframe). Contract must distinguish **page-load** vs **lazy** and **script** vs **stylesheet/font** vs **fetch** vs **iframe**. | §1.4, §1.30 |
| H10 | **JavaScript lifecycle contract.** Theme entrypoint must expose mount/destroy hooks the renderer can drive; renderers add teardown around unchanged Theme code (remove listeners, disconnect observers, destroy Aladin, abort fetches). Define the hook signature. | §1.6, §6.5 |
| H11 | **Isolation mechanism per family** (ratify Plan §2.8): scoped Theme root as baseline for **all four**; Shadow DOM *attempted* for HUD-03/04 (CSS family) and kept only if `clip-path` + `filter` + `float` survive; Shadow DOM **not** attempted for HUD-01/02 in 0.1 (Aladin `document.head` injection). | §1.11, §6.3, §6.7 |
| H12 | **CSS policy for the shared foundation** (Arch §42): `reset.css`/`base.css` host-wide `*`/`html`/`body` rules get scoped or dropped at packaging; shared `@keyframes` names get namespaced or deduped. Define the transform. | §3, §6.6 |
| H13 | **`overflow: visible` glow.** Contract must permit a Theme to paint decoration outside its bounding box (HUD-01 SVG runner, HUD-03/04 drop-shadow), or accept clipped glow as a visual delta. | §6.7 |
| H14 | **Shared foundation ownership** (also #3/#5): one platform-provided base injected once by the Runtime, **or** each Theme vendors its own copy (Arch §8.3). **Recommendation: platform-provided, versioned base** — the four Themes are near-identical at the foundation layer, all four load the same 7 files in the same order, and per-Theme copies multiply the `@keyframes`-collision and drift problems. Themes declare a `baseVersion` in the manifest. | §3 |
| H15 | **Single-instance constraint.** Contract states whether 0.1 Themes must support N instances per page. HUD-01/02 (global ids + `NcHud01` + first-match query) are 1-per-page today; HUD-03/04 too (first-match). Recommendation: **1 instance per page is a documented 0.1 limitation**; multi-instance is 0.2 (matches `audit §8.1`, `hud-01.js:30`). | §1.6, §6.3 |

### For #3 — manifest JSON Schema (fields the inventory says are needed)

| Field | Why | Source |
|---|---|---|
| `id`, `version` | one per HUD (`hud-01`…`hud-04`); independent SemVer (Arch §30) | — |
| `renderer` enum | `svg` (01/02) / `css` (03/04); `video`/`static`/`gadget` declared, not implemented (Plan §2.9) | §2 |
| `variants` | `["mini","maxi"]` required; `micro` reservable | §4, H4 |
| `ratios` | `["16:9"]` for all four in 0.1 **if** 9:16 is deferred (H5); schema must allow a Theme to declare a subset and the validator to flag "incomplete per Arch §14" as a *known 0.1 exception* | §5 |
| `compositions` map | `variant × ratio → entrypoint/asset path` (Arch §10 deterministic layout `mini/16x9/…`); for 0.1, `maxi/16x9` + `mini/16x9` per HUD | §4, §5 |
| `slots` | declared semantic slots per §1.12/§1.19/§1.29/§1.36; support Theme-custom slots (Arch §15) | H6 |
| `entrypoints` | HTML + CSS + JS per composition; **load order is significant** (§1.3, §3) — schema needs an ordered list, not a set | §1.3, §3 |
| `baseVersion` | which shared-foundation version the Theme expects (if H14 = platform-provided) | §3, H14 |
| `capabilities` | `dataSource` (HUD-01/02 SIMBAD/VizieR/ADS), `skyViewer` (Aladin), `htmlSlot` (HUD-01/02 html mode), `mediaEmbed` (HUD-04 iframe), `singleInstance:true` | H7, H8, H15 |
| `externalResources[]` | `{url, kind: script|style|font|fetch|iframe, timing: page-load|lazy, required: bool}` — allowlist for Arch §43 policy | H9 |
| `animations` | list of shared `@keyframes` consumed (for the namespace/dedupe transform) | §3, H12 |
| `isolation` | `scoped-root` \| `shadow-dom` \| `iframe` per Theme (H11); HUD-01/02 → `scoped-root`, HUD-03/04 → `shadow-dom-attempted` | H11 |
| `knownDeviations[]` | machine-readable list of accepted 0.1 compromises (e.g. `"mini-is-transform-scale"`, `"no-9x16"`, `"single-instance"`, `"external-io-on-mount"`) so the validator passes them deliberately | §4, §5, §6 |
| `overflowVisible: bool` | Theme paints outside its box (HUD-01 runner, HUD-03/04 shadow) — renderer must not hard-clip | H13 |

---

## 9. Acceptance-criteria status (issue #2)

| AC | Status | Where |
|---|---|---|
| Report committed at `docs/architecture/HUD_Platform_Inventory_0.1.md`, HUD-01…04 only, 05/06 excluded | **met** | this file; §0.2 |
| Per HUD: source location + shared foundation files | **met** | §1.1/1.3, §1.13, §1.20, §1.30, §3 |
| Per HUD: rendering technology | **met** | §1.2, §1.14, §1.21, §1.31, §2 |
| Per HUD: external deps (Aladin, SIMBAD/VizieR/ADS, Google Fonts) + when they load | **met** | §1.4, §1.22, §1.30 |
| Per HUD: animation mechanisms | **met** | §1.7, §1.15, §1.23, §1.34 |
| Per HUD: data-injection mechanism (config / direct edit / slot classes) | **met** | §1.8, §1.17, §1.25, §1.33 |
| Per HUD: current variant behaviour (`mini`/`maxi`; HUD-01 "no mini toggle") | **met — with correction**: HUD-01 *does* have a mini toggle now (`initExpandCollapse`, "HUD01-7"); the AC's premise is stale | §1.9, §4, §7 |
| Per HUD: current form-factor behaviour; 9:16 recorded as a gap | **met** | §1.10, §1.18, §1.27, §1.34, §5 |
| Per HUD: global assumptions / isolation risks (`nc-`/`nc-ol-`/`nc-or-`/`nc-hp-` namespacing, `overflow:visible`, single-instance, `<script>`-stripping/iframe, Shadow-DOM risk for Aladin + Google Fonts) | **met** | §1.11, §1.18, §1.28, §1.35, §3 |
| Provisional renderer-family mapping (01/02→SVG, 03/04→CSS, Arch §39), flagged provisional-pending-Stage-2 | **met — confirmed by code**, nuances in §2 | §2 |
| Per HUD: semantic content areas as candidate Contract slots | **met** | §1.12, §1.19, §1.29, §1.36 |
| Migration constraints + open items handed to #4 and #3 | **met** | §6, §8 |
| Every claim traceable to a file path / audit line; note where audit is stale | **met** | inline paths throughout; §7 |
| "Handoff to #4 and #3" section | **met** | §8 |
| No application code; no changes outside `docs/` | **met** | this commit touches only `docs/architecture/` |

---

## 10. What a human must decide (surfaced, not resolved)

1. **Which lineage** the 0.1 Themes are cut from (§0.4, H1) — blocks #4.
2. **Commit the migration input** (`widgets/panels/hud-0N/` + `widgets/shared/` +
   `widgets/docs/`) onto `feature/hud-platform-0.1` (§0.3) — blocks #11–#15.
3. **HUD-01/02 `mini`**: author real compositions, or accept transform-scale as a
   0.1 compromise (§4, H3).
4. **`9:16`**: author 4 portrait compositions in #18, or declare unsupported for
   0.1 Themes and add later (§5, H5).
5. **HUD-01/02 dual personality**: one Theme + capability flag, or two Themes
   (§1.8, H7).
6. **Fetched-not-injected astronomy data** vs Vision §12 (§1.8, H8) — owner
   already leaned "keep deps as-is" 2026-09-09; confirm that implies a
   `dataSource` capability rather than a consumer-passes-rows refactor.
7. **`micro` stays out of 0.1** (Plan §7.5) — confirm, given `hud-mini.js`
   already implements it.
8. **Single-instance-per-page** accepted as a documented 0.1 limitation
   (§6, H15) — confirm.
