# NebulaCast HUD-01 / HUD-02 — Object Mode Release

Blogger-ready release of HUD-01 and HUD-02 with full **Object Mode** support
(Aladin Lite sky viewer + SIMBAD + ADS Papers + VizieR Catalogs).

This release extends the Blogger Pilot (HUD-01/02) with the `objectMode:true` init option.
All previous modes (HTML, image, video) remain fully supported.

---

## What's included

```
blogger-hud01-template.css   — HUD-01 styles (HTML mode + object mode)
blogger-hud01-template.js    — HUD-01 controller (NcHud01 factory)
blogger-hud02-template.css   — HUD-02 styles (HTML mode + object mode)
blogger-hud02-template.js    — HUD-02 controller (NcHud02 factory)

examples/
  hud01-image.html           — HUD-01: static image
  hud01-heygen.html          — HUD-01: HeyGen vertical video
  hud01-youtube.html         — HUD-01: YouTube horizontal video
  hud01-object.html          ★ HUD-01: Object mode (Aladin + SIMBAD)
  hud02-image.html           — HUD-02: static image
  hud02-heygen.html          — HUD-02: HeyGen vertical video
  hud02-youtube.html         — HUD-02: YouTube horizontal video
  hud02-object.html          ★ HUD-02: Object mode (Aladin + SIMBAD)
  row-hud01.html             — Multi-panel row (HUD-01)
  row-hud02.html             — Multi-panel row (HUD-02)
  row-mixed.html             — Mixed row (HUD-01 + HUD-02)
  reference-buttons-labels.html

optional/
  blogger-template-snippet.txt       — Full snippet: HUD-01 + HUD-02 CSS + all JS
  blogger-template-snippet-lite.txt  — Lite snippet: HUD-01 only
  hud01-frame-adapt.js               — Frame geometry adapter (optional)
  hud02-frame-adapt.js               — Frame geometry adapter (optional)
```

---

## Quick start

### Step 1 — Install global CSS and JS (once per blog)

Copy the contents of `optional/blogger-template-snippet.txt` and paste it
into your Blogger theme HTML just before the closing `</head>` tag:

```
Blogger → Theme → Edit HTML → find </head> → paste above it → Save
```

If you use only HUD-01, use `blogger-template-snippet-lite.txt` instead.

---

### Step 2 — Paste a panel into a post

Open any file from `examples/` and copy the full HTML block.
Paste it into a Blogger post in **HTML mode** (not Compose).

---

## Object Mode

Object mode turns a HUD panel into an interactive astronomical object card.

### What it shows

| Area | Content |
|------|---------|
| Left column | Reference photo + Aladin Lite sky viewer + targeting reticle |
| Right column | Object title + switchable info tabs |
| Toolbar | Reticle toggle + DATA / PAPERS / CATALOGS tab switches |

**DATA tab** — SIMBAD structured data (type, coordinates, redshift, size, morphology)  
**PAPERS tab** — ADS recent publications linked to the object  
**CATALOGS tab** — VizieR catalog sources linked to the object

### How to activate

Use `hud01-object.html` or `hud02-object.html` from `examples/` as your template.

The key attributes on the panel root:

```html
<div class="nc-hud-01 nc-ol-widget"
     data-mode="object"
     data-target-lock="on"
     data-reticle="on"
     data-aladdin="on"
     data-info-mode="data">
```

And the init script:

```html
<script>
(function () {
  var all    = document.querySelectorAll('.nc-hud-01:not([data-hud-init])');
  var widget = all[all.length - 1];
  if (!widget) return;
  widget.setAttribute('data-hud-init', '1');
  NcHud01.init(widget, {
    objectMode : true,
    target     : 'NGC 1300',   // ← replace with your object
    vizierLimit: 10            // max catalog/paper rows (1–20)
  });
})();
</script>
```

For HUD-02, replace `nc-hud-01`, `nc-ol-widget`, `NcHud01` with `nc-hud-02`, `nc-or-widget`, `NcHud02`.

---

### How to set the target object

Change the `target` parameter in the init script to any identifier SIMBAD recognises:

```js
target: 'NGC 1300'      // NGC catalog
target: 'M31'           // Messier
target: 'Andromeda'     // common name
target: 'Alpha Ori'     // star
target: 'Crab Nebula'   // common name
```

Also replace the reference photo `src` with a Blogger-hosted image of your object.

---

### Tab overview

| Button | Tab | Data source |
|--------|-----|-------------|
| `≡ DATA` | Structured object data | SIMBAD TAP (live) |
| `◎ PAPERS` | Recent publications | ADS API (live) |
| `▦ CATALOGS` | Catalog references | VizieR TAP (live) |

Tabs load on demand — PAPERS and CATALOGS only fetch when first opened.

---

### Reticle toggle

The `⊕ RETICLE` button shows/hides the targeting overlay (rings, crosshair, lock box).

Default state is controlled by `data-reticle="on"` on the panel root.

---

### External services used (object mode only)

| Service | URL | Key required |
|---------|-----|--------------|
| Aladin Lite (CDN) | aladin.cds.unistra.fr | No |
| SIMBAD TAP | simbad.cds.unistra.fr | No |
| ADS search | ui.adsabs.harvard.edu | No |
| VizieR TAP | vizier.cds.unistra.fr | No |

All services are public astronomical databases. No API keys required.

Aladin Lite CDN script is injected **only when object mode is active** — HTML mode posts
do not load it.

---

### Blogger-specific notes

- The Aladin CDN script is loaded once per page, shared between all object mode panels.
- If the CDN fails, the placeholder `ALADIN LAYER STANDBY` remains visible.
- If SIMBAD is unavailable, a cached fallback (NGC 1300 data) is shown.
- All Blogger iframe sandbox restrictions apply to Aladin viewer.
- Object mode degrades gracefully: the reference photo and title are always visible.

---

## HTML mode (unchanged from previous release)

All image, HeyGen, and YouTube examples work exactly as before.
Use `objectMode: false` (or omit `objectMode`) in the init script to stay in HTML mode.

---

## Architecture notes

- Static HTML — no React, Vue, npm, or webpack
- Copy-paste deployable — one snippet in `</head>`, one HTML block per post
- All classes namespaced `nc-*` — no Blogger theme collisions
- Auto-height panel — adapts to content length
- Expand/collapse via `NcHudMini` — mini thumbnail on click
