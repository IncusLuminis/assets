# HUD-02 — Object Report (`nc-or-*`)

**Migration source:** `legacy/template/blogger-template.css` § OBJECT REPORT

---

## Shared layer used

| Shared file | What is consumed |
|---|---|
| `animations.css` | `hudBreath`, `hudRotate`, `hudPulseOuter`, `hudPulseInner`, `hudBlinkSoft`, `hudLockBoxPulse`, `hudPanelSweep` |
| `effects.css` | `.nc-panel-sweep` (sweep beam geometry + animation) |

## Local CSS blocks (`hud-02.css`)

- `.nc-hud02-stage` — standalone page wrapper
- `.nc-or-widget / .nc-or-panel` — widget root + 30/70 grid layout
- `.nc-or-frame-svg / -main / -inner / -stripes / -teeth / -teeth-box` — decorative SVG frame
- `.nc-or-sweep` — widget-specific z-index + opacity override (geometry from `.nc-panel-sweep`)
- `.nc-or-left / .nc-or-right` — column layout
- `.nc-or-image` — target image with filter
- `.nc-or-reticle / -ring / -cross / -lock-box / -corner / -center-dot / -target-lock` — targeting overlay
- `.nc-or-system / -title / -desc / -textbox / -text-title / -text / -log` — right column text
- Mobile `@media (max-width: 900px)`

## No local keyframes

All animations are sourced from `shared/css/animations.css`. Four keyframes (`hudPulseOuter`, `hudPulseInner`, `hudBlinkSoft`, `hudLockBoxPulse`) were promoted to shared during this migration and simultaneously cleaned from `hud-01.css`.

## Potential future cleanup

- `.nc-or-image` position is absolute with percentage offsets tied to the 30% left column — could be made more robust with a proper CSS grid subgrid approach.
- SVG `viewBox="0 0 1200 420"` + `preserveAspectRatio="none"` means the frame distorts below 1200px; a future pass could rework to non-scaling-stroke only layout.
