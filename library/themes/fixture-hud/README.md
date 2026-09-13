# fixture-hud

A minimal, schema-valid fixture Theme. It exists to prove the
`library/themes/<id>/` directory shape and manifest schema conformance
(Story #5 AC), **not** as a real HUD or a template to copy verbatim for a
production Theme.

- `id: "fixture-hud"` — deliberately not one of the reserved `hud-NN`
  baseline IDs (Contract 1.0 §4.1); those belong to Stories **#11–#15**.
- No consumer-specific coupling: no `dataSource`, `skyViewer`, `mediaEmbed`,
  or `modes` capability; no `externalResources`.
- `engine: "css"`; `isolation: "scoped-root"`.
- Ships the three 1.0-required compositions (`maxi:landscape`,
  `mini:landscape`, `micro:portrait`) with trivial placeholder `.html`
  markup fragments — no real styling or scripts. `maxi:portrait`,
  `mini:portrait`, `micro:landscape` are declared unsupported with a
  `reason`, per Contract §3.9 / §8.2.

Validated by `tests/unit/library-fixture-theme.test.js` against
`registry/schemas/manifest.schema.json`.
