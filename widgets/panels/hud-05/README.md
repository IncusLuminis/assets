# HUD-05 — Wide Video (`nc-vv-*`)

**Migration source:** `legacy/template/blogger-template.css` § WIDE VIDEO

---

## Shared layer used

| Shared file | What is consumed |
|---|---|
| `animations.css` | `hudPanelSweep` (via `.nc-panel-sweep`), `hudTickerScroll` |
| `effects.css` | `.nc-panel-sweep` (sweep beam geometry + animation) |

## Architecture: JS-driven layout

Unlike HUD-01..04 which are purely CSS-driven, this panel requires JavaScript to function. `hud-05.js` computes all geometry at runtime from the panel's actual rendered dimensions and:

- Injects SVG polygon paths for the outer frame, inner frame, and corner brackets
- Positions `.nc-vv-right` (video column), `.nc-vv-loader`, `.nc-vv-system`, and `.nc-vv-ticker` via inline `style`
- Re-draws on `resize` and `load`

The panel renders blank without JS. The SVG uses two inline `<filter>` defs (`ncVvGlow`, `ncVvGlowS`) referenced by the JS-injected SVG content.

## Local CSS blocks (`hud-05.css`)

- `.nc-hud05-stage` — standalone page wrapper
- `.nc-vv-widget / .nc-vv-panel` — widget root and panel container
- `.nc-vv-svg-frame` — full-bleed SVG overlay (content injected by JS)
- `.nc-vv-content / -title / -system / -text` — editorial content area
- `.nc-vv-right` — absolute-positioned video column (dims set by JS)
- `.nc-vv-media` — media container with HUD border + glow
- `.nc-vv-loader` — 16-segment absolute bar (position set by JS)
- `.nc-vv-ticker` — scrolling text strip (position set by JS)
- `.nc-vv-sweep` — widget-specific z-index (1) + opacity (.35); geometry from `.nc-panel-sweep`
- `ncVvSeg1-16` — local keyframes for 16-segment sequential loader
- Mobile `@media (max-width: 900px)` — hides SVG/loader/ticker/sweep, switches video to stacked layout

## No new shared promotions

`hudPanelSweep` and `hudTickerScroll` were already in shared from previous migrations.

## Comparison with HUD-03/04

| | HUD-03/04 | HUD-05 |
|---|---|---|
| Namespace | `nc-hp-*` | `nc-vv-*` |
| Frame | CSS clip-path | JS-generated SVG |
| Loader | 8-segment, CSS-positioned | 16-segment, JS-positioned |
| Video | Float/absolute (CSS) | Absolutely positioned by JS |
| JS | Stub only | Required (frame renderer) |

## Potential future cleanup

- `ncVvSeg1-16` follow an arithmetic 4% step per segment — same JS-generation candidate as `ncHpLoader*` in HUD-03/04.
- The SVG filter IDs `ncVvGlow` / `ncVvGlowS` are hardcoded in both the HTML and JS; if multiple instances are embedded in one page the IDs would clash — would need unique IDs per instance.
- Mobile fallback drops all frame chrome and switches to a simple border; a future pass could add a simplified SVG frame at mobile widths.
