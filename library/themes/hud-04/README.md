# hud-04 — HUD Post with Media Embed

`engine: "css"`. Packaged per HUD Theme Contract 1.0 (issue #13, Epic #21,
board `IncusLuminis/projects/7`). Mounts/destroys through the real Runtime
(`Hud` + `CssRenderer`, Story #8/#10) — no Theme-authored JavaScript ships
(`scripts: []` in every composition; see "Behavioral diffs" below).

## Source lineage

Owner decision A (2026-09-09, Implementation Plan §7) names Stories
**#11–#15** (including this one, #13) as targeting the **blogger-template
lineage**. This package is built from that material:

- `widgets/releases/blogger-pilot-hud03/blogger-hud03-template.css` +
  `blogger-hud03-template.js` — the shared frame/foundation CSS+JS, pasted
  once into a Blogger theme and reused by every post.
- `widgets/releases/blogger-pilot-hud03/examples/heygen-version.html` — the
  concrete example, explicitly labelled **"(HUD-04 style)"** in its own file
  header, and the markup this package's `maxi`/`micro` compositions mirror.

### Correcting this package's first draft

An earlier draft of this package was built from `widgets/panels/hud-04/`
(the older, independently-diverged **panel** lineage) instead, on the
reasoning that no blogger-lineage HUD-04 material existed — that search
(directory-name grep for `blogger-*hud04*`) was too narrow. HUD-04 was never
its own file in the blogger lineage: `blogger-hud03-template.css`/`.js`
**covers both HUD-03 and HUD-04 from one file** (its own README: "There is
no separate CSS or JS for HUD-03 vs. HUD-04 — it is the same file. The
visual difference is determined entirely by what you put inside
`.nc-hp-text`."), and the HUD-04-style *content* lives in
`examples/heygen-version.html`, not in a differently-named template file.
`widgets/sandbox/` was re-checked for anything else adjacent (it holds only
`blogger-hud01-02-dev/` and `blogger-hud01-02-wip/` — HUD-01/02 material,
nothing for HUD-03/04) and has nothing further.

The HUD-10 comparison in the first draft doesn't hold either:
`widgets/panels/hud-10/` has no independently-diverged implementation the
way `widgets/panels/hud-04/` does — HUD-10 has only ever existed as a
blogger-style template, so its situation isn't the "necessary exception"
the first draft treated it as. HUD-04 genuinely has *both* a diverged panel
implementation *and* this blogger-lineage material; the blogger material
wins per owner decision A.

`widgets/panels/hud-04/` remains useful as a **cross-check**: its frame CSS
(`.nc-hp-frame-*`) is near-byte-identical to the blogger lineage's (both
ultimately share the same `nc-hp-*` design), which is reassuring but not
the reason either was chosen — provenance, not pixel-matching, decided it.

## Relationship to HUD-03 / #11

Per the shared blogger template file, HUD-04 is HUD-03 with the content
area's media block swapped from a static image (`nc-hud-float-image`) to an
embedded-video block (`nc-hud-media`/`nc-hud-media-vertical`) — same
`nc-hp-*` frame, same shared keyframes, same mini-card mechanism. This
package does not import or depend on `library/themes/hud-01/` (#11's
parallel, disjoint Story) — the frame CSS is duplicated here exactly as it
is duplicated in the shared source file across the HUD-03/HUD-04 *content*
choice (there's only one template file, but a HUD-01-family Theme is a
wholly separate lineage/design). Extracting a shared frame component is a
documented future cleanup candidate, not 0.1 scope.

## Compositions (Contract §8.2)

| Composition | Supported | Basis |
|---|---|---|
| `maxi:landscape` | **yes** | full editorial panel — frame, loader, ticker, sweep, floated media, body text |
| `mini:landscape` | **yes** | `.nc-hp-mini-card` — a genuinely distinct, already-authored lower-density composition (Contract §7.3(b)), migrated near-as-is (with one adaptation — see "Behavioral diffs" item 3) |
| `micro:portrait` | **yes** | the real baseline's `@media (max-width:900px)` reflow (frame ornaments hidden, media stacked full-width above text), promoted to a first-class composition — see "micro:portrait" below |
| `maxi:portrait` | no (`knownDeviations: no-maxi-portrait`) | not authored in the baseline; Contract §8.3 explicitly permits deferring it |
| `mini:portrait`, `micro:landscape` | no (`not-authored`) | not authored in the baseline |

### micro:portrait

The real baseline has no 9:16/portrait composition. Rather than inventing
new art direction (explicitly out of scope per the issue and the
escalate-if-a-full-redraw-is-needed clause), this package reuses the
**existing** `@media (max-width: 900px)` rules already authored in
`blogger-hud03-template.css` (lines 760-801) — frame-shell, frame-inner,
frame-loader, frame-topline, frame-mask and the sweep are hidden; the media
block switches from `float:left` to a full-width block stacked above the
body text — and promotes that already-authored reduced layout to the
dedicated `micro:portrait` composition (unconditional, not behind a
breakpoint). Contract §8.1 explicitly allows this: "`@media` reflow …
`are all conformant`" for expressing the `portrait` orientation. This is the
Contract-minimum vertical thumbnail, not a full redraw — no escalation
needed.

## Slots (Contract §9, §27.9)

| Slot | Required | Real baseline element | Notes |
|---|---|---|---|
| `title` | yes | `.nc-hp-title` (maxi/micro) / `.nc-hp-mini-name` (mini) | |
| `subtitle` | no | `.nc-hp-system` ("NEXUS STATION") / `.nc-hp-mini-system` | |
| `media` | no | `.nc-hud-media` (maxi/micro) / `.nc-hp-mini-video-wrap` (mini) | see "mediaEmbed wiring" |
| `content` | no | `.nc-hp-text` | `capabilities.htmlSlot: true` — consumer HTML body copy |
| `footer` | no | `.nc-hp-frame-ticker span` | maxi only — not rendered at `mini`/`micro` density, matching the real baseline (the ticker is hidden by the same `@media(max-width:900px)` rule micro:portrait is built from, and the mini-card never had a ticker) |
| `mediaPoster` (custom, `kind: "url"`) | no | none — not DOM-mapped | Story #45: `micro`-only poster/thumbnail shown instead of a live embed, see "micro degradation" below |

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
renderer-owned, never hand-authored.

## `mediaPoster` slot + micro degradation: no live embed at `micro` (Story #45)

The mechanism above makes sense at `maxi`/`mini`, but never at `micro`:
`micro:portrait` is a thumbnail-density composition (see "micro:portrait"
above), and a real HeyGen iframe there is either invisible or
broken-looking, and wastes a real network/CDN load nobody can usefully
watch. As of Story #45, `variant === "micro"` changes what an allowlisted
`media` embed URL does:

- **No iframe is ever mounted at `micro`.** `CssRenderer` diverts the same
  per-value `resolveMediaEmbedUrl` match to `mediaEmbed.ts`'s
  `applyMicroEmbedPoster` instead of `mountMediaEmbed`.
- A new optional custom slot, **`mediaPoster`** (`kind: "url"`) -- set via
  `setData({ mediaPoster: "<poster-image-url>" })`, independently of
  `media` -- is shown as a static poster `<img>` created inside the
  `.nc-hud-media`/`data-slot="media"` container (this package supplies no
  hand-authored `<img>` there, same as it supplies no hand-authored
  `<iframe>`), plus a purely decorative, non-interactive
  (`pointer-events: none`) play-icon overlay (`.hud-media-play-icon`) on
  top of it. Both paint after (on top of) the pre-existing `.nc-reconnect`
  label in DOM order -- no `z-index` needed, see `styles/shared.css`'s
  "Story #45" comment.
- **If `mediaPoster` is not provided**, this is a deliberate no-op: no
  poster `<img>` is created, no play-icon, `.nc-reconnect` is left showing
  exactly as it already does for any `micro` mount with no live embed --
  the incoming embed URL is never written anywhere near the media slot's
  `data-media-src` attribute or an `<img>`'s `src` (which would just be a
  broken image). Inventing a generic placeholder graphic for this case was
  judged its own small design task, not worth doing inside this fix.
