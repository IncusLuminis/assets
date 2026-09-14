# hud-03 — HUD Post

`engine: "css"`. Packaged per HUD Theme Contract 1.0 (issue #15, Epic #21,
board `IncusLuminis/projects/7`). Mounts/destroys through the real Runtime
(`Hud` + `CssRenderer`, Story #8/#10) — no Theme-authored JavaScript ships
(`scripts: []` in every composition; see "Behavioral diffs" below).

## Issue #15 AC is stale — followed the frozen Contract instead

Issue #15's own acceptance criteria (`variants: [mini, maxi]`, `aspectRatios`,
"adding a `micro` variant" listed as out of scope) predate the owner's
2026-09-09 form-factor reframe (Contract §1.4, §7.1, §8.2) and are
superseded by the frozen Contract: `orientations: [landscape, portrait]`
replaces `aspectRatios` (Contract §3.3, removed field), and **all three**
variants `maxi`/`mini`/`micro` are REQUIRED in 1.0 (Contract §7.1). This
package follows the Contract, not the issue's literal wording, per the
assignment's own instruction.

## Source lineage

Owner decision A (2026-09-09, Implementation Plan §7) names Stories
**#11–#15** (including this one, #15) as targeting the **blogger-template
lineage**, and Contract §25.1's own source-lineage list names
`widgets/releases/blogger-pilot-hud03/` for HUD-03 specifically. This
package is built from that material:

