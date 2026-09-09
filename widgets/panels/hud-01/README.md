# HUD-01 — Object Lock Panel

Sci-fi astronomical object lock panel. Displays a target image with animated reticle overlay alongside a structured data readout. Panel expands on load via CSS animation.

**Migration source:** `legacy/panels/HUD-1.html` + `legacy/template/blogger-template.css § OBJECT LOCK`

---

## Files

| File | Role |
|---|---|
| `index.html` | Standalone entry point |
| `hud-01.css` | Widget-specific styles (`.nc-ol-*` namespace) |
| `hud-01.js` | Toolbar toggle handlers + public API |

---

## HUD01-1 — Enhancement Pass

### 1. Animated Progress Bar

The upper SVG comb stripes (`<g class="nc-ol-frame-stripes">`) have been replaced by a CSS-driven progress bar (`.nc-ol-progress`).

- Positioned to match the former stripes area: SVG coords x=154..532, y=36..59
- Segmented dark track with repeating-linear-gradient
- Scanning cyan beam (`hudProgressScan` keyframe, added to `shared/css/animations.css`)
- `pointer-events: none`, z-index 25 (below SVG frame at 30)

The `hudProgressScan` keyframe is reusable: apply `.nc-anim-progress-scan` to any element inside an `overflow: hidden` container.

### 2. Toolbar (updated by HUD01-3)

See **HUD01-3** section below for the current two-group toolbar structure.

### 3. Target Lock Mode

The widget root (`.nc-ol-widget`) carries a `data-target-lock` attribute:

| Value | Effect |
|---|---|
| `on` (default) | Full target-lock presentation — reticle, rings, brackets, label all visible |
| `off` | Reticle hidden via CSS opacity; frame, progress bar, toolbar, content area remain |

CSS handles visibility — no JS loop or polling. The toolbar's Reticle button is independent of target-lock mode (both can separately hide the reticle).

### 4. Aladin Placeholder Layer

`.nc-hud-01-aladdin` is an absolute overlay inside `.nc-ol-left`, covering the same area as the image (left: 42px, top: 34px, 445×352px). It shows a "ALADIN LAYER STANDBY" placeholder. Hidden by default; shown when `data-aladdin="on"`.

The real Aladin Lite integration (sky survey rendering) is a future pass. The layer is the mount point for that integration.

---

## HUD01-2 — Aladin Lite v3 Integration

### Architecture

Aladin Lite is loaded on demand — **zero CDN dependency at page load**.

| Event | Action |
|---|---|
| First ALADIN button press | `loadAladinScript()` injects `aladin.min.css` `<link>` + `aladin.js` `<script>` |
| `script.onload` | Waits for `A.init` Promise, then calls `A.aladin()` once |
| Subsequent ON/OFF | CSS show/hide only — instance is reused |

CDN URLs (both injected dynamically):
```
https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js
https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.min.css
```

### Lazy Init Sequence

1. `setAladdin(true)` → `data-aladdin="on"` (CSS shows layer) → `initAladin()`
2. `initAladin()` sets `aladinBusy = true` (re-entry guard) → `loadAladinScript()`
3. On `script.onload`: one `requestAnimationFrame` (lets `display:block` layout settle) → `A.init.then()`
4. `A.aladin('#nc-hud-01-aladin-viewer', options)` created once
5. `aladinReady = true`, `--ready` class added (placeholder hidden, viewer revealed)
6. Any `pendingTarget` queued before init is applied

### Default View

| Setting | Value |
|---|---|
| Target | NGC 1300 |
| Survey | DSS2/color (`P/DSS2/color`) |
| FOV | 0.5° |
| RA/Dec fallback | 49.9213, −19.4069 |
| Background | `#000814` |
| UI controls | All hidden (zoom, fullscreen, layers, goto, status bar, frame, grid, projection) |

### CDN Timeout Guard

A 15-second `settle()` timeout covers silent blocks (browser extensions, network policies) where neither `script.onload` nor `script.onerror` fires. Whichever of the three fires first (load, error, timeout) wins — subsequent callbacks are dropped.

### Fallback

On any failure (script error, timeout, `A.init` rejection, `A.aladin()` throw):
- Placeholder label changes to `ALADIN LITE UNAVAILABLE` or `ALADIN LITE ERROR`
- Placeholder sub-text is cleared
- `aladinBusy` is reset to `false` — a retry is possible by toggling ALADIN off/on

