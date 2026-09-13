# src/runtime/renderers/

Renderer implementations for the HUD Runtime, one per `engine` value in the
manifest schema's closed enum (HUD Theme Contract 1.0 §5.1).

## What's here now (Story #5)

- `RendererInterface.ts` — the internal Runtime↔renderer lifecycle contract
  (`mount`/`setData`/`resize`/`setVariant`/`destroy`, Contract §6). Type-only;
  no logic.
- `RendererUnsupportedError.ts` — the typed error (`RendererUnsupported`,
  Contract §20.1) the reserved-engine stubs throw.
- `ReservedEngineRenderer.ts` — shared abstract base for the three
  reserved-but-unsupported stubs: every lifecycle method that does work
  (`mount`, `setData`, `resize`, `setVariant`) throws
  `RendererUnsupportedError` unconditionally — **`destroy()` is the one
  exception and is a non-throwing, idempotent no-op**, per Contract §6.6
  ("`destroy()` MUST NOT throw, even if `mount` never completed or
  failed"). Factored out once rather than duplicated three times, so the
  three stubs can't drift out of sync with each other or with §6.6.
- `VideoRenderer.ts`, `StaticRenderer.ts`, `GadgetRenderer.ts` — one-line
  subclasses of `ReservedEngineRenderer` naming which `engine` value each
  represents (Contract §5.2). These exist so a manifest declaring
  `engine: "video"|"static"|"gadget"` is schema-valid and Registry-listable
  ahead of Runtime support — not because Platform 0.1 renders them.

## Story #10: `CssRenderer.ts`

- `CssRenderer.ts` — the real `engine: "css"` renderer (Contract §5.4),
  HUD-03/HUD-04's family. Attempts Shadow DOM per `manifest.isolation`
  (`shadow-dom` / `shadow-dom-preferred`), falls back to a scoped-root +
  class-prefixed wrapper otherwise — see the file's own docstring and
  `docs/adr/0003-css-renderer-isolation.md` for the investigation and
  decision. Semantic data binds through `[data-slot]` elements (Contract §9),
  `capabilities.mediaEmbed` wires a validated-host `<iframe>` into the
  `media` slot (§10.5), and a `MutationObserver` (disconnected in
  `destroy()`) implements the HUD-04-style `"src-swap"` lifecycle. Register
  it the same way the module docstring documents:

  ```ts
  registry.register("css", () => new CssRenderer());
  ```

## What's coming later (not this Story)

- `SvgRenderer.ts` (HUD-01/02/10) — the other **supported** 1.0 engine
  (Contract §5.3). Story **#9**, developed in parallel with this one; not
  touched here.
- The Runtime code that actually selects and drives a renderer
  (`ThemeLoader`/`Lifecycle` in `src/runtime/core/`) is Story **#8**
  (merged ahead of this Story).
