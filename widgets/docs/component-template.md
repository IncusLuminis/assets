# Component Template

Canonical structure and rules for every HUD widget.

---

## Directory structure

```
panels/<widget-name>/
  index.html       ← entry point, standalone runnable
  <name>.css       ← widget-scoped styles only
  <name>.js        ← widget logic (IIFE, vanilla JS)
  README.md        ← purpose, files, how to run
```

Example for a new widget `radar-sweep`:

```
panels/radar-sweep/
  index.html
  radar-sweep.css
  radar-sweep.js
  README.md
```

---

## index.html template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Widget Name — NebulaCast HUD</title>

  <!-- Shared layer — always in this order -->
  <link rel="stylesheet" href="../../shared/css/reset.css">
  <link rel="stylesheet" href="../../shared/css/tokens.css">
  <link rel="stylesheet" href="../../shared/css/base.css">
  <link rel="stylesheet" href="../../shared/css/animations.css">
  <link rel="stylesheet" href="../../shared/css/typography.css">
  <link rel="stylesheet" href="../../shared/css/layout.css">
  <link rel="stylesheet" href="../../shared/css/effects.css">

  <!-- Widget styles -->
  <link rel="stylesheet" href="./<name>.css">
</head>
<body>

  <main class="nc-widget-stage">
    <div class="nc-<name> nc-widget-shell nc-border-glow" id="widgetRoot">

      <div class="nc-panel__header">
        <!-- header content -->
      </div>

      <div class="nc-panel__body">
        <!-- widget content -->
      </div>

    </div>
  </main>

  <!-- Shared scripts -->
  <script src="../../shared/js/hud-core.js"></script>
  <script src="./<name>.js"></script>

</body>
</html>
```

---

## CSS rules

```css
/* <name>.css — namespace: .nc-<name> */

/* Root element */
.nc-<name> {
  /* widget-specific dimensions and layout only */
  /* use tokens for all values */
}

/* Sub-elements: BEM */
.nc-<name>__header { }
.nc-<name>__body   { }
.nc-<name>__footer { }

/* Modifiers */
.nc-<name>--active  { }
.nc-<name>--warning { }
```

Rules:
- No global element selectors.
- All values from `tokens.css` variables.
- No hardcoded colours, spacing, or radii.
- No `!important`.

---

## JS rules

```js
/* <name>.js */
'use strict';

(function () {
  const { qs, qsa, clamp, zeroPad } = HUDCore;

  // widget logic here

})();
```

Rules:
- Wrapped in IIFE — no global scope pollution.
- Access `HUDCore` / `HUDLoader` as globals (loaded before widget script).
- No `import` / `export` / `require`.
- No frameworks, no npm packages.
- No `document.write`.
- No external network requests.

---

## Shared imports

Load shared CSS in this exact order, before widget CSS:

1. `reset.css`
2. `tokens.css`
3. `base.css`
4. `animations.css`
5. `typography.css`
6. `layout.css`
7. `effects.css`

Load shared JS before widget JS:

1. `hud-core.js`
2. `hud-loader.js` *(only if the widget uses the registry)*

---

## Relative paths only

All `href` and `src` values must be relative. Never use absolute paths or protocol-relative URLs.

```html
<!-- correct -->
<link rel="stylesheet" href="../../shared/css/tokens.css">

<!-- forbidden -->
<link rel="stylesheet" href="/shared/css/tokens.css">
<link rel="stylesheet" href="https://...">
```

---

## Standalone testing

Every widget must open and render correctly at:

```
http://localhost:8080/panels/<name>/index.html
```

with no dependency on the playground or any other widget being loaded.

---

## README.md template

```markdown
# Widget Name

One-sentence description of what this widget displays or does.

## Purpose
Expanded description — what data it shows, what interaction it supports.

## Files
| File | Role |
|---|---|
| `index.html` | Widget entry point |
| `<name>.css` | Widget-scoped styles (`.nc-<name>` namespace) |
| `<name>.js` | Widget logic stub |

## Shared layer
Loads from `../../shared/css/`: reset · tokens · base · animations · typography · layout · effects

## Running locally
\`\`\`bash
python3 -m http.server 8080 --directory /path/to/widgets
# http://localhost:8080/panels/<name>/
\`\`\`

## CSS namespace
All classes use the `.nc-<name>` prefix.
```
