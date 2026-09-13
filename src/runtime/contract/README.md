# src/runtime/contract/

Reserved for the TypeScript mirror of the HUD Theme Contract 1.0's data
shapes: `manifest.ts` (the `manifest.json` type, kept in sync with
`registry/schemas/manifest.schema.json`), `slots.ts` (the standard slot
vocabulary, Contract §9), `variants.ts` (`maxi`/`mini`/`micro` + orientation
types, Contract §7–§8), and `types.ts` (shared primitives, including the full
Contract §20 error-code union — `RendererUnsupportedError` in
`../renderers/` is deliberately the *only* error type implemented ahead of
this).

Deliberately empty in Story #5 (repo scaffold only). Populated by Story
**#8** (Runtime logic).