---

## JS API

```js
// All methods are safe to call after DOMContentLoaded.
// Scoped to the first .nc-ol-widget on the page (see Known Limitations).

NcHud01.setTargetLock(true|false)
// Programmatic mode switch. false → reticle hidden, generic frame mode.
// Does NOT update toolbar Reticle button state.

NcHud01.setReticle(true|false)
// Toggle reticle overlay. Syncs toolbar button aria-pressed.

NcHud01.setAladdin(true|false)
// Toggle Aladin layer. Syncs toolbar button aria-pressed.
// Triggers lazy init on first enable.

NcHud01.initAladin()
// Explicitly trigger lazy init without showing the layer.
// No-op if already ready or init in flight.

NcHud01.setAladinTarget(target, fov)
// Navigate to a named object or "RA Dec" string.
// @param {string} target  e.g. "M31", "NGC 224", "49.9213 -19.4069"
// @param {number} [fov]   Field of view in degrees (optional)
// Initialises Aladin and shows the layer if not yet done.
// Queues the target if init is still in flight.

NcHud01.setInfoMode(mode)
// Switch the active info tab. mode: "data" | "papers" | "catalog"
// DATA/PAPERS/CATALOG are mutually exclusive; updates aria-pressed on all three.
// Triggers loadSimbadData if switching to "data" and no data is loaded yet.
// Triggers loadAdsPapers if switching to "papers".

NcHud01.loadSimbadData(target)
// Fetch SIMBAD object data for the given identifier string.
// Renders results into the DATA panel; falls back to NGC 1300 mock on failure.
// No-op if a fetch is already in flight (simbadBusy guard).

NcHud01.loadVizierReferences(target)
// Fetch VizieR catalog references for the given identifier string.
// Renders catalog cards into the PAPERS panel. No API key required.
// Uses memory cache — second call for the same target is instant.
// Falls back to demo data for NGC 1300 on CORS / timeout / parse error.

NcHud01.setTarget(target)
// Change the current astronomical target.
// Updates currentTarget, reloads the active info tab (DATA or PAPERS),
// and navigates Aladin to the new position.
// @param {string} target  e.g. "M31", "NGC 224"
```

---

## Data Attributes

| Attribute | Values | Default | Effect |
|---|---|---|---|
| `data-target-lock` | `on` / `off` | `on` | Programmatic lock mode |
| `data-reticle` | `on` / `off` | `on` | Reticle overlay visibility |
| `data-aladdin` | `on` / `off` | `off` | Aladin layer visibility |
| `data-info-mode` | `data` / `papers` / `catalog` | `data` | Active info tab |

---

## HUD01-3 — Two-group Toolbar + SIMBAD DATA mode

### Toolbar Structure

```
[ ⊕ RETICLE | ◈ ALADIN ]  |  [ ≡ DATA | ◎ PAPERS | ▦ CATALOG ]
      Group A (toggles)    sep        Group B (tabs)
```

**Group A — view overlays** (independent boolean toggles):

| Button | `data-action` | Controls |
|---|---|---|
| ⊕ RETICLE | `reticle` | `data-reticle` on widget root |
| ◈ ALADIN | `aladdin` | `data-aladdin` on widget root |

**Group B — info tabs** (mutually exclusive; only one active at a time):

| Button | `data-action` | Panel shown |
|---|---|---|
| ≡ DATA | `data` | Dynamic SIMBAD data rows |
| ◎ PAPERS | `papers` | VizieR catalog references (live fetch + demo fallback) |
| ▦ CATALOG | `catalog` | `VIZIER CATALOG MODULE STANDBY` placeholder |

### Default State

| Control | Default |
|---|---|
| RETICLE | ON |
| ALADIN | OFF |
| DATA | ON (active tab) |
| PAPERS | OFF |
| CATALOG | OFF |

### DATA Mode — SIMBAD Integration

On page load, `loadSimbadData('NGC 1300')` fires automatically. It queries the
**SIMBAD TAP endpoint** (`simbad.cds.unistra.fr/simbad/sim-tap/sync`) via `fetch`
with an ADQL join on the `ident` table — handles any identifier format.

