HUD01/HUD02 — Object Mode Release
Release Specification for Claude

Goal:
Add object mode (Aladin sky viewer + SIMBAD/ADS/VizieR data tabs) to the existing
Blogger release of HUD01 and HUD02.

This is a targeted extension of the Blogger Pilot release.
All architectural constraints from that release remain in force.

⸻

1. Scope

Only change:
Add object mode support to HUD01 and HUD02 Blogger release files.

Do NOT change:
* Frame geometry
* Animation system
* HTML mode behavior
* Existing examples (image, HeyGen, YouTube)
* Release folder structure
* README (add a new section rather than rewriting)

⸻

2. What Is Object Mode

Object mode transforms a HUD panel into an interactive astronomical object card.

It replaces the standard HTML content slot with:

Left column:
* Static reference photo (Blogger-hosted image)
* Aladin Lite sky viewer (loaded on demand)
* Targeting reticle overlay (optional, controlled by toolbar)

Right column:
* Object title (e.g. "NGC 1300")
* Info panel with three switchable tabs:
    * DATA    — SIMBAD structured data (type, coordinates, distance, magnitude…)
    * PAPERS  — ADS recent publications
    * CATALOGS — VizieR catalog sources

Toolbar (bottom of panel):
* ⊕ RETICLE toggle
* ≡ DATA / ◎ PAPERS / ▦ CATALOGS tab switches

The JS controller (NcHud01 / NcHud02) handles:
* Aladin Lite initialization (CDN, lazy)
* SIMBAD TAP query
* ADS search query
* VizieR catalog query
* Tab switching
* Reticle toggle

⸻

3. Activation

Object mode is activated via data attributes on the panel root:

    data-mode="object"
    data-target-lock="on"
    data-reticle="on"
    data-aladdin="on"
    data-info-mode="data"

And initialized via JS:

    NcHud01.init(widget, {
      objectMode : true,
      target     : 'NGC 1300',
      vizierLimit: 10
    });

HTML mode (existing behavior) remains default when data-mode is absent or "html".

⸻

4. External Dependencies (Object Mode Only)

Aladin Lite is loaded via CDN — only when object mode is active:

    https://aladin.u-strasbg.fr/AladinLite/api/v3/latest/aladin.js

APIs called at runtime (no keys required):
* SIMBAD TAP    — http://simbad.u-strasbg.fr/simbad/sim-tap/sync
* ADS search    — https://ui.adsabs.harvard.edu/search/
* VizieR TAP    — https://tapvizier.cds.unistra.fr/TAPVizieR/tap/sync

These are astronomy public services. No API keys. No CDN fallback needed.

Blogger compatibility note:
CDN script is injected dynamically by the JS controller only when object mode
is detected — it does not affect HTML mode posts.

⸻

5. Release Deliverables

All files go into the existing release folder:

/releases/blogger-pilot-hud01-02/

A. CSS updates

blogger-hud01-template.css
blogger-hud02-template.css

Add object-mode styles:
* .nc-hud-01-aladdin / .nc-hud-02-aladdin  — viewer container
* .nc-ol-info-panel variants (--data, --papers, --catalog)
* .nc-ol-toolbar and .nc-ol-tb-btn
* .nc-ol-reticle and all ring/corner/cross sub-elements
* .nc-ol-data-status, .nc-ol-grid
* Active/inactive tab state transitions

All new classes must use existing nc-* namespace.
No changes to existing HTML-mode classes.

⸻

B. JS updates

blogger-hud01-template.js
blogger-hud02-template.js

Add object mode controller logic:
* objectMode detection from data-mode attribute
* Aladin Lite CDN loader (lazy, one-time)
* SIMBAD TAP fetch → populate DATA tab
* ADS fetch → populate PAPERS tab
* VizieR TAP fetch → populate CATALOGS tab
* Tab switching (data / papers / catalog)
* Reticle toggle
* NcHud01.init() / NcHud02.init() public API extended with objectMode option

Existing HTML mode init path must be preserved unchanged.

⸻

C. New example files

examples/hud01-object.html
examples/hud02-object.html

Each must demonstrate:
* Full object mode markup
* Aladin viewer slot
* Reticle overlay
* DATA / PAPERS / CATALOGS tab structure
* Toolbar with all three tab buttons and reticle toggle
* Inline init script with NcHud0X.init({ objectMode: true, target: '...' })
* Comments explaining how to replace the target identifier and photo

These files already exist as drafts — verify and finalize them.

⸻

D. README update

BLOGGER_PILOT_README.md

Add a new section:

    ## Object Mode (Aladin + SIMBAD)

    ### When to use
    ### Required HTML structure
    ### How to set the target object
    ### Tab overview (DATA / PAPERS / CATALOGS)
    ### Reticle toggle
    ### External services used
    ### Blogger-specific notes (CDN, iframe safety)

Do not rewrite existing sections.

⸻

6. HTML Structure Requirements

