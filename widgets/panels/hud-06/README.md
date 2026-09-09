# HUD-06 — Vertical Sidebar (`nc-vs-*`)

**Migration source:** `legacy/template/blogger-template.css` § VERTICAL SIDEBAR

---

## Shared layer used

| Shared file | What is consumed |
|---|---|
| `animations.css` | `hudPanelSweep` (via `.nc-panel-sweep`), `hudTickerScroll` |
| `effects.css` | `.nc-panel-sweep` (sweep beam geometry + animation) |

## Architecture: JS-driven layout

Like HUD-05, this panel requires JavaScript to render. `hud-06.js` computes all geometry at runtime from the panel's actual rendered dimensions and:

- Injects SVG polygon paths: outer frame, inner frame, 4 corner brackets (TL, BL, TR, bevel-BR), strip-line
- Positions `.nc-vs-loader` and `.nc-vs-ticker` via inline `style`
- Pads `.nc-vs-content` to clear the frame edges
- Re-draws on `resize` and `load`

The panel renders blank without JS. Unlike HUD-05, the media element is NOT JS-positioned — it sits in the normal CSS content flow inside `.nc-vs-content`.

## Local CSS blocks (`hud-06.css`)

- `.nc-hud06-stage` — standalone page wrapper with flex centering (widget is 400px fixed)
- `.nc-vs-widget / .nc-vs-panel` — widget root and panel container
- `.nc-vs-sidebar` — 400px fixed-width layout variant (used in standalone page)
- `.nc-vs-svg-frame` — full-bleed SVG overlay (content injected by JS)
- `.nc-vs-content / -title / -text` — editorial content area (flex column, gap 14px)
- `.nc-vs-media` — CSS-positioned media container with `:has()` height fix for iframe/video
- `.nc-vs-loader` — 9-segment absolute bar (position set by JS)
- `.nc-vs-ticker` — scrolling text strip (position set by JS)
- `.nc-vs-sweep` — widget-specific z-index (1) + opacity (.25); geometry from `.nc-panel-sweep`
- `ncVsSeg1-9` — local keyframes for 9-segment sequential loader
- Mobile `@media (max-width: 640px)` — `.nc-vs-sidebar` goes full-width

## No new shared promotions

`hudPanelSweep` and `hudTickerScroll` were already in shared from previous migrations.

## Comparison with HUD-05

| | HUD-05 (`nc-vv-*`) | HUD-06 (`nc-vs-*`) |
|---|---|---|
| Orientation | Wide horizontal (≤1200px) | Vertical sidebar (400px) |
| Loader segments | 16 (4% step) | 9 (6.5% step) |
| Media placement | JS-positioned (right column) | CSS flow (inside content) |
| System label | JS-positioned `<p>` | Not present |
| Corner brackets | TL, TR, BR | TL, BL, TR, bevel-BR |
| Sweep opacity | .35 | .25 |
| JS renderer | `drawWideVideoFrame` | `drawVerticalSidebarFrame` |

## Potential future cleanup

- `ncVsSeg1-9` use the same 6.5% stagger timing as `ncHpLoader1-8` in HUD-03/04 — only differing in segment count. A parameterised JS generator could unify all loader keyframe families.
- SVG filter IDs `ncVsGlow` / `ncVsGlowS` are hardcoded in both HTML and JS — same multi-instance clash risk as noted in HUD-05.
- The `nc-vs-left` / `nc-vs-right` float layout classes from the legacy (for Blogger two-column embedding) are intentionally excluded; re-add if needed for Blogger context.
- `.nc-vs-media:has(iframe)` uses `:has()` — not supported in Firefox < 121; a fallback height class could be added if needed.