Fields queried: `main_id`, `otype`, `ra`, `dec`, `z_value`, `rvz_radvel`, `nbref`

Fields displayed:

| Label | Source |
|---|---|
| OBJECT | `main_id` |
| TYPE | `otype` (mapped to human label, e.g. `GBar` → `BARRED SPIRAL GALAXY`) |
| RA | `ra` degrees → HMS format |
| DEC | `dec` degrees → DMS format |
| REDSHIFT | `z_value` (if present) |
| RADIAL VEL | `rvz_radvel` km/s (if present) |
| PAPERS | `nbref` reference count (if present) |

**Fallback:** If SIMBAD is unreachable or returns no results, a static NGC 1300
mock is rendered with a `— SIMBAD OFFLINE / CACHED DATA —` note.

**Timeout:** 12-second `AbortController` timeout — fetch is cancelled if the
CDN does not respond.

**CORS:** SIMBAD TAP is a public endpoint with `Access-Control-Allow-Origin: *`.
No proxy or backend required.

### PAPERS Panel

Replaced by HUD01-5 — see section below.

---

## HUD01-4 — Object / HTML mode switch

---

## HUD01-5b — VizieR References in PAPERS Tab

**Replaces HUD01-5 (NASA ADS).** No API key required — frontend-only, public CDS endpoint.

### Overview

The PAPERS tab shows VizieR catalog references: the catalog tables that contain
data for the current target object, fetched from the public VizieR votable service.

### Endpoint

```
GET https://vizier.cds.unistra.fr/viz-bin/votable
  ?-c=NGC+1300        object / coordinate (resolved by VizieR)
  &-c.rs=2            search radius: 2 arcmin
  &-out.max=1         1 data row per catalog (we want catalog IDs, not bulk data)
  &-source=           search all catalogs
  &-out.form=mini     compact output
```

Public endpoint, CORS-enabled — no authentication required.

### Response parsing

VizieR returns a VOTable XML document. Each `<RESOURCE>` element in the response
corresponds to a catalog table that has data for the queried position. The parser
extracts the `name` attribute (e.g. `J/ApJ/791/84/table3`) and strips the table
suffix to produce the catalog ID (`J/ApJ/791/84`), which is then used to build
the link to the VizieR catalog page.

### States

| Condition | Shown |
|---|---|
| Cache hit | Renders immediately (no fetch) |
| Fetching | Spinner + `LOADING VIZIER REFERENCES…` |
| Empty result | Falls back to demo data (NGC 1300) or `VIZIER REFERENCES UNAVAILABLE` |
| CORS / timeout / parse error | Falls back to demo data (NGC 1300 only) |
| Live fetch success | Scrollable catalog reference card list |

### Fallback demo data

For NGC 1300, a curated set of 8 real VizieR catalogs is hardcoded as a fallback.
This is shown when:
- The VizieR CDN is unreachable (CORS block, network error, timeout)
- The response parses to zero entries

The fallback includes: VII/155 (Steinicke RNGC), VII/237 (HYPERLEDA), J/AJ/146/86 (S4G),
J/ApJS/197/21 (NIRS0S), J/AJ/143/138 (Galaxy Zoo 2), J/ApJS/190/147 (SINGG),
J/MNRAS/444/527 (bar decompositions), J/A+A/532/A74 (CALIFA).

For non-NGC-1300 targets, a live fetch failure shows `VIZIER REFERENCES UNAVAILABLE`.

### Catalog cards

Each card contains:
- **Title / table name** — linked to the VizieR catalog page (opens in new tab)
- **Meta line** — catalog ID · year · first author
- **Description** — from the VizieR INFO element or fallback text (2-line CSS clamp)

### Memory cache

Results are cached in `vizierCache[target]` for the page lifetime.
Second call for the same target renders immediately from cache.

### AbortController + timeout

10-second timeout; same AbortController pattern as SIMBAD:
- In-flight request for a stale target is cancelled when `setTarget()` changes the target

### Config

```html
<script>
  window.NC_HUD_01_CONFIG = {
    objectMode:  true,
    vizierLimit: 10     // max catalog entries (1–20), default 10
  };
</script>
```

No API key needed.

### CSS layout

The PAPERS panel switches display modes via the `nc-ol-papers-list` class:

| State | CSS display |
|---|---|
| Status / placeholder | `flex` (centred, default) |
| Catalog list rendered | `block + overflow-y: auto; max-height: 270px` |

