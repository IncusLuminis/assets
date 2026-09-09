# NebulaCast HUD Widgets

Sci-fi HUD interface components for [nebulacast.com](https://nebulacast.com).  
Pure HTML / CSS / vanilla JS — no build tools, no frameworks.

---

## Running locally

```bash
# From HUD/ root
make server

# Or directly
python3 -m http.server 8080 --directory widgets/

# Then open
http://localhost:8080/
```

---

## Structure

```
widgets/
  index.html              ← gallery — links to all widgets
  Makefile

  shared/                 ← shared infrastructure layer
    css/
      reset.css           — browser normalisation
      tokens.css          — CSS custom properties (design tokens)
      base.css            — dark HUD theme, body, utility classes
      animations.css      — keyframes + animation utility classes
      typography.css      — heading/text scale
      layout.css          — grid, flex, stage, overlay helpers
      effects.css         — glow, glass, scanlines, noise, shadows
    js/
      hud-core.js         — DOM helpers, EventBus, boot utilities
      hud-loader.js       — widget registry + iframe mount
    assets/
      noise/              — noise texture assets
      grid/               — grid texture assets
      textures/           — general textures
      masks/              — alpha masks
      icons/              — UI icons
      fonts/              — web fonts
    templates/
      panel-shell.html    — copy-paste starting point for panel widgets
      hud-frame.html      — fullscreen HUD frame starting point

  panels/                 ← individual widget components
    asymmetric-panel/
    targeting-reticle/
    status-card/

  playground/             ← all widgets side-by-side in iframes
  docs/                   ← architecture and authoring docs
```

---

## Shared layer architecture

All widgets share a common CSS/JS foundation loaded from `shared/`. The load order is fixed:

```
reset → tokens → base → animations → typography → layout → effects → [widget.css]
```

**Shared CSS** provides:
- Design tokens (colours, spacing, radii, transitions, z-index)
- Dark HUD theme base
- Reusable utility and layout classes (`.nc-*` namespace)
- Keyframe animations and effect classes
- Typography scale

**Shared JS** provides:
- `HUDCore` — DOM helpers, clamp, zeroPad, EventBus, boot flicker
- `HUDLoader` — widget registry, iframe mount/unmount

No widget should redefine anything already covered by the shared layer.  
See [`docs/styling-rules.md`](docs/styling-rules.md) for the full CSS policy.

---

## Widgets vs Gadgets

| | Widgets (`widgets/`) | Gadgets (`gadgets/`) |
|---|---|---|
| Purpose | Standalone HUD UI components | *(TBD — separate system)* |
| Embedding | iframe or direct | TBD |
| Styling | Shared HUD layer | TBD |

---

## Adding a new widget

1. Copy `shared/templates/panel-shell.html` into `panels/<name>/index.html`.
2. Create `panels/<name>/<name>.css` and `panels/<name>/<name>.js`.
3. Create `panels/<name>/README.md`.
4. Follow the rules in [`docs/component-template.md`](docs/component-template.md).
5. Register the widget in `playground/playground.js`.
6. Add a card to `widgets/index.html`.

---

## Blogger embedding (future)

Once hosted on Cloudflare Pages, widgets embed into Blogger posts via `<iframe>`:

```html
<iframe
  src="https://hud.nebulacast.com/panels/status-card/index.html"
  width="320" height="240"
  style="border:none; background:#020d14;"
  loading="lazy">
</iframe>
```

See [`docs/embed-blogger.md`](docs/embed-blogger.md) for the full deployment checklist.

---

## Cloudflare / static hosting compatibility

- Zero build step — Cloudflare Pages serves `widgets/` as-is.
- No server-side logic, no API calls from widget JS.
- All asset paths are relative — works on any static host.
- `_headers` file (to be added) will configure `X-Frame-Options` for iframe embedding.

---

## Docs

| File | Contents |
|---|---|
| [`docs/styling-rules.md`](docs/styling-rules.md) | CSS namespace, token policy, z-index, overlay architecture |
| [`docs/component-template.md`](docs/component-template.md) | Canonical widget structure and authoring rules |
| [`docs/widget-contract.md`](docs/widget-contract.md) | Technical compatibility contract |
| [`docs/embed-blogger.md`](docs/embed-blogger.md) | Blogger embed + Cloudflare deploy guide |
