# NebulaCast HUD Panels — Audit & Structure Reference
**Scope:** HUD-01 … HUD-06 · Pre-release snapshot · 2026-05-24  
**Audience:** Product Owner — input for release specification

---

## 1. What This Is

A set of six self-contained sci-fi HUD panels designed to be embedded as `<iframe>` widgets inside Blogger posts.  
Each panel is a standalone HTML page (`index.html`) that loads its own CSS and JS. All panels share a common CSS/JS foundation layer.  
No build step, no bundler, no backend. Pure vanilla HTML + CSS + JS.

---

## 2. Repository Layout

```
HUD/widgets/
├── shared/                   ← foundation layer (used by all panels)
│   ├── css/
│   │   ├── reset.css         normalise browser defaults
│   │   ├── tokens.css        CSS custom properties (colours, spacing, z-index)
│   │   ├── base.css          body, html defaults
│   │   ├── animations.css    shared keyframe library
│   │   ├── typography.css    font stack, text utilities
│   │   ├── layout.css        generic layout helpers
│   │   ├── effects.css       .nc-panel-sweep + shared glow effects
│   │   └── mini-toggle.css   collapsed/expanded toggle button skin
│   └── js/
│       ├── hud-core.js       utility helpers (qs, el, zeroPad, clamp …)
│       ├── hud-mini.js       NcHudMini — generic collapse/expand module
│       └── hud_papers.js     ADS / VizieR paper-list renderer
└── panels/
    ├── hud-01/  index.html  hud-01.css  hud-01.js
    ├── hud-02/  index.html  hud-02.css  hud-02.js
    ├── hud-03/  index.html  hud-03.css  hud-03.js
    ├── hud-04/  index.html  hud-04.css  hud-04.js
    ├── hud-05/  index.html  hud-05.css  hud-05.js
    └── hud-06/  index.html  hud-06.css  hud-06.js
```

Font: **Share Tech Mono** loaded from Google Fonts CDN (single `<link>`).  
No other external dependencies except those listed per-panel below.

---

## 3. Shared Foundation Layer

### 3.1 Design Tokens (`tokens.css`)
All colours and spacing are CSS custom properties on `:root`.  
Key values used everywhere:

| Token | Value | Purpose |
|---|---|---|
| `--hud-bg` | `#020d14` | page/stage background |
| `--hud-panel` | `rgba(0,20,36,.85)` | panel fill |
| `--hud-line` | `#00ffe7` | frame strokes, accents |
| `--hud-glow` | `rgba(0,255,231,.55)` | glow halos |
| `--hud-text` | `#c8f0ff` | body text |
| `--hud-text-accent` | `#00ffe7` | labels, values |

### 3.2 Shared Animations (`animations.css`)
Named keyframes available to all panels (not duplicated per-panel):

| Keyframe | Usage |
|---|---|
| `hudPulse` | ambient glow breathing |
| `hudRotate` | targeting rings, radar |
| `hudBlink` | status indicators |
| `hudSweep` | single-revolution arc |
| `hudFlicker` | boot-up flicker |
| `hudPanelSweep` | diagonal light-beam sweep |
| `hudBreath` | subtle panel opacity pulse |
| `hudProgressScan` | progress-bar scanner |
| `hudPulseOuter/Inner` | concentric ring pulses |
| `hudBlinkSoft` | soft fading blink |
| `hudLockBoxPulse` | lock-box corner throb |

### 3.3 `hud-core.js`
Utility module (`HUDCore`). Provides `qs()`, `qsa()`, `el()`, `zeroPad()`, `clamp()`.  
No side effects on load. Used internally by panel JS files.

### 3.4 `hud-mini.js` — Collapse/Expand Toggle
Module: `window.NcHudMini.init(options)`.  
Injects a `▲ / ▼` button onto the panel, handles max-height transition between mini and expanded states. Options: `widget`, `panel`, `miniH` (px), `scale` (shrink factor or `null` for crop-only), `expandedMaxH`, `onCollapse`, `onExpand` callbacks.  
Used by HUD-02 through HUD-06.

