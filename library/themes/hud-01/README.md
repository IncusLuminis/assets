# hud-01 -- "Object Lock"

`engine: "svg"`. Astronomical object-lock HUD: Aladin Lite sky viewer +
SIMBAD/VizieR/ADS data panels (object mode), or a plain HTML content frame
(html mode) -- Contract 1.0, Story #11 (Epic #21, critical path `#9 -> #11
-> #14`).

**Source lineage (owner decision A, 2026-09-09):**
`widgets/sandbox/blogger-hud01-02-wip/` (`blogger-hud01-template.css`,
`blogger-hud01-template.js`, `blogger-hud-shared.css`,
`examples/hud01-object.html`, `examples/hud01-image.html`) -- cross-checked
against `widgets/releases/blogger-pilot-hud01-02/` and
`widgets/releases/blogger-hud01-02-object/` (release-packaged variants of
the same lineage; no material differences found for this Story's purposes).
**Not** `widgets/panels/hud-01/` (the older, unchosen panel lineage).

## Package layout

```
manifest.json
styles/shared.css          shared keyframes + PAPERS-row styles (bundled, no injected base in 0.1 -- see below)
scripts/hud-01.js          maxi:landscape's entry script (object mode + html mode)
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
| `maxi:landscape` | Full `.nc-ol-panel`, object/html mode, toolbar, Aladin, SIMBAD/VizieR | Migrated closely -- same SVG frame paths, same 4-layer contour-glow runner, same toolbar/tab logic, same SIMBAD ADQL query (§ below on scope). |
| `mini:landscape` | `NcHudMini.init({ scale: 0.352, miniH: 148 })` -- a live `transform:scale()` crop of the SAME mounted maxi DOM, toggled by a click | A **separate, static composition** (Contract package model: each `<variant>:<orientation>` is its own mount point, not a live toggle within one instance -- Contract §7.5 "the Runtime MUST mount the requested variant directly, with no flash"). Reproduces the crop geometry (901x420 scaled 0.352 → 317x148) as authored CSS. No toolbar, no Aladin, no live data fetch -- title/status are set via the Runtime's own setData-replay-on-setVariant (Contract §6.5), not by this composition's own script (it declares no `scripts` entrypoint). |
| `micro:portrait` | `NcHudMini.init({ scale: null, panelW: 87, panelH: 130 })` -- a genuinely distinct, non-scaled portrait layout (label above + image fills the slot) | Faithfully authored as a separate static composition: same 87x130 default geometry, same "label above, image below" arrangement. The frame `<svg>` is reused with `preserveAspectRatio="none"` (Contract §8.1) rather than re-drawn; the 4-layer glow runner is omitted at this density (see below). |

## Behavioural differences from the real baseline

- **No live mini/micro toggle inside one instance.** The real baseline's
  `NcHudMini` click-to-collapse/expand interaction is a single-page-instance
  UX pattern that has no equivalent in the Contract's mount-a-composition-
  directly model (§7.5, §6.5) -- `Hud.setVariant()` tears down and remounts
  a whole new composition instead. This is an architectural difference
  between the old panel runtime and the new one, not a content gap.
- **Contour-glow runner omitted at `micro` density.** `mini` keeps the full
  4-layer runner (`nc-ol-runner-tail/body/head/spark`); `micro` (87x130)
  keeps only the outer frame line -- illegible detail was dropped rather
  than shipped-but-invisible.
- **No `--nc-image-*` float/position variable system, no Blogger
  `.separator` overrides, no YouTube/HeyGen/TikTok facades.** The real
  `blogger-hud01-template.css` (2188 lines) spends most of its bulk on
  Blogger-specific media-embed edge cases. hud-01 does not declare
  `capabilities.mediaEmbed` (Contract §25.1's cross-check row -- that's
  HUD-04's territory), so this package ships a plain `media`/`content`
  slot presentation instead of porting that machinery.
- **VizieR CATALOGS parsing is simplified.** The real VOTable `RESOURCE`
  parse (`parseVizierVOTable`) is ported, but this package's version reads
  only the resource `name` (catalog id), not the nested `INFO
  name="Description"` element the real code also extracts. A catalog card
  here shows its id/title but not always a description. The real fetch
  URL, real fallback data (`VIZIER_NGC1300_FALLBACK`), and the "offline /
  demo data" notice are all preserved.
- **PAPERS tab ports `widgets/shared/js/hud_papers.js`'s logic inline**
  rather than depending on that shared module (it is not part of this
  package or this Story's scope). Confirmed while reading the source: the
  PAPERS tab's actual network call is a **second SIMBAD TAP query** (`ref`
  JOIN `has_ref` JOIN `ident`) -- **not** a real fetch to
  `ui.adsabs.harvard.edu`. ADS is used only as each row's link `href`
  target. This matches Contract §10.3's own table exactly: `ads | 
  ui.adsabs.harvard.edu | fetch + link target`. There is no hardcoded
  NGC 1300 papers fallback in the real module either (only "ARCHIVE
  UNAVAILABLE" / "NO PUBLICATIONS FOUND" states) -- reproduced as-is.
- **New: real teardown.** The inventory found "no teardown exists anywhere
  in the baseline" (Inv §6.5, H10). Contract 1.0 requires it (§17.1). This
  package's `scripts/hud-01.js` returns a `destroy()` handle that removes
  every listener it added, clears timers, and aborts in-flight
  `fetch()` calls -- this is new correctness added on top of the migrated
  behaviour, not a port of anything that existed before.
- **No injected platform "base" (Contract §11.2) exists in this 0.1
  Runtime yet** (#8/#9 do not implement base injection). `styles/shared.css`
  bundles the shared keyframes/paper-row styles this package needs, the
  same self-contained approach `library/themes/fixture-svg-hud` already
  uses (Contract §11.3 "SVG/CSS/JS/HTML Themes SHOULD carry all their text
  assets in-package").

## How `mode` / `objectName` reach the script (flagged for a human/owner call)

Contract §11.1 describes `capabilities.modes.config` as naming "the
construction option (`new Hud({ config: { mode: "html" } })`, §14.2)".
Reading `src/runtime/core/Hud.ts` (unchanged, out of this Story's scope):
`HudOptions.config` is accepted and validated by the constructor but is
**never forwarded into `MountContext`** -- `RendererInterface.ts`'s
`MountContext` has no `config` field, so no Theme script in this 0.1
Runtime can read a construction-time `config` at all today.

Given that gap, and per this Story's own latitude ("via a runtime check in
the Theme's own script... OR explicitly scope HTML-slot mode out of 0.1 if
that's cleaner -- your call, document which"): this package declares
`mode` as a **custom slot** (`kind: "config"`, Contract §9.4/§27.3 -- the
schema's `customSlotObject.kind` enum includes `"config"` for exactly this
case) alongside the existing `objectName` custom slot. Both are set the
same way any slot is: `hud.setData({ mode: "html", objectName: "M31" })`.
`scripts/hud-01.js`'s own `setData` handle (Contract §17.1's
`ThemeScriptHandle.setData`, merged by `SvgRenderer`) reads them directly;
two hidden `[data-slot="objectName"|"mode"]` elements exist purely so
`SvgRenderer.setData()`'s slot-mapping loop does not log an "unknown slot"
warning for them (Contract §6.3) -- they carry no visual presentation.

Every mount still defaults to `capabilities.modes.default: "object"` with
`objectName` defaulting to `"NGC 1300"` (matching the real baseline's own
`cfg.target || 'NGC 1300'` default) **before** any `setData` call is
delivered, because the Theme script's synchronous top-level init runs
during `SvgRenderer.mount()`, strictly before `Hud.mount()` replays any
`setData` calls queued by the consumer (Contract §6.3's replay-in-issue-
order happens in `Hud.mount()`'s own continuation, after
`renderer.mount()` has already resolved). A consumer that wants `html`
mode from the start currently gets `object` mode's default SIMBAD fetch
dispatched first (harmless -- its result is simply not displayed once
`mode: "html"` is applied), until/unless a future Story threads
`options.config` through `MountContext`. **Flagged for a human/owner call**
if that Runtime-level fix (extending `MountContext`, which is `Hud.ts`/#8
territory, not this package) is wanted before Story #14 wires the
Playground.

Contract §11.1 also states "Switching mode after mount is out of scope for
1.0" -- this package's `setData({mode})` handling is a best-effort
convenience for the *first* `setData` call, not a supported live toggle.

**Story #36 correction:** the `mode` customSlot's manifest description
above ("html" mode is "plain content slot, no network") is only accurate
for a Theme that was *already mounted* in object mode and then switched.
It was not accurate for a consumer intending `html` mode **from the very
first mount** (`hud.setData({ mode: "html" })` called before `mount()`,
per Contract §6.3's queue-and-replay-after-mount-resolves) -- that
consumer still pays for the same object-mode SIMBAD fetch + Aladin CDN
load this section already describes above, because of the same
`MountContext` gap. `manifest.json`'s `knownDeviations` now carries an
honest `external-io-on-mount` entry scoped `html-mode-initial-mount`
documenting this precisely, instead of leaving the customSlot description
as an unqualified "no network" claim for that case.

## `dataSource` / `skyViewer` lazy loading (no real network in tests)

Every external call is gated through `SvgRenderer`'s
`hud.loadExternalResource(name)` extension point (Story #9) before this
Theme performs its own real request:

- `hud.loadExternalResource("skyViewer")` -- gates the Aladin Lite
  script/style injection. On resolution, the script checks
  `window.A`/`A.init` exactly as the real baseline does; if absent (true in
  every test in this repo, since no test injects a real Aladin global) it
  leaves the "ALADIN LAYER STANDBY" placeholder visible -- the real
  baseline's own documented degrade-gracefully behaviour, not a test-only
  stub.
- `hud.loadExternalResource("simbad")` -- gates the DATA-tab and PAPERS-tab
  SIMBAD TAP queries (real ADQL, real URL).
- `hud.loadExternalResource("vizier")` -- gates the CATALOGS-tab VizieR
  VOTable fetch (real URL).

`hud.loadExternalResource()` validates the requested name against this
Theme's own declared `capabilities` (`SvgRenderer#requestExternalResource`)
and resolves/rejects via an injectable `ExternalResourceLoader` -- tests
supply a fake one (matching `tests/unit/svg-fixture-e2e.test.js`'s
pattern), so the *gate* never touches the network. The subsequent real
`fetch()` calls this script makes to `simbad.cds.unistra.fr` /
`vizier.cds.unistra.fr` (the actual TAP/VOTable query, which the generic
`ExternalResourceLoader.load()` shape has no room to parametrise --
`{name, host, kind}`, no query string) are this Theme's own direct calls,
matching the real baseline and Contract §16.3 ("network during mount is
permitted", `external-io-on-mount` deviation, exactly as declared here).
This repo's tests stub `globalThis.fetch` for these (see
`tests/unit/hud-01-theme.test.js`) so no test in this package makes a real
network call either.

## Single-instance / multi-instance

`capabilities.multiInstance: true` -- every DOM query in
`scripts/hud-01.js` is scoped to its own `root` (no page-global panel
state), and the Aladin CDN script injection is de-duplicated per-page by
`SvgRenderer`'s own `DomExternalResourceLoader` (`kind:host` keyed), the
same cooperative-single-load pattern the real baseline's
`_ncAladinLoader` implements by hand. Per-instance Aladin viewer ids are
randomly generated (`nc-hud01-aladin-<random>`) rather than an incrementing
counter, since this script has no cross-instance module state to count
from (Contract §16.5).

## Tests

- `tests/unit/hud-01-theme.test.js` -- manifest schema + semantic
  validation, entrypoint/composition file-existence checks (mirrors
  `tests/unit/svg-fixture-theme.test.js`, Story #9's pattern).
- `tests/unit/hud-01-e2e.test.js` -- mounts the real package through the
  real `Hud` + `SvgRenderer` (jsdom), across all three variants, proves the
  lazy `skyViewer`/`simbad`/`vizier` hooks fire with the correct
  capability-validated host/kind via a fake `ExternalResourceLoader`, and
  proves `mount -> setData -> setVariant -> destroy` leaves no DOM/listener
  residue -- no real network call is made (`globalThis.fetch` is stubbed).
