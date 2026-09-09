# Styling Rules

Rules governing all CSS in the NebulaCast HUD widget system.

---

## Namespace policy

Every class must be prefixed with `.nc-`:

```css
/* correct */
.nc-panel { ... }
.nc-status-card__header { ... }

/* forbidden */
.panel { ... }
.header { ... }
```

Widget-specific classes additionally use the widget slug as a sub-namespace:

```
.nc-<widget-slug>          — root element
.nc-<widget-slug>__<part>  — BEM element
.nc-<widget-slug>--<mod>   — BEM modifier
```

---

## Global element styling

Only `html` and `body` may be styled globally, and only in `reset.css` or `base.css`. No other element selectors outside those two files.

```css
/* allowed in base.css */
body { background-color: var(--hud-bg); }

/* forbidden in widget css */
h1 { color: red; }
div { margin: 0; }
```

---

## CSS variable usage

All colours, spacing, radii, and transitions must reference tokens from `tokens.css`. Never hardcode values.

```css
/* correct */
color: var(--hud-text-accent);
padding: var(--hud-space-md);
border-radius: var(--hud-radius);

/* forbidden */
color: #00ffe7;
padding: 16px;
border-radius: 4px;
```

To extend: add new variables to `tokens.css`, never inline them.

---

## Shared vs local styles

| Layer | File | Use for |
|---|---|---|
| Shared | `reset.css` | Browser normalisation |
| Shared | `tokens.css` | All CSS custom properties |
| Shared | `base.css` | Dark theme, body, utility classes |
| Shared | `animations.css` | Keyframes, animation utility classes |
| Shared | `typography.css` | Heading/text scale classes |
| Shared | `layout.css` | Grid, flex, stage, overlay helpers |
| Shared | `effects.css` | Glow, glass, scanlines, noise, shadows |
| Local | `<widget>.css` | Widget-specific layout and components only |

A class that could be used by two or more widgets belongs in shared. A class used only once stays local.

---

## Animation reuse policy

Use keyframe utility classes from `animations.css` directly in HTML before writing a new animation:

```html
<div class="nc-anim-pulse">...</div>
<div class="nc-anim-rotate">...</div>
```

Only define a new `@keyframes` in a widget CSS file if the animation is truly unique to that widget and not a candidate for the shared layer.

---

## Effects policy

Prefer canonical short-hand classes from `effects.css` over writing equivalent styles locally:

```html
<!-- preferred -->
<div class="nc-widget-shell nc-border-glow nc-scanlines">

<!-- avoid when the shared class already exists -->
<div class="nc-my-widget" style="box-shadow: 0 0 8px ...">
```

Apply multiple effect classes together — they are composable and non-conflicting.

---

## Z-index layering

Use the z-index tokens from `tokens.css`. Never use raw integers.

| Token | Value | Layer |
|---|---|---|
| `--hud-z-base` | 1 | Default content |
| `--hud-z-panel` | 10 | Floating panels |
| `--hud-z-overlay` | 100 | Full-screen overlays, reticles |

```css
/* correct */
z-index: var(--hud-z-panel);

/* forbidden */
z-index: 9999;
```

---

## Overlay architecture

Overlays are absolutely or fixed positioned elements with `pointer-events: none` by default. Use `.nc-overlay-layer` from `layout.css` as the base class. Only add `pointer-events: auto` to interactive overlay children explicitly.

```html
<div class="nc-overlay-layer">
  <!-- decorative only — no pointer events -->
</div>
```

---

## Standalone widget requirement

Every widget must be fully renderable by opening `panels/<name>/index.html` directly via a static server with no build step. This means:

- All paths are relative (`../../shared/css/tokens.css`, not absolute).
- No imports, no bundler, no module syntax.
- No runtime dependency on any other widget.
- All shared CSS is linked explicitly in the widget's `<head>`.
