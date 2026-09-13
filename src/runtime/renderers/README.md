# src/runtime/renderers/

Renderer implementations for the HUD Runtime, one per `engine` value in the
manifest schema's closed enum (HUD Theme Contract 1.0 §5.1).

## What's here now (Story #5)

- `RendererInterface.ts` — the internal Runtime↔renderer lifecycle contract
  (`mount`/`setData`/`resize`/`setVariant`/`destroy`, Contract §6). Type-only;
  no logic.
- `RendererUnsupportedError.ts` — the typed error (`RendererUnsupported`,
  Contract §20.1) the reserved-engine stubs throw.
- `VideoRenderer.ts`, `StaticRenderer.ts`, `GadgetRenderer.ts` — stubs for the
  three **reserved-but-unsupported** `engine` values (Contract §5.2). Every
  lifecycle method that does work (`mount`, `setData`, `resize`,
  `setVariant`) throws `RendererUnsupportedError` unconditionally —
  **`destroy()` is the one exception and is a non-throwing no-op**, per
  Contract §6.6 ("`destroy()` MUST NOT throw, even if `mount` never
  completed or failed"). These stubs exist so a manifest declaring
  `engine: "video"|"static"|"gadget"` is schema-valid and Registry-listable
  ahead of Runtime support — not because Platform 0.1 renders them.

## What's coming later (not this Story)

- `SvgRenderer.ts` (HUD-01/02/10) and `CssRenderer.ts` (HUD-03/04) — the two
  **supported** 1.0 engines (Contract §5.3–§5.4). These are Story **#9** and
  **#10** respectively. Do not add real rendering logic here ahead of those
  Stories.
- The Runtime code that actually selects and drives a renderer
  (`ThemeLoader`/`Lifecycle` in `src/runtime/core/`) is Story **#8**.
