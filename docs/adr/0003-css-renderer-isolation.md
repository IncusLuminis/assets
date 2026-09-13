# ADR-0003: CssRenderer isolation -- Shadow DOM kept for the CSS Theme family

- Status: Accepted
- Date: 2026-09-13
- Deciders: Coder (Story #10)
- Related: `docs/architecture/HUD_Theme_Contract_1.0.md` §5.4, §15 (esp. §15.1,
  §15.3), §17; `docs/architecture/HUD_Platform_Architecture.md` §17, §41-42;
  `docs/architecture/HUD_Platform_Implementation_Plan_0.1.md` §2 decision 8;
  `docs/architecture/HUD_Platform_Inventory_0.1.md` §1.20-§1.36 (HUD-03/04);
  Story #10, Epic #20, board `IncusLuminis/projects/7`
- Supersedes: none
- Depends on: ADR-0001 (HUD Theme Contract 1.0), ADR-0002 (repo layout),
  Story #8's merged Runtime (`RendererRegistry`, `Hud`, the `errors.ts` model)

## Context

Contract §15.3 and Implementation Plan §2 decision 8 require that, for the
`css`-engine Theme family (HUD-03/HUD-04), the choice between Shadow DOM
(`isolation: "shadow-dom-preferred"`) and the scoped-root baseline
(`isolation: "scoped-root"`) be **validated, not assumed**: "the renderer MAY
attempt Shadow DOM ... and MUST keep it only if, in validation, the legacy
`clip-path` frame, `filter: drop-shadow()` glow and `float` layout all
survive the shadow boundary visually. Otherwise it MUST fall back to
`scoped-root` and record `knownDeviations: shadow-dom-fallback`." Issue #10's
AC restates this as a hard requirement with its own deliverable: the outcome
recorded in a committed ADR (this document).

This repo's only test harness before this Story was jsdom (Vitest,
`environment: "jsdom"` per-file). jsdom's CSS engine is known to have gaps;
the open question was whether jsdom alone could give a trustworthy signal
either way, or whether a real browser was needed.

## Investigation

Three experiments, run directly against this repo's actual dependency
versions (jsdom `^30.0.1` via `npm install`, and a real headless Chromium via
`@playwright/test`, already cached on this machine) before writing any
renderer code:

**1. jsdom, light DOM (control).** A `<style>` in `<head>` with
`clip-path: polygon(...)`, `filter: drop-shadow(...)`, `box-shadow: ...` on a
plain `<div class="frame">` in the document body. `getComputedStyle(frame)`
correctly returned all three properties as authored. jsdom's CSS engine
handles these properties in light DOM.

**2. jsdom, inside a Shadow DOM.** The *identical* CSS, placed in a
`<style>` appended to a `shadowRoot` instead of `<head>`, targeting a
`.frame` element also inside the shadow tree. `getComputedStyle(frame)` came
back empty/`"none"` for all three properties -- jsdom does not compute
styles for `<style>` elements placed inside a shadow root at all, in this
jsdom version. This is a known jsdom limitation (its CSS cascade
implementation does not fully participate in Shadow DOM style scoping),
**not** evidence that the properties themselves are incompatible with Shadow
DOM -- experiment 1 already proves jsdom computes them correctly wherever it
does compute them.

Separately, in the same jsdom Shadow DOM setup, a `body { background: red
!important }` rule authored *inside* the shadow tree's `<style>` had zero
effect on `document.body`'s own computed background (set to a distinctive
value before mounting). This positive signal jsdom *can* give: Shadow DOM's
selector-matching boundary itself works in jsdom, even though its style
*computation* inside the shadow tree does not.

**3. Real browser (Playwright, headless Chromium), inside a Shadow DOM.**
The same CSS (`clip-path`, `filter: drop-shadow()`, `box-shadow`) placed in a
`<style>` inside a real `shadowRoot`, on a `.frame` element inside it, with a
`body { background: red !important }` rule in the same shadow-scoped
`<style>` and a distinctive pre-set `document.body` background outside it.
Result:

```json
{
  "clipPath": "polygon(0px 0px, 100% 0px, 100% 100%, 0px 100%)",
  "filter": "drop-shadow(rgba(0, 0, 0, 0.5) 2px 2px 3px)",
  "boxShadow": "rgb(0, 255, 0) 0px 0px 10px 0px",
  "bodyBg": "rgba(0, 0, 0, 0)"
}
```

All three CSS properties rendered inside the Shadow DOM exactly as authored
(matching the light-DOM control), and the shadow-scoped `body{}` rule had
**zero** effect on the real host document's `<body>` background.

## Decision

**Keep Shadow DOM.** `library/themes/fixture-css-hud/manifest.json` declares
`isolation: "shadow-dom-preferred"`, and `CssRenderer` genuinely uses
`element.attachShadow({ mode: "open" })` for it at runtime -- in every
environment this renderer actually runs in (real browsers, and this repo's
own jsdom/Playwright test suites, both of which implement `attachShadow`),
Shadow DOM is attempted and kept; `knownDeviations: shadow-dom-fallback` is
**not** recorded for this Theme.

