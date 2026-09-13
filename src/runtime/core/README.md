# src/runtime/core/

The HUD Runtime's core, populated by Story #8 on top of Story #5's scaffold:

- `Hud.ts` — the consumer-facing class (Contract §14): `new
  Hud({theme, version, variant, orientation, config})` + `mount(el)` +
  `setData(data)` + `resize(viewport?)` + `setVariant(variant)` +
  `destroy()` + `onError(callback)`. Carries no application/domain logic
  (Arch §23) — see its docstring for the documented interpretations around
  `onError()` and the second, dependency-injection constructor argument.
- `ThemeResolver.ts` — implements Contract §12's resolution flow (steps
  2–10): requested version → manifest fetch → validation →
  Contract-compatibility → renderer selection → base check → variant/
  orientation → composition. Steps 11–12 (resource loading, `renderer.
  mount()`) are the renderer's own job, driven from `Hud.mount()`.
- `ThemeSource.ts` — the seam a Theme's manifest is fetched through
  (Contract §12 steps 2–4). No concrete Registry/CDN-backed implementation
  ships here — that's #1/#16's job; this repo's own tests use a filesystem-
  backed one (`tests/helpers/file-system-theme-source.js`).
- `RendererRegistry.ts` — the Contract §12 step-7 extension point mapping
  `manifest.engine` to a renderer instance. Pre-registers Story #5's
  `video`/`static`/`gadget` stubs; `svg`/`css` are left open for #9/#10 to
  register without touching `Hud.ts`/`ThemeResolver.ts`.

`Lifecycle.ts` (Architecture §24's illustrative name for driving the
renderer lifecycle's ordering guarantees, Contract §6.7) is folded into
`Hud.ts` rather than split into its own file in 0.1 — the ordering rules are
few enough (queue-before-mount, serialise `setVariant`, never call after
`destroy`) that a separate class would mostly forward to `Hud`'s own state.