Object mode HTML must follow this structure exactly:

    <div class="nc-hud-01 nc-ol-widget"
         data-mode="object"
         data-target-lock="on"
         data-reticle="on"
         data-aladdin="on"
         data-info-mode="data">
      <div class="nc-ol-panel">

        <!-- SVG frame (unchanged from HTML mode) -->
        <svg class="nc-ol-frame-svg" ...>...</svg>

        <!-- Sweep + progress (unchanged) -->
        <div class="nc-ol-sweep nc-panel-sweep"></div>
        <div class="nc-ol-progress" ...>...</div>

        <!-- Left column: photo + Aladin viewer + reticle -->
        <div class="nc-ol-left">
          <img class="nc-ol-image" src="..." alt="..." />
          <div class="nc-hud-01-aladdin">
            <div></div><!-- Aladin viewer target — id assigned by JS -->
            <div class="nc-hud-01-aladdin__placeholder" aria-hidden="true">
              <span class="nc-hud-01-aladdin__label">ALADIN LAYER STANDBY</span>
              <span class="nc-hud-01-aladdin__sub">INTEGRATION PENDING</span>
            </div>
          </div>
          <div class="nc-ol-reticle">
            <!-- rings, cross, lock-box, corners, center-dot, target-lock label -->
          </div>
        </div>

        <!-- Right column: title + info tabs -->
        <div class="nc-ol-right">
          <h2 class="nc-ol-title">NGC 1300</h2>
          <div class="nc-ol-title-brackets"></div>

          <div class="nc-ol-info-panel nc-ol-info-panel--data nc-ol-grid"
               id="nc-hud01-data-panel">
            <div class="nc-ol-data-status"><span>QUERYING SIMBAD…</span></div>
          </div>

          <div class="nc-ol-info-panel nc-ol-info-panel--catalog">
            <span class="nc-ol-info-placeholder">VIZIER CATALOG MODULE STANDBY</span>
          </div>

          <div class="nc-ol-info-panel nc-ol-info-panel--papers">
            <span class="nc-ol-info-placeholder">ADS PAPERS MODULE STANDBY</span>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="nc-ol-toolbar" role="toolbar" aria-label="HUD-01 overlay controls">
          <div class="nc-ol-tb-group" role="group" aria-label="View overlays">
            <button class="nc-ol-tb-btn" type="button"
                    data-action="reticle" aria-pressed="true">⊕ RETICLE</button>
          </div>
          <div class="nc-ol-tb-sep" aria-hidden="true"></div>
          <div class="nc-ol-tb-group" role="group" aria-label="Object information">
            <button class="nc-ol-tb-btn" type="button"
                    data-action="data"    aria-pressed="true">≡ DATA</button>
            <button class="nc-ol-tb-btn" type="button"
                    data-action="papers"  aria-pressed="false">◎ PAPERS</button>
            <button class="nc-ol-tb-btn" type="button"
                    data-action="catalog" aria-pressed="false">▦ CATALOGS</button>
          </div>
        </div>

        <!-- HTML slot (unused in object mode) -->
        <div class="nc-hud-01-html-slot" aria-hidden="true"></div>

      </div>
    </div>

    <script>
    (function () {
      var all    = document.querySelectorAll('.nc-hud-01:not([data-hud-init])');
      var widget = all[all.length - 1];
      if (!widget) return;
      widget.setAttribute('data-hud-init', '1');
      NcHud01.init(widget, {
        objectMode : true,
        target     : 'NGC 1300',
        vizierLimit: 10
      });
    })();
    </script>

Replace nc-hud-01 / NcHud01 with nc-hud-02 / NcHud02 for HUD02.

⸻

7. Blogger Compatibility Requirements

Carry forward all constraints from the Blogger Pilot release:

* All classes namespaced nc-*
* No global selector pollution
* No npm / React / Vue / webpack
* Static HTML, copy-paste deployable
* Aladin CDN injected dynamically — does not load for HTML mode posts
* Toolbar buttons: CSS-only state management preferred; minimal vanilla JS allowed
* No heavy animation frameworks added for object mode
* Mobile: Aladin viewer hidden or collapsed on small screens if necessary

⸻

8. Responsive Behavior (Object Mode)

Desktop (≥ 900px):
* Left column: photo + Aladin viewer stacked
* Right column: title + active info tab
* Toolbar visible at bottom

Mobile (< 600px):
* Aladin viewer: hidden or replaced by placeholder
* Info tabs: stack or scroll
* Toolbar: compact

Panel height: auto, driven by tallest column (same rule as HTML mode).

⸻

9. Fallback Behavior

If Aladin CDN fails to load:
* Placeholder div remains visible (ALADIN LAYER STANDBY)
* SIMBAD/ADS/VizieR tabs show error state or remain in STANDBY

If SIMBAD query fails:
* DATA tab shows error message
* Other tabs unaffected

Content is readable without JS (object name, photo visible).

⸻

10. Release Checklist

[ ] blogger-hud01-template.css — object mode styles added
[ ] blogger-hud02-template.css — object mode styles added
[ ] blogger-hud01-template.js  — object mode controller added, HTML mode unchanged
[ ] blogger-hud02-template.js  — object mode controller added, HTML mode unchanged
[ ] examples/hud01-object.html — finalized and verified
[ ] examples/hud02-object.html — finalized and verified
[ ] BLOGGER_PILOT_README.md    — Object Mode section added
[ ] Blogger namespace audit (nc-* classes, no collisions)
[ ] Mobile layout verified
[ ] HTML mode regression: existing examples still render correctly

⸻

11. Out of Scope

* New panel geometry or frame redesign
* Changes to HUD03–HUD10
* Sandbox or staging files
* SVG path animation for object mode
* Observer Console integration
* New release folder structure
