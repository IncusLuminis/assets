# fixture-css-hud

A minimal, schema-valid `engine: "css"` fixture Theme. It exists to prove
`CssRenderer` (Story #10) end-to-end -- isolation, semantic data injection,
`capabilities.mediaEmbed`, teardown -- **not** as a real HUD or a template to
copy verbatim for a production Theme (that's #13/#15's job, migrating
`widgets/panels/hud-03/` / `hud-04/`).

- `id: "fixture-css-hud"` — deliberately not one of the reserved `hud-NN`
  baseline IDs (Contract 1.0 §4.1); those belong to Stories **#11–#15**.
- `engine: "css"`; `isolation: "shadow-dom-preferred"` — `CssRenderer` keeps
  Shadow DOM for this Theme (see `docs/adr/0003-css-renderer-isolation.md`).
- `capabilities.htmlSlot: true` (the `content` slot accepts consumer HTML,
  Contract §9.3) and `capabilities.mediaEmbed` (`app.heygen.com`,
  `lifecycle: "src-swap"`, Contract §10.5) — proves the media-embed extension
  point without a real HeyGen integration (out of this Story's scope).
- Frame mechanism loosely modelled on the real HUD-03/HUD-04
  (`widgets/panels/hud-03/`, `widgets/panels/hud-04/`): a CSS `clip-path`
  frame + `filter: drop-shadow()` glow (`overflowVisible: true`) and a
  `float:left` media block the body content wraps around — simplified to one
  frame layer, no animation/ticker/loader.
- Ships the three 1.0-required compositions (`maxi:landscape`,
  `mini:landscape`, `micro:portrait`); `maxi:portrait`, `mini:portrait`,
  `micro:landscape` are declared unsupported with a `reason`, per Contract
  §3.9 / §8.2. `mini:landscape` is a genuinely distinct lower-density
  composition (not a scaled `maxi` clone), matching the real HUD-03's
  `.nc-hp-mini-card` (Inventory §1.26).
- Slots: `title` (required), `subtitle` / `media` / `content` / `footer`
  (optional) — bound via `data-slot="..."` attributes in each composition's
  `hud.html`, per Contract §9 (no `nc-hp-*` internals exposed).

Validated by `tests/unit/library-fixture-css-theme.test.js` against
`registry/schemas/manifest.schema.json` + this repo's semantic layer, and
mounted/torn down end-to-end through `Hud` by
`tests/unit/css-renderer.test.js` and `tests/e2e/css-renderer.spec.ts`
(Playwright).
