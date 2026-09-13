# src/runtime/core/

Reserved for the HUD Runtime's core: `Hud.ts` (the consumer-facing class,
Contract §14), `ThemeLoader.ts` (fetches/resolves a Theme package and
manifest), `ThemeResolver.ts` (Registry lookup + version/variant/orientation
resolution, Contract §12), and `Lifecycle.ts` (drives the renderer lifecycle
in `../renderers/`, enforcing the Contract §6.7 ordering guarantees).

Deliberately empty in Story #5 (repo scaffold only). Populated by Story **#8**
(Runtime logic), which is explicitly out of this Story's scope.
