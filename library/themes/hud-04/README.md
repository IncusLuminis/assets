# hud-04 — HUD Post with Media Embed

`engine: "css"`. Packaged per HUD Theme Contract 1.0 (issue #13, Epic #21,
board `IncusLuminis/projects/7`). Mounts/destroys through the real Runtime
(`Hud` + `CssRenderer`, Story #8/#10) — no Theme-authored JavaScript ships
(`scripts: []` in every composition; see "Behavioral diffs" below).

## Source-lineage exception

Owner decision A (2026-09-09) cuts the 0.1 Themes from the **blogger-template
lineage**. That lineage exists for HUD-01/02/03
(`widgets/sandbox/blogger-hud01-02-wip/`, `widgets/releases/blogger-pilot-hud03/`)
but **not for HUD-04** — confirmed by listing `widgets/sandbox/` and
`widgets/releases/` directly: no `blogger-*hud04*` directory exists anywhere
in this repo. The only available HUD-04 source is the older panel lineage,
`widgets/panels/hud-04/` (`hud-04.css` + `hud-04.js` + `index.html`, ~635 /
72 / 126 lines per the Inventory §1.30).

This is a **necessary exception**, not a deviation from owner A — there is
nothing else to migrate. The Contract already anticipates exactly this
situation: **HUD-10** is documented (Contract §25.4) as panel-lineage-only
(`widgets/panels/hud-10/`) despite the same owner decision. This package
follows that precedent and migrates from `widgets/panels/hud-04/`.

## Relationship to HUD-03 / #11

HUD-04 is structurally identical to HUD-03's `nc-hp-*` editorial frame
(Contract §25.4: "HUD-04 … maps identically to HUD-03 plus
`capabilities.mediaEmbed` …"); the only content-area difference is the
floated `.nc-hp-media` embed block instead of a static image. This package
does not import or depend on `library/themes/hud-01/` (#11's parallel,
disjoint Story) — the ~250 lines of shared frame CSS are duplicated here
exactly as they are duplicated in the two real source files
(`migration-report.md` C-01, Inventory §6 item 8); extracting a shared frame
component is a documented future cleanup candidate, not 0.1 scope.

## Compositions (Contract §8.2)

| Composition | Supported | Basis |
|---|---|---|
| `maxi:landscape` | **yes** | full editorial panel — frame, loader, ticker, sweep, floated media, body text |
| `mini:landscape` | **yes** | `.nc-hp-mini-card` — a genuinely distinct, already-authored lower-density composition (Contract §7.3(b), Inventory §4 item 3), migrated near-as-is |
| `micro:portrait` | **yes** | the real baseline's `@media (max-width:900px)` reflow (frame ornaments hidden, media stacked full-width above text), promoted to a first-class composition — see "micro:portrait" below |
| `maxi:portrait` | no (`knownDeviations: no-maxi-portrait`) | not authored in the baseline; Contract §8.3 explicitly permits deferring it |
| `mini:portrait`, `micro:landscape` | no (`not-authored`) | not authored in the baseline |

### micro:portrait

The real `widgets/panels/hud-04/` has no 9:16/portrait composition (Inventory
§1.34, §5: "None of HUD-01…04 has a distinct 9:16 composition… must be
authored from scratch"). Rather than inventing new art direction (explicitly
out of scope per the issue and the escalate-if-a-full-redraw-is-needed
clause), this package reuses the **existing** `@media (max-width: 900px)`
rules already authored in `hud-04.css` (lines 428-462) — frame-shell,
frame-inner, frame-loader, frame-topline, frame-mask and the sweep are
hidden; the media block switches from `float:left` to a full-width block
stacked above the body text — and promotes that already-authored reduced
layout to the dedicated `micro:portrait` composition (unconditional, not
behind a breakpoint). Contract §8.1 explicitly allows this: "`@media` reflow
… `are all conformant`" for expressing the `portrait` orientation. This is
the Contract-minimum vertical thumbnail, not a full redraw — no escalation
needed.

## Slots (Contract §9, §27.9)

| Slot | Required | Real baseline element | Notes |
|---|---|---|---|
| `title` | yes | `.nc-hp-title` (maxi/micro) / `.nc-hp-mini-name` (mini) | |
| `subtitle` | no | `.nc-hp-system` ("OUTPOST 32") / `.nc-hp-mini-system` | |
| `media` | no | `.nc-hp-media` (maxi/micro) / `.nc-hp-mini-video-wrap` (mini) | see "mediaEmbed wiring" |
| `content` | no | `.nc-hp-text` | `capabilities.htmlSlot: true` — consumer HTML body copy |
| `footer` | no | `.nc-hp-frame-ticker span` | maxi only — not rendered at `mini`/`micro` density, matching the real baseline (the ticker is hidden by the same `@media(max-width:900px)` rule micro:portrait is built from, and the mini-card never had a ticker) |

`status` is intentionally **not** exposed as a slot: `.nc-reconnect` is
Theme-owned decoration (Contract §9.2 "`status` … is almost entirely
Theme-owned"), driven entirely by the `mediaEmbed` `src-swap` lifecycle, not
by consumer data.

## `mediaEmbed` wiring (Contract §10.5) — and the RECONNECTING overlay

`capabilities.mediaEmbed: { hosts: ["app.heygen.com"], lifecycle: "src-swap" }`.
The video URL is supplied only via `setData({ media: "<allowlisted URL>" })`
— **never** by editing markup — using `CssRenderer`'s standard mediaEmbed
extension point (Story #10): the renderer validates the host against both
`capabilities.mediaEmbed.hosts` and the Contract §16.2 fixed allowlist, then
creates/updates an `<iframe>` inside the composition's `data-slot="media"`
element and keeps its `src` in sync with the mount container's
`data-hud-variant` attribute via a `MutationObserver` that is disconnected on
`destroy()` (Contract §17.1-§17.2). This package supplies **no**
`data-slot="media"` markup other than the container + (in `maxi`/`micro`) the
`.nc-reconnect` label — the `<iframe>` element itself is entirely
renderer-owned, never hand-authored, so there is exactly one embedded iframe
per mounted instance (the real baseline embeds it twice statically,
`index.html:38-46,93-102` — see "Behavioral diffs").

The RECONNECTING… label is pure CSS, exactly matching the real mechanism:
`.nc-hp-media iframe[src="about:blank"] { opacity: 0 }` — the label sits
behind the iframe (`z-index: 0` vs. the iframe's `z-index: 1`) and shows
through whenever the iframe is parked at `about:blank`. `CssRenderer`'s
`src-swap` lifecycle parks the embed at `about:blank` at every variant except
`maxi` and restores the real `src` at `maxi` — so RECONNECTING… shows at
`mini`/`micro` and clears at `maxi`, the same visual state machine as the
real widget's collapse/expand toggle, driven by variant instead of a click.

### Correction to the issue's / audit's "hide on iframe `load` event" claim

Issue #13's AC and the older `widgets/docs/audit-hud01-06.md` both describe
the RECONNECTING overlay as "hidden on iframe `load` event … JS detects
iframe load". **This is stale.** The Inventory's own direct code read
(`HUD_Platform_Inventory_0.1.md` §1.32, confirmed again here against
`widgets/panels/hud-04/hud-04.js`) found **no `load` listener anywhere** in
the real 72-line `hud-04.js` — the overlay is driven purely by the CSS
`iframe[src="about:blank"]` selector, not by JS detecting a load event. This
package therefore implements the **real** mechanism (CSS keyed off `src`,
which is exactly what `CssRenderer`'s `src-swap` lifecycle already drives),
not the audit's inaccurate description. The Playwright test
(`tests/e2e/css-renderer-hud-04.spec.ts`) asserts the actual `src`-keyed
opacity behavior, not a fabricated `load`-event listener.

## Isolation (Contract §15.1/§15.3)

`isolation: "shadow-dom-preferred"`, following #10's precedent
(`docs/adr/0003-css-renderer-isolation.md`). Verified empirically, not
assumed, for this Theme's own CSS (not merely inherited from the fixture):
`tests/e2e/css-renderer-hud-04.spec.ts` mounts the real `hud-04` package
through the real `CssRenderer` in a real headless Chromium and asserts, live
inside the Shadow DOM `CssRenderer` attaches:

- `clip-path` (the frame-shell / frame-inner / mini-card polygon cuts) renders as authored;
- `filter: drop-shadow(...)` (the frame glow) renders as authored;
- `transform: skewX(...)` (the frame-loader segments) renders as authored;
- `transform: scale(...)` (the mini-card's scaled-down video preview, Inventory §1.34) renders as authored;
- `float: left` (the media/text wrap) lays out as authored;
- a Theme-authored… there is deliberately **no** `body`/`html`/`:root`/bare-`*`
  rule anywhere in this package's CSS to test leakage against (same
  no-host-wide-selector discipline as fixture-css-hud), so the isolation
  guarantee here rests on Shadow DOM's selector boundary by construction, the
  same as #10's fixture.

Result: **Shadow DOM held** — no `shadow-dom-fallback` deviation is
recorded. `CssRenderer`'s scoped-root fallback path (exercised generically by
#10's own unit tests) remains available if a future environment lacks
`attachShadow`, but is not this Theme's expected runtime path.

## Behavioral diffs vs. `widgets/panels/hud-04/`

All of these are **intentional, Contract-driven** changes, not regressions —
called out explicitly per the issue's "document any diff" AC:

1. **No Theme-authored JavaScript (`scripts: []`).** The real `hud-04.js`
   (72 lines) did three things: (a) drive the mini/expand toggle via
   `NcHudMini`, (b) swap the main/mini iframe `src` between the real URL and
   `about:blank` on collapse/expand, (c) restore the main iframe's `src` via
   a `MutationObserver` on the widget's `class` attribute. In the Contract
   model, (a) is replaced by `Hud.setVariant()` mounting a distinct
   composition directly (Contract §7.5 — no "load mini then expand" flash);
   (b)/(c) are replaced by `CssRenderer`'s generic, built-in `mediaEmbed`
   `src-swap` extension point, keyed off `data-hud-variant` instead of a
   `class` mutation. **This also fixes a real, flagged bug**: the Inventory
   (§1.33, §1.35, "High" severity) found the real `hud-04.js`
   `MutationObserver` is `.observe()`d with **no** `.disconnect()` — a
   leak on every teardown. `CssRenderer`'s equivalent observer **is**
   disconnected in `destroy()` (Contract §17.1-§17.2) — verified in
   `tests/unit/css-renderer-hud-04-e2e.test.js`.

2. **One embedded iframe per mounted instance, not two.** The real widget
   keeps both the main-panel iframe and the mini-card iframe permanently in
   the DOM at once (so it can toggle between them client-side without a
   fresh network request), and — as item 3 below covers — plays the mini one
   live. In the Contract model `maxi` and `mini` are separate, mutually
   exclusive **mounted compositions** (only one is ever mounted at a time),
   so there is naturally only ever one embedded iframe live per instance.

3. **`mini`'s video preview is parked at `about:blank`, not live.** The real
   `.nc-hp-mini-video-wrap` iframe plays continuously while the panel is
   collapsed, specifically to give the thumbnail a "live" feel while the main
   iframe is paused. Contract §10.5 defines `lifecycle: "src-swap"` as
   parking the embed at `about:blank` **at every variant except `maxi`**
   ("parks a hidden iframe at `about:blank` and restores `src` on expand") —
   this is the Contract's own normative description of the capability, which
   `CssRenderer` (#10) implements generically for every `mediaEmbed` Theme.
   Reproducing the real dual-iframe (one live, one paused) behavior would
   mean bypassing that shared extension point for a Theme-specific one,
   which is out of this Story's scope (`CssRenderer.ts` is explicitly frozen
   for #13). Accepted as a Contract-driven compromise, not a bug.

4. **RECONNECTING… overlay: real mechanism preserved, audit's stale
   description corrected.** See "Correction to the issue's / audit's 'hide
   on iframe load event' claim" above — the packaged Theme reproduces the
   real CSS-`src`-keyed behavior exactly; it does not implement a `load`
   event listener, because the real baseline never had one.

5. **`.nc-hp-media`/`.nc-hp-text` are DOM siblings, not parent/child.** The
   real markup nests the floated media block *inside* the text block purely
   so `display: flow-root` (a clearfix) on the text block contains its
   floated child. Contract §9 requires `media` and `content` to be
   independently addressable slots — nesting them would mean every
   `setData({ content })` call (which sets `innerHTML`, Contract §9.3)
   wipes out the media slot's DOM. This package makes them siblings under a
   shared `.nc-hp-content` parent instead (media first, so normal float-wrap
   still applies to the following text sibling) and moves the clearfix up to
   `.nc-hp-content`. Visually identical — CSS float-wrap does not require DOM
   nesting, only float-then-sibling order in the same non-BFC flow — see the
   inline comment in `styles/shared.css`.

6. **Shared keyframes are Theme-local, not global-named.** `hudBreath`,
   `.nc-panel-sweep`'s animation, and `hudTickerScroll` are, per Contract
   §11.2/§15.6, meant to come from a platform-provided shared "base" the
   Runtime injects once per page. That injection is explicitly **not yet
   implemented** (`src/runtime/core/ThemeResolver.ts:138`: "actually
   injecting the base bundle once per page is out of #8's [scope]"), and
   #10 doesn't add it either. Declaring `manifest.animations` against a
   mechanism that silently does nothing would ship an invisible regression
   (no animation, no error). This package instead inlines self-contained,
   Theme-locally-named copies (`hud04Breath`, `hud04PanelSweep`,
   `hud04TickerScroll`, `hud04Loader1..8`) — matching Arch §8.3's
   "self-contained text Themes preferred" fallback — and does not declare
   `manifest.animations`. `hud04Breath`/`hud04PanelSweep` are re-implemented
   (not byte-identical to the unseen shared `animations.css`/`effects.css`
   keyframe bodies, which are not part of the panel-lineage source this
   Story migrates from) to produce the same breathing-glow / diagonal-sweep
   character.

7. **"Share Tech Mono" is referenced, not loaded.** The real `index.html`
   `<link>`s Google Fonts at page load. This package references the same
   font-family name with a monospace fallback stack but does not itself
   `@import`/`<link>` it — mirroring fixture-css-hud's (#10) own choice —
   to avoid introducing real page-load external I/O (and the
   `external-io-on-mount` knownDeviations + real-network test-stubbing
   burden that would come with it) for a Story whose AC does not require
   pixel-exact typography. Text renders in the fallback monospace stack.

8. **No standalone-page chrome.** `.nc-hud04-stage` (the demo page's own
   `<main>` wrapper/background) is not part of the Theme — it was
   `widgets/panels/hud-04/index.html`'s own page shell, not part of the
   reusable widget.

## Validation & tests

- `tests/unit/library-hud-04-theme.test.js` — manifest validates against
  `registry/schemas/manifest.schema.json`, passes the semantic
  (cross-field) checks, every `supported: true` composition has its
  `<variant>/<orientation>/` directory and entrypoint files on disk, no
  shipped CSS contains a host-wide `body`/`html`/`:root`/bare-`*` selector.
- `tests/unit/css-renderer-hud-04-e2e.test.js` — mounts through the real
  `Hud` + `CssRenderer` (jsdom): `setData` across all slots, `mediaEmbed`
  src-swap at `maxi` vs. `mini`, `setVariant`, `destroy()` leaves no DOM
  residue, idempotent `destroy()`, a failed asset load surfaces
  `AssetLoadFailedError` and leaves the container empty (Contract §6.2).
- `tests/e2e/css-renderer-hud-04.spec.ts` — Playwright/real Chromium: the
  isolation verification described above, `mediaEmbed` against a locally
  stubbed `app.heygen.com` route (`page.route`, no real network call),
  RECONNECTING opacity at `mini` vs. `maxi`, no page scrollbar
  (`overflowVisible: true` decoration does not leak into document scroll),
  no leaked host styles after `destroy()`.