- `maxi`/`mini` are completely unaffected: `mediaPoster` is ignored there,
  and the live-embed mechanism above is unchanged. Switching variant away
  from `micro` remounts the whole composition and Hud replays the last
  `setData()`, so the real embed mounts again exactly as before.

See `tests/unit/css-renderer-hud-04-e2e.test.js`'s two "Story #45" tests
for the poster/play-icon/no-iframe coverage and the no-`mediaPoster`
fallback.

**Out of scope for Story #45** (tracked separately, `IncusLuminis/assets#46`):
any click-to-expand/toggle behavior. The play-icon overlay is intentionally
inert -- `pointer-events: none` -- so it can never intercept a click meant
for a future expand-to-`maxi` toggle wrapper placed on or around the HUD.

The RECONNECTING… CSS is copied verbatim from the real source:
`.nc-hud-media iframe[src="about:blank"] { opacity: 0 }` (`blogger-hud03-
template.css:605`) — the label sits behind the iframe (`z-index: 0` vs. the
iframe's `z-index: 1`) and shows through whenever the iframe is parked at
`about:blank`. `CssRenderer`'s `src-swap` lifecycle parks the embed at
`about:blank` at every variant except `maxi` and restores the real `src` at
`maxi`.

### This rule is real but was dormant in the actual shipped example

`heygen-version.html`'s own `<script>` block only calls the shared
`NcHudMini.init({...})` toggle with no `onCollapse`/`onExpand` callbacks — it
never sets the iframe's `src` to `about:blank` at all. The
`iframe[src="about:blank"]` CSS rule is real, shared-template CSS, but
nothing in the shipped HUD-04 example ever exercises it: the video keeps
playing (invisibly, behind `visibility: hidden`) even while the panel is
collapsed. This package is the first thing to actually *drive* that CSS —
via `CssRenderer`'s `mediaEmbed` `src-swap` capability — giving working
pause/resume behavior the real material never fully provided on its own
(see "Behavioral diffs" item 1 for the separate, panel-lineage version's
own attempt and its bug).

### Correction to the issue's / audit's "hide on iframe `load` event" claim

Issue #13's AC and the older `widgets/docs/audit-hud01-06.md` both describe
the RECONNECTING overlay as "hidden on iframe `load` event … JS detects
iframe load". **This is stale for both lineages.** There is no `load`
listener anywhere in `blogger-hud03-template.js` (130 lines: only `click`
and `transitionend` listeners) — re-confirmed directly against this actual
migration source, not assumed from the panel-lineage finding. This package
implements the real mechanism (CSS keyed off `src`), not the audit's
inaccurate description. `tests/e2e/css-renderer-hud-04.spec.ts` asserts the
actual `src`-keyed opacity behavior.

## Isolation (Contract §15.1/§15.3)

`isolation: "shadow-dom-preferred"`, following #10's precedent
(`docs/adr/0003-css-renderer-isolation.md`). Verified empirically, not
assumed, for this Theme's own CSS: `tests/e2e/css-renderer-hud-04.spec.ts`
mounts the real `hud-04` package through the real `CssRenderer` in a real
headless Chromium and asserts, live inside the Shadow DOM `CssRenderer`
attaches:

- `clip-path` (the frame-shell / frame-inner / mini-card polygon cuts) renders as authored;
- `filter: drop-shadow(...)` (the frame glow) renders as authored;
- `transform: skewX(...)` (the frame-loader segments) renders as authored;
- `transform: scale(...)` (the mini-card's scaled-down video preview) renders as authored;
- `float: left` (the media/text wrap) lays out as authored;
- no Theme-authored `body`/`html`/`:root`/bare-`*` rule exists anywhere in
  this package's CSS for leakage to escape through in the first place (same
  no-host-wide-selector discipline as fixture-css-hud), so the isolation
  guarantee rests on Shadow DOM's selector boundary by construction.

Result: **Shadow DOM held** — no `shadow-dom-fallback` deviation is
recorded. `CssRenderer`'s scoped-root fallback path (exercised generically by
#10's own unit tests) remains available if a future environment lacks
`attachShadow`, but is not this Theme's expected runtime path.

## Behavioral diffs vs. the real blogger-lineage HUD-04 material

All of these are **intentional, Contract-driven** changes, not regressions —
called out explicitly per the issue's "document any diff" AC:

1. **No Theme-authored JavaScript (`scripts: []`).** The real
   `blogger-hud03-template.js` (130 lines, shared by every panel on the
   page) drives only the mini/expand toggle (`NcHudMini`) — `click` and
   `transitionend` listeners, no `MutationObserver`, and (per
   `heygen-version.html`'s own inline init call) **no iframe pause/resume
   wiring at all** for this specific example; the module supports
   `onCollapse`/`onExpand` callbacks generically, but this example doesn't
   use them. (The *separate*, panel-lineage `widgets/panels/hud-04/hud-04.js`
   does wire iframe pause/resume through a `MutationObserver` — and leaks it,
   Inventory §1.33/§1.35, "never `.disconnect()`ed".) In the Contract model,
   the toggle is replaced by `Hud.setVariant()` mounting a distinct
   composition directly (Contract §7.5 — no "load mini then expand" flash),
   and pause/resume is replaced by `CssRenderer`'s generic, built-in
   `mediaEmbed` `src-swap` extension point, disconnected in `destroy()`
   (Contract §17.1-§17.2, verified in `tests/unit/css-renderer-hud-04-e2e.test.js`).
   Net effect: this package is the first HUD-04 material — either lineage —
   to actually pause the embed while collapsed *without* leaking an observer.

2. **One embedded iframe per mounted instance, not two.** The real widget
   keeps both the main-panel iframe and (when a post chooses the live-preview
   mini-card style) a mini-card iframe simultaneously in the DOM, toggled
   client-side. In the Contract model `maxi`/`mini`/`micro` are separate,
   mutually exclusive **mounted compositions**, so there is naturally only
   ever one embedded iframe live per instance.

3. **`mini`'s media area uses the live-video-preview style, not the shipped
   example's static-thumbnail style.** `heygen-version.html`'s own mini-card
   uses a plain `<img class="nc-hp-mini-thumb">` (a separate, hand-supplied
   `THUMB_URL` distinct from the video URL). `blogger-hud03-template.css`
   also ships an alternative, already-authored "Live video thumbnail" style
   for the mini-card (`.nc-hp-mini-video-wrap`, lines 720-738) that the
   shipped example simply didn't choose for this post. This package uses
   that alternative: `CssRenderer`'s `mediaEmbed` capability drives the
   standard `media` slot uniformly across every composition once declared
   (`#applySlot` in `CssRenderer.ts` isn't composition-aware) — only `media`
   (→ iframe) and `content` get special handling in the generic slot path,
   so a plain `<img src>` can't be set through it the way `.nc-hp-mini-thumb`
   would need. The live-video variant keeps the mini card's media genuinely
   driven by the same consumer-supplied URL as `maxi`, rather than an
   unconfigurable placeholder image.

4. **`mini`'s video preview is parked at `about:blank`, not live.** A direct
   consequence of item 3 combined with Contract §10.5's own `src-swap`
   description ("parks a hidden iframe at `about:blank` and restores `src`
   on expand" = `maxi` only) — accepted as a Contract-driven compromise
   (reproducing a permanently-live secondary iframe would mean bypassing the
   shared `mediaEmbed` extension point for a Theme-specific one, out of this
   Story's scope: `CssRenderer.ts` is frozen), not a bug.

5. **RECONNECTING… overlay: real (dormant) mechanism made to actually work,
   audit's stale "load event" description corrected.** See "mediaEmbed
   wiring" above.

6. **`.nc-hud-media`/`.nc-hp-text` are DOM siblings, not parent/child.** The
   real markup nests the floated media block *inside* the text block purely
   so `display: flow-root` (a clearfix) on the text block contains its
   floated child. Contract §9 requires `media` and `content` to be
   independently addressable slots — nesting them would mean every
   `setData({ content })` call (which sets `innerHTML`, Contract §9.3) wipes
   out the media slot's DOM. This package makes them siblings under a shared
   `.nc-hp-content` parent instead (media first, so normal float-wrap still
   applies to the following text sibling) and moves the clearfix up to
   `.nc-hp-content`. Visually identical — CSS float-wrap does not require DOM
   nesting, only float-then-sibling order in the same non-BFC flow.

7. **Shared keyframes are Theme-local, not global-named.** The real source
   is genuinely self-contained (all keyframes defined in
   `blogger-hud03-template.css` itself — there is no separate "shared base"
   file this lineage depends on). This package keeps that self-containment
   but renames the keyframes (`hud04Breath`, `hud04PanelSweep`,
   `hud04TickerScroll`, `hud04OpenHud`, `hud04Loader1..8`) to avoid a future
   cross-bundle collision if this platform's not-yet-implemented
   shared-foundation "base" injection (`src/runtime/core/ThemeResolver.ts:138`)
   is added later and defines the bare global names itself (Contract §15.6).
   `manifest.animations` is left undeclared since nothing here is sourced
   from an external base. **The keyframe bodies themselves are copied
   verbatim from the real source** — an improvement over this package's
   first (panel-lineage) draft, which had to approximate `hudBreath`/
   `hudPanelSweep`/`hudTickerScroll` because that lineage's copies live in a
   separate file this Story never needed to read once sourced from here.

8. **Google Fonts is actually loaded, not just referenced.** The real
   source `@import`s "Share Tech Mono" directly in its CSS
   (`blogger-hud03-template.css:14`); this package ports that `@import`
   verbatim into `styles/shared.css`. This is real page-load external I/O
   to an allowlisted host (Contract §16.2), so `manifest.knownDeviations`
   carries `external-io-on-mount` (§16.3) and `manifest.externalResources`
   declares `fonts.googleapis.com`/`fonts.gstatic.com`. Falls back to the
   monospace stack if blocked, same as the source.

9. **No toggle button, no client-side collapse/expand.** `Hud.setVariant()`
   replaces `NcHudMini`'s button/click/transition machinery entirely (see
   item 1). `.nc-hp-system-row` (the toggle button's anchor point) is kept
   as a layout wrapper around the `subtitle` label alone, since its
   positioning was tuned together with the label's own offset against the
   real rendered layout — dropping the wrapper risked silently
   reintroducing a line-height/position bug the real source's comments
   describe fixing.

10. **No standalone-page chrome, no multi-panel row layout.** Page-level
    wrappers (`heygen-version.html`'s `<style>` block that only exists to
    tweak that one demo post's mini-card) and the release's `.nc-hud-row`
    multi-panel-row CSS are not part of the reusable widget and are out of
    this Story's scope (issue: "a multi-instance-per-page refactor").

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
