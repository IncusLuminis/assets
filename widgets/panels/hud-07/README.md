# HUD-07 — Accordion (`sa-accordion / sa-*`)

**Migration source:** `widgets/legacy/panels/HUD-7.html` inline `<style>` and `<script>`

Note: the `sa-accordion` CSS in `blogger-template.css` is a completely different, older checkbox-based implementation. HUD-7 is a standalone newer JS-driven accordion and is migrated from its own inline styles.

---

## Shared layer used

None of the shared HUD primitives are consumed by this widget. The shared CSS layer is loaded for system consistency but the accordion has its own complete, self-contained styles.

| Shared file | Status |
|---|---|
| `animations.css` | Loaded but not used (no keyframes in this widget) |
| `effects.css` | Loaded but not used (no sweep / glow classes) |
| All others | Loaded for consistency |

## Architecture: JS-driven toggle

`hud-07.js` handles accordion open/close:
- Listens for `click` on each `.sa-toggle` button
- Toggles `.sa-open` class on the parent `.sa-accordion`
- Updates `aria-expanded` for accessibility
- CSS transitions handle the visual expansion (`max-height: 0 → 800px`, `transform: rotate(180deg)` on arrow)
- No SVG frame, no loader, no ticker — this is a pure content widget

## Local CSS blocks (`hud-07.css`)

- `.nc-hud07-stage` — standalone page wrapper (background `#050b12`, padding 40px, font Arial)
- `.sa-materials` — 900px max-width grid container (gap 14px)
- `.sa-accordion` — accordion item root
- `.sa-toggle` — octagonal clip-path button with HUD border and glow
- `.sa-toggle:hover` — brighter border + glow on hover
- `.sa-icon` — hexagonal clipped icon container
- `.sa-icon svg` — stroke-based SVG icon
- `.sa-title / .sa-arrow` — label and chevron with transition
- `.sa-panel` — collapsible body (max-height transition, chamfered clip-path)
- `.sa-panel-inner` — padded content area
- `.sa-accordion.sa-open` — open state (expands panel, rotates arrow)
- `.sa-expert` — amber accent variant (border, icon, arrow color overrides)
- Mobile `@media (max-width: 640px)`

## No new shared promotions

No keyframes, no sweep, no loader. The transitions are CSS `transition` properties, not `@keyframes`.

## Comparison with HUD-05/06

| | HUD-05/06 | HUD-07 |
|---|---|---|
| Frame | JS-generated SVG polygons | None — CSS `clip-path` |
| JS role | SVG renderer + layout | Accordion toggle only |
| Loader | Multi-segment animated bar | None |
| Shared animations | hudPanelSweep, hudTickerScroll | None |
| Font | Share Tech Mono | Arial |
| Width | Full-width / 400px fixed | 900px max-width |

## Potential future cleanup

- `max-height: 800px` is an arbitrary ceiling for the expanded panel — content taller than 800px would be clipped. A JS-based height calculation (setting `max-height` to `scrollHeight`) would be more robust.
- `.sa-expert` variant uses amber instead of cyan — consider if more variants (`.sa-warning`, `.sa-critical`) are planned and whether the accent color should become a CSS custom property on the `.sa-accordion` element.
- `clip-path` on `.sa-toggle` means the button's visible hit area is clipped; the bevel cuts at `0 20px` and `calc(100% - 20px)` — touch targets at corners are smaller than expected.
- The `blogger-template.css` accordion is a separate, older implementation that may still be in use on legacy pages. The two systems are not compatible.