- `widgets/releases/blogger-pilot-hud03/blogger-hud03-template.css` — the
  shared frame/foundation CSS, pasted once into a Blogger theme and reused
  by every post. Covers both HUD-03 and HUD-04 from one file (its own
  README: "There is no separate CSS or JS for HUD-03 vs. HUD-04 — it is
  the same file. The visual difference is determined entirely by what you
  put inside `.nc-hp-text`.").
- `widgets/releases/blogger-pilot-hud03/examples/image-version.html` — the
  concrete example, explicitly labelled in its own file header
  **"EXAMPLE: Static Image (HUD-03 style)"**, and the markup this package's
  `maxi`/`micro` compositions mirror (floated portrait image + freeform
  body text + real `.nc-hp-mini-card` thumbnail/name overlay).
- `widgets/releases/blogger-pilot-hud03/blogger-hud03-template.js` —
  confirmed to be *only* the `NcHudMini` collapse/expand toggle module
  (130 lines: `click`/`transitionend` listeners, no per-Theme HUD-03 logic)
  — not carried into this package (see "Behavioral diffs" item 1).

The directory's other example files (`heygen-version.html`,
`youtube-version.html`, `tiktok-version.html`) are the **HUD-04**-style
(video-embed) content variant of the same shared template and are out of
this Story's scope — that lineage is already packaged as
`library/themes/hud-04/` (#13, merged). `optional/blogger-template-snippet.txt`
and `multi-panel-row.html` (page-level Blogger-install / multi-instance-row
concerns) were also read and confirmed out of scope (issue: "a
multi-instance-per-page refactor").

### Lineage-verification note (per the #13 lesson)

This Story's own directory scope (`widgets/releases/blogger-pilot-hud03/`)
**is** the real blogger-lineage source — no directory-name-search trap here
the way #13 hit with HUD-04 (which had to be re-sourced from a
differently-named example file after an initial `widgets/panels/hud-04/`
draft). The whole tree (`examples/`, `optional/`, the empty `screenshots/`)
was read before finalizing this package, per the assignment's instruction,
to confirm no HUD-03-specific material was hiding outside the two files
above. `widgets/panels/hud-03/` (the older, independently-diverged **panel**
lineage the Inventory §1.20–§1.29 also documents) was cross-checked and is
consistent in spirit (`nc-hp-*` frame, `NcHudMini`, no data APIs) but was
**not** the source used — Contract §25.1 names the blogger-pilot lineage,
and `library/themes/hud-04/` (this package's closest precedent, same real
upstream file) already established that the blogger-lineage file is the
one that wins per owner decision A. The two lineages' frame CSS is
near-byte-identical (both share the `nc-hp-*` design), which is reassuring
but was not the reason either was chosen — provenance decided it, not
pixel-matching.

## Relationship to HUD-04 / #13

Per the shared blogger template file, HUD-04 is HUD-03 with the content
area's media block swapped from a static image (`nc-hud-float-image`) to an
embedded-video block (`nc-hud-media`/`nc-hud-media-vertical`) — same
`nc-hp-*` frame, same shared keyframes, same mini-card mechanism. This
package's `styles/shared.css` shares its frame/keyframe **source bytes**
with `library/themes/hud-04/styles/shared.css` (#13) — both are independent
migrations of the same upstream `blogger-hud03-template.css` — but is an
independent copy, scoped under `.hud-03` instead of `.hud-04`, per this
Story's scope boundary (`library/themes/hud-04/` is explicitly out of
scope, not to be touched). The frame CSS duplication across HUD-03/HUD-04
is a documented, pre-existing condition of the real source itself
(Inventory §1.28 "Frame CSS duplicated in HUD-04"), not something either
Story introduces; extracting a shared frame component is a documented
future cleanup candidate, not 0.1 scope (same conclusion #13 reached).

This package does **not** import or depend on `library/themes/hud-04/` or
`library/themes/hud-01/` (#11's parallel, disjoint Story).

## Compositions (Contract §8.2)

| Composition | Supported | Basis |
|---|---|---|
| `maxi:landscape` | **yes** | full editorial panel — frame, loader, ticker, sweep, floated image, body text |
| `mini:landscape` | **yes** | `.nc-hp-mini-card` — a genuinely distinct, already-authored lower-density composition (Contract §7.3(b), Inventory §1.26: "closest of the four HUDs to Arch §13's intent"), migrated near-as-is, **no** adaptation needed (see "Mini-card fidelity" below) |
| `micro:portrait` | **yes** | the real baseline's `@media (max-width:900px)` reflow (frame ornaments hidden, image stacked full-width above text), promoted to a first-class composition — see "micro:portrait" below |
| `maxi:portrait` | no (`knownDeviations: no-maxi-portrait`) | not authored in the baseline; Contract §8.3 explicitly permits deferring it |
| `mini:portrait`, `micro:landscape` | no (`not-authored`) | not authored in the baseline |

### micro:portrait

The real baseline has no 9:16/portrait composition (Inventory §1.27: "No
9:16. Gap for #18."). Rather than inventing new art direction (explicitly
out of scope per the issue and the escalate-if-a-full-redraw-is-needed
clause), this package reuses the **existing** `@media (max-width: 900px)`
rules already authored in `blogger-hud03-template.css` (lines 760-801) —
frame-shell, frame-inner, frame-loader, frame-topline, frame-mask and the
sweep are hidden; the floated image switches from `float:left` to a
full-width block stacked above the body text — and promotes that
already-authored reduced layout to the dedicated `micro:portrait`
composition (unconditional, not behind a breakpoint). Contract §8.1
explicitly allows this: "`@media` reflow … are all conformant" for
expressing the `portrait` orientation. This is the Contract-minimum
vertical thumbnail, not a full redraw — no escalation needed. Identical
approach to #13's `hud-04` `micro:portrait` (same upstream `@media` block).

## Mini-card fidelity: real, not scaled

`mini:landscape` is the **real** `.nc-hp-mini-card` structure from
`image-version.html`: a system label (`.nc-hp-mini-system`), a static
thumbnail `<img class="nc-hp-mini-thumb">`, and the character name
(`.nc-hp-mini-name`) — not a `transform: scale()` crop of the `maxi` DOM.
This is Contract §7.3 option **(b)** ("a genuine distinct lower-density
composition"), confirmed as already-authored real markup per Inventory
§1.26 ("this one is genuinely a distinct lower-density composition already
— closest of the four HUDs to Arch §13's intent... #4 can adopt it
near-as-is").

Unlike `library/themes/hud-04/`'s mini card — which had to substitute a
"live video preview" (`.nc-hp-mini-video-wrap` + scaled iframe) for the
media slot because HUD-04 declares `capabilities.mediaEmbed` and
`CssRenderer`'s generic slot path only special-cases `media` (→ iframe) and
`content`, not a plain `<img src>` — **HUD-03 needs no such substitution**.
HUD-03 has no `mediaEmbed` capability; `CssRenderer.#applyMediaSlot` already
handles the no-`mediaEmbed` case generically: `if (el instanceof
HTMLImageElement) el.src = value`. So the mini card's `data-slot="media"`
element is the real `.nc-hp-mini-thumb` `<img>` from the shipped example,
used exactly as authored — no behavioral diff, no deviation record needed
for this one. This was confirmed by reading `CssRenderer.ts` directly
(`#applyMediaSlot`), not assumed from the HUD-04 precedent.

## Slots (Contract §9, §27.9)

| Slot | Required | Real baseline element | Notes |
|---|---|---|---|
| `title` | yes | `.nc-hp-title` (maxi/micro) / `.nc-hp-mini-name` (mini) | character/post name |
| `subtitle` | no | `.nc-hp-system` ("OUTPOST 42") / `.nc-hp-mini-system` | system/location label |
| `media` | no | `.nc-hud-float-image` (maxi/micro) / `.nc-hp-mini-thumb` (mini) | a plain `<img data-slot="media">` in every composition — `setData({ media: <url> })` sets `.src` directly (no `mediaEmbed`, no iframe) |
| `content` | no | `.nc-hp-text` | `capabilities.htmlSlot: true` — consumer HTML body copy |
| `footer` | no | `.nc-hp-frame-ticker span` | maxi only — not rendered at `mini`/`micro` density, matching the real baseline (the ticker is hidden by the same `@media(max-width:900px)` rule `micro:portrait` is built from, and the mini-card never had a ticker) |

`status` is not exposed as a slot — the real HUD-03 has no `.nc-reconnect`
or comparable Theme-owned status element (that is HUD-04-specific, driven
by its `mediaEmbed` lifecycle); nothing in HUD-03's real markup maps to it.

## Content via slots, not `index.html` editing

The real source's data-injection mechanism is "edit `index.html`/the
per-post HTML snippet directly" in **two places** for the image (main
float + mini-card thumbnail both hard-code the same `src`, Inventory
§1.25). This package replaces that entirely: every consumer-facing value —
`title`, `subtitle`, `media` (the image URL), `content` (freeform body
HTML), `footer` (ticker text) — is a `data-slot="..."` element that
`CssRenderer.setData()` targets. A consumer never edits this package's
`maxi/landscape/hud.html` (or any other composition's markup) to set
content; `setData({ media: "<url>" })` alone updates the `<img>` `src` in
whichever composition is mounted, replacing the source's "change the URL in
two places" requirement with one `setData` call per mount.

## Isolation (Contract §15.1/§15.3) — re-verified for HUD-03's own CSS

`isolation: "shadow-dom-preferred"`, following #10's precedent
(`docs/adr/0003-css-renderer-isolation.md`) and #13's confirmation that it
held for the shared `blogger-hud03-template.css` foundation. **Re-verified
empirically for this Theme's own composition** (not assumed identical to
HUD-04 just because the frame CSS is shared) via
`tests/e2e/css-renderer-hud-03.spec.ts`, which mounts the real `hud-03`
package through the real `CssRenderer` in a real headless Chromium and
asserts, live inside the Shadow DOM `CssRenderer` attaches:

- `clip-path` (the frame-shell / frame-inner / mini-card polygon cuts) renders as authored;
- `filter: drop-shadow(...)` (the frame glow) renders as authored;
- `transform: skewX(...)` (the frame-loader segments) renders as authored;
- `float: left` (the image/text wrap) lays out as authored;
- the plain `<img data-slot="media">` element (HUD-03's own composition —
  distinct from HUD-04's iframe-based media slot) resolves its `src`
  correctly inside the shadow tree;
- no Theme-authored `body`/`html`/`:root`/bare-`*` rule exists anywhere in
  this package's CSS for leakage to escape through in the first place (same
  no-host-wide-selector discipline as `fixture-css-hud` / `hud-04`), so the
  isolation guarantee rests on Shadow DOM's selector boundary by
  construction.

Result: **Shadow DOM held** for HUD-03's own composition — no
`shadow-dom-fallback` deviation is recorded. `CssRenderer`'s scoped-root
fallback path (exercised generically by #10's own unit tests) remains
available if a future environment lacks `attachShadow`, but is not this
Theme's expected runtime path.

## No `mediaEmbed` capability — confirmed, not assumed

The real HUD-03 source has an `<img>` float, never an iframe: confirmed
directly against `image-version.html` (only media markup:
`<img class="nc-hud-float-image">`) and against
`blogger-hud03-template.css`'s own "MEDIA SLOTS (public API)" comment block,
which documents `nc-hud-float-image` as the HUD-03-specific media class,
separate from the `nc-hud-media`/`nc-hud-media-vertical`/`nc-hud-media-horizontal`
iframe wrapper classes that only the video (HUD-04-style) examples use.
`manifest.capabilities` therefore declares no `mediaEmbed` object — the
`media` slot is a plain image, handled by `CssRenderer`'s generic
non-`mediaEmbed` slot path (see "Mini-card fidelity" above).

## No Theme JS — confirmed against the real source

`blogger-hud03-template.js` is confirmed (130 lines, read in full) to be
*only* the `NcHudMini` collapse/expand toggle module — `init()`, a
`click`/`transitionend`-driven `expand()`/`collapse()` pair, and
`global.NcHudMini = { init }`. It holds no per-Theme HUD-03 rendering logic,
no data-injection code, nothing this Contract model needs to reproduce as
Theme-authored script. Mirroring #13's approach exactly: this package ships
`scripts: []` in every composition and lets `Hud.setVariant()` own what the
toggle used to do (see "Behavioral diffs" item 1).

## Behavioral diffs vs. the real blogger-lineage HUD-03 material

All of these are **intentional, Contract-driven** changes, not
regressions — called out explicitly per the issue's "document any diff" AC:

1. **No Theme-authored JavaScript (`scripts: []`).** The real
   `blogger-hud03-template.js` (130 lines, shared by every panel on the
   page) drives only the mini/expand toggle (`NcHudMini`) — `click` and
   `transitionend` listeners, no per-Theme logic. In the Contract model,
   the toggle is replaced by `Hud.setVariant()` mounting a distinct
   composition directly (Contract §7.5 — no "load mini then expand"
   flash). Net effect: `maxi` and `mini` are two separately-mounted
   compositions rather than one DOM tree with a CSS `max-height`
   transition and a JS-toggled `is-mini` class.

2. **One rendered composition per mounted instance, not an overlay pair.**
   The real widget keeps both `.nc-hp-panel` (main) and `.nc-hp-mini-card`
   (overlay) in the DOM simultaneously inside one `.nc-hp-widget`, toggled
   client-side via `visibility`/`opacity`. In the Contract model `maxi` /
   `mini` / `micro` are separate, mutually exclusive **mounted
   compositions**, so only one of {panel, mini-card} is ever in the DOM at
   once per instance.

3. **`.nc-hud-float-image`/`.nc-hp-text` are DOM siblings, not
   parent/child.** The real markup nests the floated `<img>` *inside*
   `.nc-hp-text` purely so `display: flow-root` (a clearfix) on the text
   block contains its floated child. Contract §9 requires `media` and
   `content` to be independently addressable slots — nesting them would
   mean every `setData({ content })` call (which sets `innerHTML`,
   Contract §9.3) wipes out the media slot's DOM. This package makes them
   siblings under a shared `.nc-hp-content` parent instead (image first, so
   normal float-wrap still applies to the following text sibling) and moves
   the clearfix up to `.nc-hp-content`. Visually identical — CSS float-wrap
   does not require DOM nesting, only float-then-sibling order in the same
   non-BFC flow. Same restructuring #13 made for the structurally-identical
   HUD-04 markup.

4. **Shared keyframes are Theme-local, not global-named.** The real source
   is genuinely self-contained (all keyframes defined in
   `blogger-hud03-template.css` itself — there is no separate "shared base"
   file this lineage depends on). This package keeps that self-containment
   but renames the keyframes (`hud03Breath`, `hud03PanelSweep`,
   `hud03TickerScroll`, `hud03OpenHud`, `hud03Loader1..8`) to avoid a future
   cross-bundle collision if this platform's not-yet-implemented
   shared-foundation "base" injection (`src/runtime/core/ThemeResolver.ts:138`)
   is added later and defines the bare global names itself (Contract §15.6).
   `manifest.animations` is left undeclared since nothing here is sourced
   from an external base. **The keyframe bodies themselves are copied
   verbatim from the real source.** Same treatment #13 gave the identical
   upstream keyframes under `hud04*` names — the two packages' keyframe
   *bodies* are byte-identical, only the Theme-local prefix differs.

5. **Google Fonts is actually loaded, not just referenced.** The real
   source `@import`s "Share Tech Mono" directly in its CSS
   (`blogger-hud03-template.css:14`); this package ports that `@import`
   verbatim into `styles/shared.css`. This is real page-load external I/O
   to an allowlisted host (Contract §16.2), so `manifest.knownDeviations`
   carries `external-io-on-mount` (§16.3) and `manifest.externalResources`
   declares `fonts.googleapis.com`/`fonts.gstatic.com`. Falls back to the
   monospace stack if blocked, same as the source.

6. **No toggle button, no client-side collapse/expand.** `Hud.setVariant()`
   replaces `NcHudMini`'s button/click/transition machinery entirely (see
   item 1). `.nc-hp-system-row` (the toggle button's anchor point in the
   real widget) is kept as a layout wrapper around the `subtitle` label
   alone, since its positioning was tuned together with the label's own
   offset against the real rendered layout — dropping the wrapper risked
   silently reintroducing a line-height/position bug the real source's
   comments describe fixing.

7. **No standalone-page chrome, no multi-panel row layout.** Page-level
   wrappers (`image-version.html`'s own `<style>` block that only exists to
   tweak that one demo post's mini-card positioning) and the release's
   `.nc-hud-row` multi-panel-row CSS are not part of the reusable widget and
   are out of this Story's scope (issue: "a multi-instance-per-page
   refactor").

## Validation & tests

- `tests/unit/library-hud-03-theme.test.js` — manifest validates against
  `registry/schemas/manifest.schema.json`, passes the semantic
  (cross-field) checks, every `supported: true` composition has its
  `<variant>/<orientation>/` directory and entrypoint files on disk, no
  shipped CSS contains a host-wide `body`/`html`/`:root`/bare-`*` selector,
  keyframes are Theme-locally named.
- `tests/unit/css-renderer-hud-03-e2e.test.js` — mounts through the real
  `Hud` + `CssRenderer` (jsdom): `setData` across all slots (including the
  plain-`<img>` `media` slot), `setVariant`, `destroy()` leaves no DOM
  residue, idempotent `destroy()`, a failed asset load surfaces
  `AssetLoadFailedError` and leaves the container empty (Contract §6.2).
- `tests/e2e/css-renderer-hud-03.spec.ts` — Playwright/real Chromium: the
  isolation verification described above ("re-verified, not assumed"),
  no page scrollbar (`overflowVisible: true` decoration does not leak into
  document scroll), no leaked host styles after `destroy()`, the Google
  Fonts `@import` stubbed locally (no real network call).
