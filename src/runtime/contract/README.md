# src/runtime/contract/

TypeScript mirror of the HUD Theme Contract 1.0's data shapes, populated by
Story #8 on top of Story #5's scaffold:

- `manifest.ts` — the `Manifest` type (Contract §3.1's field table), kept in
  sync with `registry/schemas/manifest.schema.json`.
- `slots.ts` — the standard slot vocabulary (Contract §9.2) + custom-slot
  and slot-declaration shapes.
- `variants.ts` — `maxi`/`mini`/`micro` + `landscape`/`portrait` types,
  `CompositionKey`, and the `compositionKey()`/`isVariant()`/`isOrientation()`
  helpers (Contract §7–§8).
- `errors.ts` — the full Contract §20 error model as typed classes, using
  the Contract's §20.1 names verbatim (including `RatioUnsupported`, kept
  under that name for traceability per the Contract's own note).
  `RendererUnsupportedError` stays in `../renderers/` (Story #5) and is
  reused as-is — see `errors.ts`'s docstring.
- `validateManifest.ts` — the Runtime's Contract §12 step-5 manifest
  validation (a hand-written structural check, not a second ajv pass — see
  its docstring for why).
- `types.ts` — remaining shared primitives (`HudData`); the renderer
  lifecycle types live in `../renderers/RendererInterface.ts` and are used
  directly from there.

Consumed by `../core/` (`Hud`, `ThemeResolver`).