### 3.5 `hud_papers.js`
Renders the PAPERS tab (ADS references via SIMBAD TAP) and the CATALOGS tab (VizieR).  
Used only by HUD-01 and HUD-02 (object-mode panels).

---

## 4. Panel-by-Panel Reference

---

### HUD-01 — Object Lock
**CSS:** `hud-01.css` (≈1 270 lines) · **JS:** `hud-01.js` (≈1 240 lines)

#### Layout
Two-column grid inside a polygonal SVG frame (1 200 × 420 viewBox):
- **Left column:** square image well with reticle overlay, Aladin Lite sky viewer
- **Right column:** object title + three info tabs (DATA / PAPERS / CATALOGS)
- **Toolbar:** bottom strip with toggle buttons

#### Frame
Outer frame is an SVG `<path>` polygon drawn with two concentric paths (outer frame + inner border). Additional decorative paths for photo-area top/bottom lines and a filled tab rectangle.  
The frame SVG lives at `z-index: 30`, above content columns.

#### Modes (runtime-switchable via `window.NC_HUD_01_CONFIG`)
| `objectMode` | Behaviour |
|---|---|
| `true` | Object viewer: reticle, Aladin Lite sky map, SIMBAD data, VizieR catalogs, ADS papers |
| `false` | HTML slot: arbitrary Blogger HTML pasted into `.nc-hud-01-html-slot` |

#### Animations
- **Open:** panel width `120px → 100%` on load (`ncOlOpenHud`, 1.2 s cubic-bezier)
- **Progress bar:** horizontal scanner in the header strip (`hudProgressScan`)
- **Reticle rings:** continuous rotation at different speeds (`hudRotate`)
- **Lock-box corners:** pulse on target-lock (`hudLockBoxPulse`)
- **Contour sweep (glow bar):** four SVG path layers travel along the outer frame perimeter at 22 s. Layers: wide soft aura (72 px, `blur(32px)`) → mid-outer (32 px, `blur(16px)`) → mid-inner (10 px, `blur(3px)`) → sharp center line (2 px, no blur). SVG has `overflow: visible` to prevent blur clipping at edges.
- **Aladin:** continuous sky background, default survey DSS2 color

#### JS Modules (hud-01.js)
- Toolbar toggle engine (Group A: reticle; Group B: DATA/PAPERS/CATALOGS)
- SIMBAD TAP fetch → renders object data rows in two-column grid
- Aladin Lite v3 lazy init (CDN injected on first use); fallback to photo on error
- VizieR fetch for CATALOGS tab (limit configurable via `vizierLimit`)
- ADS papers via `hud_papers.js`
- Config reader (`NC_HUD_01_CONFIG`)

#### External CDN (loaded lazily, only when ALADIN tab activated)
- `aladin.js` + `aladin.min.css` from `aladin.cds.unistra.fr`

---

### HUD-02 — Object Report
**CSS:** `hud-02.css` (≈1 110 lines) · **JS:** `hud-02.js` (≈1 060 lines)

#### Layout
Two-column grid inside a distinct polygonal SVG frame (1 200 × 420 viewBox):
- **Left column:** image well + Aladin Lite viewer + reticle
- **Right column:** title + DATA / PAPERS / CATALOGS tabs
- **Toolbar:** bottom strip
- **Mini/expand toggle:** `▲ / ▼` button (shared `NcHudMini`)

#### Frame
Different polygon from HUD-01: angled top-left corner, flat top-right, teeth decoration along the bottom edge. Frame SVG is at `z-index: 1` (behind columns), hence the contour runner is in a **separate SVG overlay** at `z-index: 40`.

#### Modes
Same `objectMode` / HTML-slot switch as HUD-01, configured via `window.NC_HUD_02_CONFIG`.

