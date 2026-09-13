# fixture-svg-hud

A minimal, schema-valid `engine: "svg"` fixture Theme. It exists to prove
`SvgRenderer` end-to-end (Story #9 AC), **not** as a real HUD or a template
to copy verbatim for a production Theme -- packaging the real HUD-01/HUD-02
is #11/#12's job.

- `id: "fixture-svg-hud"` -- deliberately not one of the reserved `hud-NN`
  baseline IDs (Contract 1.0 §4.1); those belong to Stories **#11-#15**.
- `engine: "svg"`; `isolation: "scoped-root"` (required in 1.0 for an
  `svg`-engine Theme declaring `skyViewer`/`dataSource`, Contract §27.8 rule
  9 -- also the correct choice per Contract §15.2 regardless, since this
  fixture's `maxi:landscape` composition injects a `document.head` resource
  on demand, same as HUD-01/HUD-02).
- `overflowVisible: true` -- `maxi:landscape`'s inline `<svg>` carries a
  4-layer coincident-path "glow runner" loosely modelled on HUD-01/HUD-02's
  contour-glow animation (Inv §1.7, §1.15), which paints outside its own box
  and needs `overflow: visible` end to end (Contract §15.5).
- `capabilities.skyViewer: true` + `capabilities.dataSource` (provider
  `simbad`) -- proves the renderer's **lazy** external-resource hook
  (`SvgRenderer#requestExternalResource`, wired to the "SKY VIEWER" button
  in `maxi/landscape/hud.js`): the resource loads only on demand, never at
  mount. This fixture never contacts a real Aladin/SIMBAD endpoint --
  `hud.js`'s click handler and this Theme exist only to exercise the hook's
  shape; a real integration is #11/#12's job.
- `capabilities.htmlSlot: true` + `content` slot -- proves script-stripped
  HTML-fragment injection (Contract §9.3).
- Ships the three 1.0-required compositions (`maxi:landscape`,
  `mini:landscape`, `micro:portrait`). `maxi:portrait`, `mini:portrait`,
  `micro:landscape` are declared unsupported with a `reason`, per Contract
  §3.9 / §8.2. `mini:landscape` and `micro:portrait` are deliberately
  authored (not a mechanical `transform: scale()` of `maxi`) at reduced
  detail, per Contract §7.3's "not a scale factor" rule -- the exact gap the
  inventory flagged against the real HUD-01/HUD-02 baseline (Inv §1.9).

Validated by `tests/unit/svg-fixture-theme.test.js` (schema + semantic
checks, matching the Story #5 `fixture-hud` pattern) and mounted end-to-end
through `Hud` + `SvgRenderer` by `tests/unit/svg-fixture-e2e.test.js` and
`tests/e2e/svg-renderer.spec.ts` (Playwright).