Reasoning:

- `clip-path`, `filter: drop-shadow()`, `box-shadow`, and `float` (the four
  mechanisms HUD-03/HUD-04 actually depend on, per Inventory §1.21/§1.28/
  §1.31) are standard, per-element CSS paint/layout properties computed
  through the normal cascade. Nothing in the CSS Shadow Parts / Shadow Tree
  styling spec treats them differently from any other computed-style
  property -- unlike constructs with **documented** Shadow DOM interaction
  rules (`::slotted()`/`::part()` selector restrictions, `:host()` context
  rules, cross-boundary combinators like a light-DOM `::first-line` reaching
  into shadow content, or a `@font-face`/custom-property *inheriting into* a
  shadow tree from outside it). Experiment 3, in a real engine, confirms this
  empirically for exactly the properties this Theme family needs.
- The one thing that could have forced a fallback -- a Theme-authored
  `body`/`html`/`:root`/bare-`*` rule leaking out through Shadow DOM -- was
  also directly tested in a real browser (experiment 3) and in jsdom
  (experiment 2's boundary check) and does not happen; Shadow DOM's
  selector-matching boundary prevents it by construction, independent of
  jsdom's separate style-computation gap.
- jsdom's failure to compute styles *inside* a shadow root (experiment 2) is
  a test-harness limitation of this specific jsdom version, isolated and
  reproduced in a throwaway script before any renderer code existed -- it is
  not something a 1.0 Runtime (which is always a real browser) will ever hit.
  Relying on it as if it were real-engine evidence would have been the wrong
  conclusion from a tooling gap.

**Consequence for `CssRenderer.ts`'s own code:** the scoped-root +
class-prefixing fallback (Contract §15.1's baseline mechanism) is still
implemented and unit-tested (`tests/unit/css-renderer-isolation.test.js`,
by stubbing `container.attachShadow` to force the branch) -- both because
Contract §15.3 requires `shadow-dom-preferred` to have *some* fallback path
(an environment without `attachShadow` is a legitimate, if unlikely, target)
and because a different, future Theme might declare `isolation:
"scoped-root"` outright. It is not fixture-css-hud's expected runtime path.

## Consequences

### Positive

- fixture-css-hud gets Shadow DOM's isolation guarantees "for free" and by
  construction -- the no-leak test for the Shadow DOM path
  (`tests/unit/css-renderer-isolation.test.js`, `tests/e2e/css-renderer.spec.ts`)
  does not depend on the Theme's CSS text being well-behaved; it would pass
  even if the Theme *did* ship a `body{}` rule.
- The decision and its evidence are reproducible and falsifiable: the three
  experiments above are captured as inline scripts in this Story's Vitest
  suite (`tests/unit/css-renderer-isolation.test.js`, real jsdom) and
  `tests/e2e/css-renderer.spec.ts` (real Chromium via Playwright), not just
  asserted in prose here.
- Future `css`-engine Themes (#13/#15's HUD-03/HUD-04 migration) have a
  concrete precedent and a tested renderer path for `shadow-dom-preferred`,
  rather than having to re-derive whether Shadow DOM is viable for this
  family from scratch.

### Negative

- The scoped-root fallback path is exercised only by a forced
  (`attachShadow` stubbed out) unit test, never by fixture-css-hud's real
  manifest -- if a future `css`-engine Theme's CSS genuinely cannot survive
  Shadow DOM (e.g. it needs a light-DOM-only mechanism like Aladin's
  `document.head` injection, per Contract §15.2's reasoning for HUD-01/02),
  that Theme would need its own investigation; this ADR's "keep Shadow DOM"
  conclusion is scoped to the clip-path/drop-shadow/float mechanism actually
  tested, not to every possible `css`-engine Theme.
- jsdom's inability to compute styles inside a shadow root (experiment 2)
  means this repo's fast unit-test suite cannot, by itself, catch a
  regression where a Theme's clip-path/drop-shadow silently stops rendering
  correctly inside Shadow DOM in a real browser -- that guarantee rests on
  `tests/e2e/css-renderer.spec.ts` (Playwright) actually being run, not on
  the jsdom suite alone. Flagged in the Story's own report; not blocking,
  since Playwright is used here specifically to cover this gap.

### Neutral / follow-ups

- If a future `css`-engine Theme (#13/#15) needs `document.head` injection
  or other light-DOM-only external-resource behaviour (mirroring §15.2's
  Aladin reasoning for `svg`), it should declare `isolation: "scoped-root"`
  directly rather than relying on a `shadow-dom-preferred` fallback --
  `CssRenderer`'s scoped-root path is already the correct, tested target for
  that, not a degraded mode.
- Should a later jsdom release add real Shadow DOM style computation, the
  jsdom-side no-leak/isolation tests in `tests/unit/css-renderer-isolation.test.js`
  could be extended to assert the CSS-property survival claim directly
  (today that assertion lives only in the Playwright suite); not required
  now.