#### Animations
- **Open:** panel width animation on load
- **Loader bar:** 8 sequential segments animate opacity in a scanning pattern
- **Contour sweep (glow bar):** same 4-layer system as HUD-01, running on the outer polygon path at 22 s. Runner lives in `.nc-or-runner-svg` overlay (separate `<svg>`, `z-index: 40`, `overflow: visible`)
- Reticle, lock-box, progress identical to HUD-01

#### JS
Functional mirror of HUD-01: SIMBAD TAP, Aladin Lite v3 lazy init, VizieR, ADS, toolbar, config reader. Separate module, separate namespace (`nc-or-*`).

---

### HUD-03 — Character Post (Text + Image)
**CSS:** `hud-03.css` · **JS:** `hud-03.js` (36 lines)

#### Purpose
Narrative editorial panel: character portrait floated left, free-form text right. No data APIs.

#### Layout
Single-column CSS panel with:
- `nc-hp-frame-shell` — outer border via CSS `clip-path` polygon + box-shadow glow
- `nc-hp-frame-topline` — angled top-left corner with slope segment
- `nc-hp-frame-inner` — inner inset border
- `nc-hp-system` — system label (e.g. "OUTPOST 32")
- `nc-hp-title` — character name
- `nc-hp-text` — free HTML text area with `nc-hp-float-image` (CSS float left)
- `nc-hp-frame-ticker` — scrolling ticker at the bottom
- `nc-hp-frame-loader` — 8 sequential segments

#### Mini state
Mini card shows a thumbnail image + name. Panel collapses to mini-card height via `NcHudMini` (crop, no scale transform). Clicking anywhere on the mini-card expands.

#### Animations
- **Open:** `scaleX(0 → 1)` on load
- **Loader:** 8 segments sequential opacity
- **Ticker:** continuous horizontal scroll
- **Sweep:** diagonal light beam (`hudPanelSweep`)

#### Content insertion
Edit directly in `index.html`: replace `src=` on `nc-hp-float-image`, update `nc-hp-system`, `nc-hp-title`, body text inside `nc-hp-text`.

---

### HUD-04 — Character Post (Text + Vertical Video)
**CSS:** `hud-04.css` · **JS:** `hud-04.js` (72 lines)

#### Purpose
Same editorial layout as HUD-03, but the portrait image is replaced by a **vertical `<iframe>` video** (e.g. HeyGen AI avatar). Text flows beside it.

#### Differences vs HUD-03
- `nc-hp-media nc-hp-media-vertical` block containing `<iframe>` instead of `<img>`
- `nc-reconnect` overlay ("RECONNECTING…") shown while iframe loads, hidden on iframe `load` event
- Mini card shows a scaled-down `<iframe>` preview (via `nc-hp-mini-video-wrap` CSS transform)
- JS: detects iframe load, hides reconnect overlay

#### Content insertion
Same as HUD-03; additionally replace `iframe src=` with the embed URL.

---

### HUD-05 — Wide Video Panel
**CSS:** `hud-05.css` · **JS:** `hud-05.js` (251 lines)

#### Purpose
Landscape editorial panel: text left, wide embedded video right. Frame geometry computed at runtime and re-drawn on resize.

#### Layout (runtime geometry)
JS `drawWideVideoFrame()` runs at `DOMContentLoaded` and on `ResizeObserver`:
- Reads `panel.offsetWidth` → derives all proportional coordinates
- Writes SVG `<path>` elements into `.nc-vv-frame-g` (outer frame, inner border, loader bar, ticker, video bevel cutout)
- Positions video container and text column via inline `paddingLeft/Right/Top` to match SVG geometry
- Video is sized to fit available column height while preserving 16:9 ratio

#### Frame
SVG frame drawn by JS (not baked into HTML). Two glow filters defined in `<defs>`: `ncVvGlow` (stdDeviation 3) and `ncVvGlowS` (1.5).  
Video area is masked by the bevel cutout in the SVG frame.

#### Mini state
`NcHudMini` with `scale` factor — mini card is a scaled-down live preview of the whole panel. Crop mode not used here.

#### Animations
- **Open:** `scaleY(0 → 1)` on load
- **Sweep:** diagonal beam
- **Loader:** 16 segments sequential

