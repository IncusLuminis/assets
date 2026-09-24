# src/runtime/adapters/

The `<nebula-hud>` Web Component adapter (Architecture §26, §51; Plan §2
decision 10; originally slated for Platform "0.2" -- pulled forward into
Phase 1 as its own parallel track once the owner's toggle-button
requirement made it load-bearing; see
`docs/planning/hud-platform-phase1-phase2-scoping.md` §A.1/§A.1.1).

Populated by **Story #46** (`nebula-hud.ts`): a Custom Element,
`customElements.define("nebula-hud", NebulaHud)`, built entirely on the
existing, **unmodified** Platform 0.1 imperative `new Hud(...)` consumer API
(Contract §14) -- `mount`/`setData`/`setVariant`/`destroy`/`onError`. No
Contract, `Hud`, `ThemeResolver`, `ThemeSource`, `RendererRegistry`, or
renderer change was made or is needed; this directory is purely a consumer
layered on top, the same shape as the HUD Playground's own bootstrap code,
packaged as a reusable element.

## Why a wrapper element, not a Theme-rendered toggle

HUD Theme Contract 1.0 §7.2 is frozen: "A `maxi` composition MUST render
fully expanded with no collapse toggle and no `is-mini` state." The owner's
real requirement -- a site owner drops in one embed snippet and gets a
working top-left expand/collapse toggle with zero extra JS -- is satisfied
without touching that freeze: the *element* owns the toggle-button chrome
and calls `hud.setVariant()`; the *Theme* itself never renders a toggle and
never knows why it's being resized. See `nebula-hud.ts`'s own docstring for
the full design writeup (attributes, Shadow DOM choice, the toggle-button
compliance note).

## Scope: `inline` mode only (Story B1)

This Story implements **`inline` expand mode only**: no fixed height on the
mount container, the same `Hud` instance switches variant in place via
`setVariant()`, and the surrounding page reflows around it as it
grows/shrinks -- exactly like the real legacy `.nc-ol-widget` widget already
in production, or a native `<details>` element. There is no backdrop, no
overlay, and no second `Hud` instance.

**`modal` mode is not yet implemented.** It is the right choice for a HUD
sitting in a spatially fixed layout with no reflow room around it (e.g. a
`micro` instrument gauge among other fixed instruments on a cockpit-style
layout) -- there, the small instance stays untouched and a *second*,
independent `Hud` instance mounts into a dimmed overlay on toggle-open, seeded
via a snapshot-at-open `setData()` call, then `destroy()`s on close. This is
explicitly out of scope for Story #46 and is tracked separately as its own
follow-up Story once scheduled (owner-sequenced: inline first, modal
second, per the scoping doc's resolved open question #8).

## Files

- `nebula-hud.ts` -- the `<nebula-hud>` Custom Element itself. Read its own
  docstring for: the full attribute list (`theme`, `version`, `orientation`,
  `variant` naming the *collapsed* state, `cdn-base-url`, `data`), the `.data`
  JS property as the richer alternative to the `data` attribute, why it uses
  a Shadow Root for its own chrome, the toggle-button DOM-placement
  compliance note (never a descendant of the mounted Theme's own
  `[data-hud-theme]` scoped root -- Contract §7.2's spirit, enforced
  structurally plus a regression test), and the `.themeSource`/
  `.rendererRegistry` test/advanced-embedding seam mirroring `Hud`'s own
  `HudDependencies`.
- `index.ts` -- re-exports `NebulaHud`/`DEFAULT_CDN_BASE_URL`; importing it
  (or the main `dist/runtime/index.js` bundle, which re-exports this module)
  self-registers the custom element as a side effect, so a real consumer
  needs nothing beyond `<script type="module" src=".../dist/runtime/index.js">`
  plus a `<nebula-hud theme="..." ...>` tag.

See `examples/nebula-hud-inline/index.html` for a real, hands-on-verified
usage example (mounts `hud-03` at `mini`, toggles to `maxi`, with page
content above/below it so the reflow is visible), and
`tests/unit/nebula-hud.test.js` for the automated coverage, including the
compliance-trap regression test.