### Known limitations

- **CORS on viz-bin/votable**: The VizieR CGI endpoint may not always send
  CORS headers on all server paths. If blocked, the fallback demo data is shown.
  Future option: use TAPVizier TAP endpoint (confirmed CORS) with an ADQL metadata query.
- **Catalog count**: The number of catalog tables returned depends on VizieR's
  internal index and the search radius. Large, well-studied objects return more.
- **Non-NGC-1300 targets**: Live fetch only; no demo fallback for other objects.
- **NASA ADS**: ADS integration can be added later via a backend proxy once
  an API token flow is in place — not in scope for the current frontend MVP.

### Config flag

At the top of `index.html`, before any stylesheets:

```html
<script>
  window.NC_HUD_01_CONFIG = {
    objectMode: true   // true → OBJECT mode | false → HTML mode
  };
</script>
```

Change `objectMode` and reload — no other edits needed.

### Modes

| Mode | `data-mode` | What shows |
|---|---|---|
| **OBJECT** (default) | `"object"` | Image, reticle, Aladin layer, DATA/PAPERS/CATALOG toolbar, info grid |
| **HTML** | `"html"` | Only the frame + `.nc-hud-01-html-slot` content |

### OBJECT mode defaults

| Control | Default |
|---|---|
| RETICLE | ON |
| ALADIN | OFF |
| DATA tab | ON (SIMBAD fetch on load) |

### HTML mode

In HTML mode the following are hidden:
- `.nc-ol-left` — image, Aladin layer, reticle overlay
- `.nc-ol-right` — title, info panels
- `.nc-ol-toolbar` — all buttons

The frame, glow, progress bar, and sweep animation remain visible.

### Pasting Blogger HTML

In `index.html`, find the slot and paste content inside:

```html
<div class="nc-hud-01-html-slot" aria-hidden="true">
  <!-- ▼ PASTE BLOGGER HTML HERE ▼ -->

  <h2>Your heading</h2>
  <p>Your paragraph text…</p>
  <img src="…" alt="…">

  <!-- ▲ END BLOGGER HTML ▲ -->
</div>
```

Supported elements (all scoped, no global style leak):
`h1–h4`, `p`, `a`, `ul/ol/li`, `img`, `iframe`, `video`, `table/th/td`

Overflow scrolls vertically; the frame does not break.

### JS API (HUD01-4)

```js
NcHud01.setMode("html")    // switch to HTML mode at runtime
NcHud01.setMode("object")  // switch back to OBJECT mode
NcHud01.getMode()          // → "object" | "html"
```

`setMode("html")` turns reticle and Aladin OFF, hides toolbar, shows slot.
`setMode("object")` restores: reticle ON, Aladin OFF, DATA tab active.

### Root element

`.nc-hud-01` class added to widget root (alongside `.nc-ol-widget`).  
All mode CSS uses `.nc-hud-01[data-mode="…"]` selectors — no conflict with existing `.nc-ol-*` rules.

---

## Known Limitations

- **C-07 — Single-instance API**: `window.NcHud01` and `init()` target the first `.nc-ol-widget` on the page. Embedding multiple HUD-01 instances in one document requires an instance-based pattern (e.g., `NcHud01.create(element)`). Not needed for current use.
- **Reticle vs. target-lock independence**: When `data-target-lock="off"`, the Reticle toolbar button can still be toggled but has no visible effect (reticle already hidden). No visual feedback distinguishes this state.
- **Aladin CDN dependency**: Once the ALADIN button is pressed, the viewer requires the CDS Unistra CDN to be reachable. A 15-second timeout triggers the fallback UI if the CDN is unavailable.
- **No retry after Aladin fallback**: After a CDN failure the placeholder shows an error message. Toggling ALADIN off and on again resets `aladinBusy` but does NOT automatically retry — the user must manually toggle again.
- **SIMBAD no retry**: Same pattern — after a SIMBAD timeout/error the fallback data is shown. Calling `NcHud01.loadSimbadData(target)` again triggers a fresh fetch.
- **SIMBAD magnitudes**: `V`, `B`, `R` magnitudes are in a separate `flux` table and are not included in the current query. Fallback mock shows `V ≈ 11.4` for NGC 1300.
- **otype label coverage**: `OTYPE_LABELS` map covers common types only. Unknown codes are displayed as-is.
- **Mobile / vertical layout**: The SVG frame is hidden below the 900 px breakpoint (legacy behaviour). The Aladin layer and toolbar are not designed for narrow viewports.
- **Single-instance config**: `window.NC_HUD_01_CONFIG` is a global — embedding two HUD-01 panels in one document with different modes is not supported without an instance factory.
- **HTML slot no sanitization**: Content pasted into `.nc-hud-01-html-slot` is rendered as-is. Do not paste untrusted third-party HTML.
- **`setMode` at runtime**: Switching modes at runtime does not restart or destroy the Aladin instance — if Aladin was initialised in object mode, switching to HTML mode and back leaves the instance intact (which is intentional).