#### Content insertion
Replace `iframe src=` in `nc-vv-media`. Update `nc-vv-system`, `nc-vv-title`, body text.

---

### HUD-06 — Vertical Sidebar
**CSS:** `hud-06.css` · **JS:** `hud-06.js` (210 lines)

#### Purpose
Narrow vertical panel (sidebar form factor). Video on top, text below. Frame geometry also computed at runtime.

#### Layout
SVG viewBox `320 × 480`. JS draws frame paths into `.nc-vs-frame-g` proportionally.  
Content: `nc-vs-title` → `nc-vs-media` (iframe, 380 px tall in expanded state) → `nc-vs-text`.

#### Differences vs HUD-05
- Portrait (vertical) aspect ratio
- Fewer loader segments (9 instead of 16)
- Video area height is fixed at 380 px (CSS: `.nc-vs-media:has(iframe)`)
- Mini card shows scaled `<iframe>` preview

#### Mini state
Same `NcHudMini` pattern; mini height 148 px default.

#### Content insertion
Replace `iframe src=`, update `nc-vs-title`, body text.

---

## 5. Feature Matrix

| Feature | HUD-01 | HUD-02 | HUD-03 | HUD-04 | HUD-05 | HUD-06 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| SVG polygon frame | ✓ | ✓ | — | — | ✓ JS | ✓ JS |
| CSS clip-path frame | — | — | ✓ | ✓ | — | — |
| Mini/expand toggle | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mini thumbnail (image) | — | — | ✓ | — | ✓ | — |
| Mini thumbnail (video) | — | — | — | ✓ | — | ✓ |
| Contour glow sweep | ✓ | ✓ | — | — | — | — |
| Diagonal sweep beam | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Scrolling ticker | ✓ | — | ✓ | ✓ | ✓ | ✓ |
| Sequential loader bar | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Image float | ✓ | ✓ | ✓ | — | — | — |
| Embedded video (iframe) | — | — | — | ✓ | ✓ | ✓ |
| RECONNECTING overlay | — | — | — | ✓ | ✓ | ✓ |
| Targeting reticle | ✓ | ✓ | — | — | — | — |
| SIMBAD data fetch | ✓ | ✓ | — | — | — | — |
| VizieR catalogs tab | ✓ | ✓ | — | — | — | — |
| ADS papers tab | ✓ | ✓ | — | — | — | — |
| Aladin Lite sky viewer | ✓ | ✓ | — | — | — | — |
| Object / HTML mode switch | ✓ | ✓ | — | — | — | — |
| Runtime-drawn SVG geometry | — | — | — | — | ✓ | ✓ |
| ResizeObserver redraw | — | — | — | — | ✓ | ✓ |

---

## 6. Embedding in Blogger

Each panel is embedded as an `<iframe>`:

```html
<iframe
  src="URL_TO_PANEL/index.html"
  width="100%"
  height="480"
  frameborder="0"
  scrolling="no"
  style="display:block; border:none; overflow:hidden;">
</iframe>
```

- **No cross-origin issues** — files are served from the same host or a CDN.
- `scrolling="no"` prevents internal scroll bars.
- Height should match the panel's expanded height (HUD-01/02: 420 px + toolbar; HUD-03/04: variable; HUD-05: 300 px; HUD-06: 480 px).
- The mini/expand toggle manages its own height internally via `maxHeight` transition; the iframe height should accommodate the expanded state.

