# HUD-04 — HUD Post with Media Embed (`nc-hp-*`)

**Migration source:** `legacy/template/blogger-template.css` § HUD PANEL

---

## Shared layer used

| Shared file | What is consumed |
|---|---|
| `animations.css` | `hudPanelSweep` (via `.nc-panel-sweep`), `hudTickerScroll` |
| `effects.css` | `.nc-panel-sweep` (sweep beam geometry + animation) |

## Relationship to HUD-03

HUD-04 uses the identical `nc-hp-*` frame structure as HUD-03. The only structural difference is the content area: HUD-03 uses `.nc-hp-float-image` (static image), HUD-04 uses `.nc-hp-media` (aspect-ratio iframe/video/image embed). Each panel ships as a standalone file — no cross-panel imports.

## Local CSS blocks (`hud-04.css`)

- `.nc-hud04-stage` — standalone page wrapper
- `.nc-hp-panel` — widget root with local custom properties (`--loader-left`, `--loader-width`, `--frame-edge`, `--top-line-y`, `--top-line-drop`, `--top-line-lower-y`)
- `.nc-hp-frame-shell` — outer clipped border frame with glow
- `.nc-hp-frame-mask-left / -right` — black mask elements that hide frame overlaps
- `.nc-hp-frame-inner` — inner secondary border frame with clip-path
- `.nc-hp-frame-topline` — multi-segment glowing top accent line
- `.nc-hp-frame-loader` — skewed 8-segment animated progress bar
- `.nc-hp-frame-ticker` — scrolling telemetry text strip
- `.nc-hp-sweep` — widget-specific z-index + opacity (geometry from `.nc-panel-sweep`)
- `.nc-hp-content / -system / -title / -text` — editorial content area
- `.nc-hp-media / -vertical / -horizontal` — aspect-ratio media container (iframe/video/img)
- `ncHpLoader1-8` — local keyframes for sequential segment reveal
- Mobile `@media (max-width: 900px)`

## No new shared promotions

No new generic animations or effects were found during this migration.

## Potential future cleanup

- The `nc-hp-*` frame CSS is duplicated between hud-03 and hud-04. A future pass could extract it to a shared component layer (e.g. `shared/css/hud-post.css`) and update both panels to import it.
- `ncHpLoader1-8` follow an arithmetic stagger — same cleanup note as HUD-03.
- `.nc-hp-media` has `left: -14px` to pull the embed slightly left; this is pixel-tuned to the panel padding and must be adjusted if panel padding changes.