---

## What was migrated (original pass)

- Full `nc-ol-*` CSS block extracted from `blogger-template.css`
- HTML fragment from `HUD-1.html` wrapped in standalone page structure
- Google Fonts import moved from CSS `@import` to HTML `<link>`

## What was moved to shared (original pass)

| Item | Destination | Reason |
|---|---|---|
| `ncOlPanelSweep` keyframe | `shared/css/animations.css` as `hudPanelSweep` | Identical across all legacy panels |
| `ncOlPanelBreath` keyframe | `shared/css/animations.css` as `hudBreath` | Reusable glow breathing pattern |
| `.nc-ol-sweep` geometry | `shared/css/effects.css` as `.nc-panel-sweep` | Sweep light effect reused by nc-or, nc-vv, nc-vs |

## What was moved to shared (HUD01-1)

| Item | Destination | Reason |
|---|---|---|
| `hudProgressScan` keyframe | `shared/css/animations.css` | Reusable scanning beam for any progress track |
| `.nc-anim-progress-scan` utility | `shared/css/animations.css` | Utility class wrapper |

## Animation references

| Was | Now | In file |
|---|---|---|
| `ncOlPanelBreath` | `hudBreath` | `.nc-ol-panel` animation |
| `ncOlRotateSlow` | `hudRotate` | `.nc-ol-ring-2` animation |
| `ncOlPanelSweep` | `hudPanelSweep` | `.nc-panel-sweep` (via effects.css) |
| SVG stripes | `hudProgressScan` | `.nc-ol-progress__fill` |

## What stayed local

- `ncOlOpenHud` — widget-specific expand-on-load animation
- `ncOlTopSvgSlider` — specific to this SVG accent tab
- All `.nc-ol-*` geometry, positioning, dimensions
- Toolbar layout and button styles
- Aladdin layer geometry and placeholder styles

## What was added (HUD01-2)

| Item | Location | Notes |
|---|---|---|
| Aladin Lite integration | `hud-01.js` | Lazy CDN load, `A.init` async, instance reuse |
| `loadAladinScript()` | `hud-01.js` | Settle/timeout pattern, CSS + JS injection |
| `initAladin()` | `hud-01.js` | RAF + `A.init.then()` + pending target queue |
| `applyTarget()` | `hud-01.js` | `gotoObject` + RA/Dec fallback |
| `setAladinTarget()` | `hud-01.js` | Public API; queues before init, triggers init+show |
| `#nc-hud-01-aladin-viewer` | `index.html` | Aladin render target, `position:absolute; inset:0` |
| `.nc-hud-01-aladdin__placeholder` | `index.html` / `hud-01.css` | Shown during standby/error; hidden by `--ready` class |
| `nc-hud-01-aladdin--ready` CSS class | `hud-01.css` | Hides placeholder once viewer is live |

## What still requires cleanup (future pass)

- All colours hardcoded (`rgba(80,220,255,...)`) — should eventually reference CSS tokens
- `font-family: "Share Tech Mono"` repeated — could use a token
- Fixed pixel widths (`520px`, `445px`, `420px`) — not fluid; acceptable for this design
- `z-index` raw integers — should reference `--hud-z-*` tokens
- **C-07**: Multi-instance API support (see Known Limitations above)

---

## Running locally

```bash
make server   # from HUD/ root
# http://localhost:8080/panels/hud-01/
```

## CSS namespace

All classes use the `.nc-ol-` prefix (Object Lock), except `.nc-hud-01-aladdin` (named after panel for specificity).