### Customisation per embed (edit `index.html` before publishing)
| What | Where |
|---|---|
| Object name (HUD-01/02) | `<h2 class="nc-ol-title">` / `<h2 class="nc-or-title">` |
| Photo URL (HUD-01/02) | `<img class="nc-ol-image" src="…">` |
| SIMBAD target (HUD-01/02) | `window.NC_HUD_01_CONFIG` / `NC_HUD_02_CONFIG` (future param) |
| Mode (object vs html) | `objectMode: false` in config block + fill `.nc-hud-01-html-slot` |
| Character name (HUD-03/04/06) | `<h2 class="nc-hp-title">` / `nc-vs-title` |
| Video URL | `<iframe src="…">` in `nc-hp-media` / `nc-vv-media` / `nc-vs-media` |
| Body text | Inner HTML of `nc-hp-text` / `nc-vv-text` / `nc-vs-text` |
| Ticker content | `<span>` inside `nc-hp-frame-ticker` / `nc-vv-ticker` / `nc-vs-ticker` |
| VizieR limit (HUD-01/02) | `vizierLimit: N` in config block (1–20) |

---

## 7. CSS Architecture

### Naming convention
All classes are prefixed `nc-` to avoid collision with Blogger's injected styles.  
Each panel uses its own sub-prefix:

| Panel | Prefix |
|---|---|
| HUD-01 | `nc-ol-` (Object Lock) |
| HUD-02 | `nc-or-` (Object Report) |
| HUD-03/04 | `nc-hp-` (HUD Post) |
| HUD-05 | `nc-vv-` (Video Wide) |
| HUD-06 | `nc-vs-` (Video Sidebar) |

### Load order (per panel)
```
reset.css → tokens.css → base.css → animations.css →
typography.css → layout.css → effects.css →
[mini-toggle.css] → hud-NN.css
```

Cache-busting via `?v=N` query strings on each `<link>`. Increment `v=` when the file changes.

### Version query strings (current)
| File | Version |
|---|---|
| `hud-01.css` | v16 |
| `hud-02.css` | v11 |
| `mini-toggle.css` | v3 |
| `hud-mini.js` | v3 |
| `hud-core.js` | v3 |
| `hud_papers.js` | v3 |

---

## 8. Known Constraints & Notes

1. **Single-instance per page.** HUD-01 and HUD-02 JS are scoped to the first matching widget on the page. Multi-instance requires a factory refactor.
2. **Aladin Lite is lazy-loaded.** First click of the ALADIN button triggers a CDN fetch. No CDN traffic on page load.
3. **SIMBAD / VizieR / ADS are public, unauthenticated APIs.** Rate limits are generous for a blog use-case; no API keys required.
4. **Frame geometry in HUD-05/06 is JS-driven.** If JS is blocked, the frame will not render. Content is still accessible (text, iframe) but unstyled.
5. **Blogger strips `<script>` tags from HTML gadgets.** Panels must be served as separate HTML pages (iframe), not pasted inline.
6. **Fonts load from Google CDN.** Share Tech Mono. Can be self-hosted if CDN dependency is unacceptable.
7. **`overflow: visible` on HUD-01 frame SVG** is required for the contour glow-bar blur to not be hard-clipped at the SVG viewport boundary.
8. **Contour sweep (HUD-01/02) performance.** Four animated SVG paths with CSS blur filters. Runs at ~60 fps on modern hardware; may drop on older mobile devices.
9. **HUD-03/04 frame is CSS `clip-path`**, not SVG — simpler, fully scalable, no JS dependency.
10. **Blogger `<iframe>` height** must be set manually to match the panel's expanded height; there is no automatic iframe-resizing mechanism.

---

## 9. Release Checklist Skeleton
*(for PO to expand into full spec)*

- [ ] Decide canonical hosting location for all `index.html` + asset files
- [ ] Confirm iframe heights per panel for Blogger gadget config
- [ ] Define content-swap workflow (who edits `index.html`, how files are published)
- [ ] Verify Google Fonts CDN is accessible from target audience geography
- [ ] Smoke-test Aladin Lite CDN init on all 6 target browsers
- [ ] Smoke-test SIMBAD/VizieR responses (public, no auth — should be stable)
- [ ] Agree on version-bump procedure for CSS/JS cache busting
- [ ] Decide whether HUD-01/02 "HTML mode" (objectMode: false) will be used in production, or always object mode
- [ ] Define ticker text per panel (currently placeholder JWST copy)
- [ ] Confirm mini-state collapse behaviour matches Blogger column width
