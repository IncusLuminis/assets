# hud-02 -- "Object Report"

`engine: "svg"`. Astronomical object-report HUD: distinct polygon frame +
separate contour-runner overlay SVG, Aladin Lite sky viewer + SIMBAD/VizieR/
ADS data panels (object mode), or a plain HTML content frame (html mode) --
Contract 1.0, Story #12 (Epic #21, critical path `#9 -> #12 -> #14`).

**Source lineage (following owner decision A, 2026-09-09 -- the same
lineage choice hud-01's package (#11) documents):**
`widgets/sandbox/blogger-hud01-02-wip/` (`blogger-hud02-template.css`,
`blogger-hud02-template.js`, `blogger-hud-shared.css`,
`examples/hud02-object.html`, `examples/hud02-image.html`) -- cross-checked
against `widgets/sandbox/blogger-hud01-02-dev/`,
`widgets/releases/blogger-pilot-hud01-02/`, and
`widgets/releases/blogger-hud01-02-object/` (the `examples/` and
`optional/` subdirectories of all four were read in full, not just their
top-level file names, per the Story #13/HUD-04 lineage-verification
lesson). Findings from that comparison:

- `blogger-hud01-02-wip`'s `blogger-hud02-template.js`/`.css` are
  byte-identical to `blogger-hud01-02-object`'s copies (both "Version 1.1,
  2026-06-09").
- `blogger-hud01-02-dev` and `blogger-pilot-hud01-02` carry an **older**
  "Version 1.0, 2026-05-25" of the JS with real behavioural bugs the `-wip`/
  `-object` copies later fixed: no `is-mini`-start guard on the
  `ncOrOpenHud` `animationend` handler (so `panel.style.width` gets cleared
  prematurely for a mini-started instance) and no "object mode object
  starting in mini" Aladin-hide fix. `STABLE_VERSION.md` in
  `blogger-hud01-02-wip/` confirms it is "Stable production version 2,
  confirmed 2026-08-06" -- the same reasoning hud-01's README used to prefer
  this directory. **This package migrates from the `-wip`/`-object`
  (fixed) version, not the older `-dev`/`pilot` one.**
- **Not** `widgets/panels/hud-02/` (the older, unchosen panel lineage --
  same "not this one" call hud-01's README made for `widgets/panels/hud-01/`).

## A correction to this Story's own framing (flagged per the assignment's
## instruction to "match it or correct it with evidence")

This Story's brief (and the Inventory's stale §1.9 audit note for HUD-01,
which compares the **old `widgets/panels/hud-01/`** lineage against the old
`widgets/panels/hud-02/` lineage) frames HUD-02 as having "a real
`NcHudMini` toggle already present -- unlike HUD-01, which had none". That
is true of the **panels/** lineage (`widgets/panels/hud-01/hud-01.js`
reimplements a bespoke inline toggle, Inv §1.9's "AUDIT STALE" note), but
it is **not** true of the **blogger lineage this package (and hud-01's
package) actually migrates from**: reading `blogger-hud01-template.js`
alongside `blogger-hud02-template.js` shows **both** call the exact same
shared module with the exact same numbers --
`NcHudMini.init({ scale: 0.352, miniH: 148, ... })` -- and hud-01's own
merged package (#11) already treats its `mini`/`micro` as a faithfully-
reproduced static crop of that same shared toggle (Contract §7.3 option a).
There is no hud-02-specific toggle mechanism to "migrate faithfully" that
differs from hud-01's: the real difference between the two Themes is
entirely in the **frame/runner SVG structure** (§25.2's actual basis, Inv
§1.14) and the **DATA panel's 4-column grid** (Inv, `hud-02.css` `.nc-or-
grid`), not in the mini/micro mechanism. This package's `mini`/`micro`
compositions are therefore built the same way hud-01's are -- a static
authored reproduction of the real `scale(0.352)` crop and the real
87x130 unscaled micro slot -- adapted only for hud-02's own frame paths and
class namespace (`nc-or-*`).

## Package layout

```
manifest.json
styles/shared.css          shared keyframes + PAPERS-row styles (bundled, no injected base in 0.1 -- see below)
scripts/hud-02.js          maxi:landscape's entry script (object mode + html mode)
maxi/landscape/{hud.html,hud.css}   REQUIRED -- full presentation
mini/landscape/{hud.html,hud.css}   REQUIRED -- scaled miniature (§7.3 option a)
micro/portrait/{hud.html,hud.css}   REQUIRED -- authored miniature (§7.3 option b)
```

`maxi:portrait`, `mini:portrait`, `micro:landscape` are `supported: false`
(the real baseline never authored them; `maxi:portrait` carries the
Contract-required `no-maxi-portrait` deviation, §8.3).

## Compositions vs. the real baseline

| Variant:orientation | Real baseline mechanism | This package |
|---|---|---|
| `maxi:landscape` | Full `.nc-or-panel`, object/html mode, toolbar, Aladin, SIMBAD/VizieR. Frame `<svg class="nc-or-frame-svg">` at **z-index:1** (behind the columns); a **separate** `<svg class="nc-or-runner-svg">` overlay at **z-index:40** carries the 4-layer glow runner (Inv §1.14 -- unlike hud-01, where frame+runner share one `<svg>` at z-index:30). 8-segment skewed loader bar (`ncOrLoader1-8`, distinct from hud-01's single-fill `hudProgressScan` bar). 4-column DATA grid (`label/value x2`, vs. hud-01's 2-column). | Migrated closely -- same two-SVG frame+runner structure and z-index relationship (1 / 40), same 8-segment loader keyframes, same 4-column grid, same toolbar/tab logic, same SIMBAD ADQL query (§ below on scope). |
| `mini:landscape` | `NcHudMini.init({ scale: 0.352, miniH: 148 })` -- a live `transform:scale()` crop of the SAME mounted maxi DOM, toggled by a click -- **identical shared-module call to hud-01's own**, see the correction note above. | A **separate, static composition** (Contract package model: each `<variant>:<orientation>` is its own mount point, not a live toggle within one instance -- Contract §7.5). Reproduces the crop geometry (901x420 scaled 0.352 → 317x148) as authored CSS, with the image/title positioned to match the real maxi layout's 30%/70% grid at that natural width (NOT copied from hud-01's differently-proportioned fixed 520px left column). No toolbar, no Aladin, no live data fetch -- title/status are set via the Runtime's own setData-replay-on-setVariant (Contract §6.5), not by this composition's own script (it declares no `scripts` entrypoint). |
| `micro:portrait` | `NcHudMini.init({ scale: null, panelW: 87, panelH: 130 })` via `widget[data-collapse="micro"]` -- a genuinely distinct, non-scaled portrait layout (label above + image fills the slot). HUD-02's own release `index.html` never sets `data-collapse="micro"` (so this path is dead in the release itself), but it is live in the shared `hud-mini.js` module and the Playground/blogger lineage (`examples/hud02-image.html`'s "VARIANT 2 — MICRO" block demonstrates it, same 87x130 defaults). | Faithfully authored as a separate static composition: same 87x130 default geometry (`.nc-micro-s` size class in the real CSS), same "label above, image below" arrangement -- identical numbers to hud-01's micro. The frame `<svg>` is reused with `preserveAspectRatio="none"` (Contract §8.1) rather than re-drawn; the separate contour-runner overlay is omitted at this density (illegible detail dropped, not shipped-but-invisible -- the same call hud-01's package made for its own glow runner at micro). |

## Behavioural differences from the real baseline

- **No live mini/micro toggle inside one instance.** Same architectural
  gap as hud-01's package documents: the Contract's mount-a-composition-
  directly model (§7.5, §6.5) has no equivalent to `NcHudMini`'s
  click-to-collapse/expand interaction within a single page instance --
  `Hud.setVariant()` tears down and remounts a whole new composition
  instead.
- **The inert `.nc-or-sweep` div is omitted.** The real `hud02-object.html`
  markup includes `<div class="nc-or-sweep nc-panel-sweep"></div>`, but the
  real `hud-02.css`/`blogger-hud02-template.css` immediately hides it with
  `.nc-hud-02 .nc-or-sweep { display: none; }` -- HUD-02 replaced the
  hud-01-style single sweep bar with the separate runner-overlay SVG
  entirely and left the old markup hook in place, unused. This package
  omits the dead element rather than shipping a no-op.
- **Aladin's own dark-theme UI-control overrides are omitted** (the
  `.nc-hud-02-aladdin .aladin-location`/`.aladin-logo` CSS block that
  restyles Aladin's built-in search box and logo). This package's Aladin
  instance already disables those controls at the API level
  (`showZoomControl: false`, `showGotoControl: false`, etc. -- identical
  options object to hud-01's), so the controls those overrides would style
  never render in the first place.
- **No `--nc-image-*` float/position variable system, no Blogger
  `.separator` overrides, no YouTube/HeyGen/TikTok facades.** Same call
  hud-01's package made for the same reason: hud-02 does not declare
  `capabilities.mediaEmbed` (that's HUD-04's territory), so this package
  ships a plain `media`/`content` slot presentation instead of porting
  that machinery.
- **VizieR CATALOGS parsing is simplified** the same way hud-01's is: the
  real VOTable `RESOURCE` parse is ported, but this package's version reads
  only the resource `name` (catalog id), not the nested `INFO
  name="Description"` element. The real fetch URL, real fallback data
  (`VIZIER_NGC1300_FALLBACK`), and the "offline / demo data" notice are all
  preserved -- and are literally the same fallback data hud-01 uses, since
  both real scripts hardcode the identical NGC 1300 demo rows.
- **PAPERS tab ports `widgets/shared/js/hud_papers.js`'s logic inline**
  rather than depending on that shared module, for the same reason and in
  the same shape as hud-01's package: the actual network call is a
  **second SIMBAD TAP query** (`ref` JOIN `has_ref` JOIN `ident`) --
  **not** a real fetch to `ui.adsabs.harvard.edu`. ADS is used only as each
  row's link `href` target, matching Contract §10.3's table exactly.
- **New: real teardown.** Same as hud-01: the inventory found "no teardown
  exists anywhere in the baseline" (Inv §6.5, H10). Contract 1.0 requires
  it (§17.1). `scripts/hud-02.js` returns a `destroy()` handle that removes
  every listener it added, clears timers, and aborts in-flight `fetch()`
  calls -- new correctness added on top of the migrated behaviour, not a
  port of anything that existed before.
- **No injected platform "base" (Contract §11.2) exists in this 0.1
  Runtime yet.** `styles/shared.css` bundles the shared keyframes/paper-row
  styles this package needs, the same self-contained approach hud-01's
  package and `library/themes/fixture-svg-hud` already use.
- **`hudSpinner02` is a deliberately distinct local keyframe name** from
  hud-01's local `hudSpinner` -- this matches the real baseline's own
  choice (the real `hud-02.css` also names it `hudSpinner02`, not
  `hudSpinner`), made for the same §15.6 reason: two Theme bundles on one
  page must not silently collide on an unscoped `@keyframes` name.

## How `mode` / `objectName` reach the script (same flagged gap as hud-01)

Identical situation to hud-01's package (#11) -- see that package's README
for the full explanation; this section restates it rather than re-litigating
it, per this Story's instruction. Contract §11.1 describes
`capabilities.modes.config` as naming "the construction option
(`new Hud({ config: { mode: "html" } })`, §14.2)". Reading
`src/runtime/core/Hud.ts` (unchanged, out of this Story's scope):
`HudOptions.config` is accepted and validated by the constructor but is
**never forwarded into `MountContext`** -- `RendererInterface.ts`'s
`MountContext` has no `config` field, so no Theme script in this 0.1
Runtime can read a construction-time `config` at all today.

This package declares `mode` as a **custom slot** (`kind: "config"`,
Contract §9.4/§27.3) alongside `objectName`, set the same way any slot is:
`hud.setData({ mode: "html", objectName: "M31" })`. `scripts/hud-02.js`'s
own `setData` handle reads them directly; two hidden
`[data-slot="objectName"|"mode"]` elements exist purely so
`SvgRenderer.setData()`'s slot-mapping loop does not log an "unknown slot"
warning for them -- they carry no visual presentation.

Every mount still defaults to `capabilities.modes.default: "object"` with
`objectName` defaulting to `"NGC 1300"` before any `setData` call is
delivered, for the same reason and with the same timing hud-01's package
documents. **Flagged for the same human/owner call** hud-01's README flags,
if the `MountContext` gap is worth closing before Story #14 wires the
Playground.

**Story #36 correction:** same correction as hud-01's README -- the `mode`
customSlot's manifest description ("html" mode is "plain content slot, no
network") was not accurate for a consumer intending `html` mode from the
very first mount (`hud.setData({ mode: "html" })` queued before `mount()`
resolves, Contract §6.3); that consumer still pays for the same
object-mode SIMBAD fetch + Aladin CDN load described above, for the same
`MountContext` gap reason. `manifest.json`'s `knownDeviations` now carries
an honest `external-io-on-mount` entry scoped `html-mode-initial-mount`
documenting this, instead of leaving the customSlot description as an
unqualified "no network" claim for that case.

## `dataSource` / `skyViewer` lazy loading (no real network in tests)

Every external call is gated through `SvgRenderer`'s
`hud.loadExternalResource(name)` extension point (Story #9) before this
Theme performs its own real request -- identical wiring to hud-01's
package:

- `hud.loadExternalResource("skyViewer")` -- gates the Aladin Lite
  script/style injection. On resolution, the script checks
  `window.A`/`A.init` exactly as the real baseline does; if absent (true in
  every test in this repo) it leaves the "ALADIN LAYER STANDBY" placeholder
  visible -- the real baseline's own documented degrade-gracefully
  behaviour, not a test-only stub.
- `hud.loadExternalResource("simbad")` -- gates the DATA-tab and PAPERS-tab
  SIMBAD TAP queries (real ADQL, real URL -- confirmed identical
  `SIMBAD_TAP_URL` to hud-01's real script).
- `hud.loadExternalResource("vizier")` -- gates the CATALOGS-tab VizieR
  VOTable fetch (real URL -- confirmed identical `VIZIER_URL` to hud-01's).

`hud.loadExternalResource()` validates the requested name against this
Theme's own declared `capabilities` (`SvgRenderer#requestExternalResource`)
and resolves/rejects via an injectable `ExternalResourceLoader` -- tests
supply a fake one (matching `tests/unit/svg-fixture-e2e.test.js`'s
pattern), so the *gate* never touches the network. The subsequent real
`fetch()` calls this script makes to `simbad.cds.unistra.fr` /
`vizier.cds.unistra.fr` are this Theme's own direct calls, matching the
real baseline and Contract §16.3 (`external-io-on-mount` deviation, exactly
as declared here). This repo's tests stub `globalThis.fetch` for these (see
`tests/unit/hud-02-theme.test.js`) so no test in this package makes a real
network call either.

## Single-instance / multi-instance

`capabilities.multiInstance: true` -- every DOM query in
`scripts/hud-02.js` is scoped to its own `root` (no page-global panel
state), and the Aladin CDN script injection is de-duplicated per-page by
`SvgRenderer`'s own `DomExternalResourceLoader` (`kind:host` keyed) --
identical mechanism to hud-01's, which is how the real baseline's own
cooperative `_ncAladinLoader` (shared by `NcHud01`/`NcHud02` on the same
page) is reproduced without page-global script state. Per-instance Aladin
viewer ids are randomly generated (`nc-hud02-aladin-<random>`) rather than
an incrementing counter, since this script has no cross-instance module
state to count from (Contract §16.5).

## `media` slot: a plain photo URL, or a YouTube/HeyGen embed (Story #43)

`data-slot="media"` is (and stays) the `<img>` showing the locked object's
photo -- `setData({ media: "<photo-url>" })` sets its `src` directly, same
as always. As of Story #43 this Theme also declares
`capabilities.mediaEmbed: { hosts: ["app.heygen.com", "www.youtube.com"],
lifecycle: "src-swap" }`, so the *same* `media` value can instead be a
YouTube/HeyGen embed URL -- which one happens depends only on the value
passed to `setData()`, not on any separate mode/config slot:

- If the value is an absolute URL whose host is in
  `capabilities.mediaEmbed.hosts` (and the Contract §16.2 fixed allowlist),
  `SvgRenderer` mounts an iframe next to the `<img>`, hides the `<img>`
  (`display:none` + a `data-hud-media-embed-active` marker), and applies
  the `src-swap` lifecycle (parked at `about:blank` except at `maxi`,
  restored on `setVariant("maxi")`).
- Any other value -- a plain photo URL, a relative path, anything not on
  the allowlist -- falls straight through to the existing `<img>.src`
  behavior, exactly as if `mediaEmbed` were not declared at all.
- Switching back and forth between the two (repeated `setData({ media })`
  calls) correctly un-hides the `<img>`/removes the iframe each way -- no
  leftover DOM from a prior value.

This dispatch logic is shared with `hud-04` (which only ever sends an
embed URL through this same path) and with `hud-01` (this Theme's
sibling, same mechanism) via `src/runtime/renderers/mediaEmbed.ts` -- see
that module's docstring for why the check is per-*value*, not
per-manifest, which is specifically what lets this Theme's `media` slot do
double duty without breaking its original plain-photo behavior. See
`tests/unit/hud-02-e2e.test.js`'s "Story #43" describe block for the full
behavioral test coverage (embed mount, plain-photo regression, switching
both ways, `setVariant` src-swap lifecycle).

**Not in scope for Story #43** (see `IncusLuminis/assets#43`'s issue
comments): TikTok (not in the Contract's fixed host allowlist -- would need
a Contract 1.0 amendment, an owner-level decision, not a Theme change), and
no new "youtube-shorts" mode/composition (a portrait video embed would just
be this same `mediaEmbed` mechanism paired with a portrait composition,
which this Theme doesn't currently have and this Story didn't add).

## Tests

- `tests/unit/hud-02-theme.test.js` -- manifest schema + semantic
  validation, entrypoint/composition file-existence checks (mirrors
  `tests/unit/hud-01-theme.test.js`'s pattern).
- `tests/unit/hud-02-e2e.test.js` -- mounts the real package through the
  real `Hud` + `SvgRenderer` (jsdom), across all three variants, proves the
  lazy `skyViewer`/`simbad`/`vizier` hooks fire with the correct
  capability-validated host/kind via a fake `ExternalResourceLoader`, and
  proves `mount -> setData -> setVariant -> destroy` leaves no DOM/listener
  residue -- no real network call is made (`globalThis.fetch` is stubbed).
