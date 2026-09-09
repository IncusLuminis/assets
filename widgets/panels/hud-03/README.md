# HUD-03 — HUD Post (`nc-hp-*`)

**Migration source:** `legacy/template/blogger-template.css` § HUD PANEL

---

## Shared layer used

| Shared file | What is consumed |
|---|---|
| `animations.css` | `hudPanelSweep` (via `.nc-panel-sweep`), `hudTickerScroll` (promoted during this migration) |
| `effects.css` | `.nc-panel-sweep` (sweep beam geometry + animation) |

## Local CSS blocks (`hud-03.css`)

- `.nc-hud03-stage` — standalone page wrapper
- `.nc-hp-panel` — widget root with local custom properties (`--loader-left`, `--loader-width`, `--frame-edge`, `--top-line-y`, `--top-line-drop`, `--top-line-lower-y`)
- `.nc-hp-frame-shell` — outer clipped border frame with glow
- `.nc-hp-frame-mask-left / -right` — black mask elements that hide frame overlaps
- `.nc-hp-frame-inner` — inner secondary border frame with clip-path
- `.nc-hp-frame-topline` — multi-segment glowing top accent line (left + slope + right + side spans)
- `.nc-hp-frame-loader` — skewed 8-segment animated progress bar
- `.nc-hp-frame-ticker` — scrolling telemetry text strip
- `.nc-hp-sweep` — widget-specific z-index + opacity (geometry from `.nc-panel-sweep`)
- `.nc-hp-content / -system / -title / -text / -float-image` — editorial content area
- `ncHpLoader1-8` — local keyframes for sequential segment reveal
- Mobile `@media (max-width: 900px)`

## Promoted to shared during this migration

- `hudTickerScroll` → `shared/css/animations.css` + `.nc-anim-ticker` utility class

## Local keyframes

- `ncHpLoader1-8` — 8 coordinated keyframes with staggered fade-in/fade-out for the progress bar segments. Highly widget-specific timing; not suitable for shared layer.

## Potential future cleanup

- The 8 `ncHpLoader*` keyframes follow a strict arithmetic pattern (6.5% step per segment). A future JS-driven approach could generate them programmatically and reduce local CSS.
- `.nc-hp-frame-topline` line segments are positioned via `calc()` against `--loader-left` / `--loader-width` — tightly coupled to the loader geometry; document before changing either.
- The frame masks (`nc-hp-frame-mask-left / -right`) are pixel-tuned background patches; they depend on the exact frame-shell clip-path and must be adjusted together.
