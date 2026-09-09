# Widget Contract

Rules every HUD widget must follow to remain compatible with the shared layer and future embed targets.

---

## Directory structure

```
panels/<widget-name>/
  index.html       # entry point — must be self-contained and runnable
  <name>.css       # widget-scoped styles only
  <name>.js        # widget logic stub
  README.md        # purpose, files, how to run
```

---

## HTML requirements

- `<!DOCTYPE html>` declaration present.
- `<meta charset="UTF-8">` and `<meta name="viewport">` present.
- Shared CSS loaded **in this order**, before widget CSS:
  1. `../../shared/css/reset.css`
  2. `../../shared/css/tokens.css`
  3. `../../shared/css/base.css`
  4. `../../shared/css/animations.css`
  5. `../../shared/css/typography.css`
- Shared JS loaded before widget JS:
  1. `../../shared/js/hud-core.js`
- Widget must open at `panels/<name>/index.html` via static server without build step.

---

## CSS rules

- All widget classes use the `.nc-<widget-slug>` namespace prefix.
- No global element overrides — scope everything under the widget's root class.
- Use CSS custom properties from `tokens.css` — never hardcode colour or spacing values.
- Animation utility classes from `animations.css` may be applied directly in HTML.

---

## JS rules

- Vanilla JS only. No `import`/`export`, no `require`, no frameworks.
- Widget script must be wrapped in an IIFE: `(function() { 'use strict'; ... })();`
- Access `HUDCore` and `HUDLoader` via `window.*` globals — they are loaded before the widget script.
- No `document.write`. No external network calls in widget JS.

---

## Playground / embed compatibility

- Widget must render correctly inside an `<iframe>` (no `X-Frame-Options` issues for local dev).
- Widget layout must be responsive within its container — use `%` widths, not fixed `px` widths on the root element.
- Widget must not depend on `window.parent` or cross-frame messaging (reserved for future embed layer).

---

## Naming conventions

| Item | Pattern | Example |
|---|---|---|
| Widget directory | `kebab-case` | `asymmetric-panel` |
| CSS namespace | `.nc-<slug>` | `.nc-asym-panel` |
| JS IIFE | anonymous | `(function() {})()` |
| CSS file | `<slug>.css` | `panel.css` |
| JS file | `<slug>.js` | `panel.js` |
