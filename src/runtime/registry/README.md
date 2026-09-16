# src/runtime/registry/

The Runtime-side `ThemeSource` that fetches `registry/index.json`
(discovery metadata) and resolves a Theme `id` + `version` to a published
package URL (Architecture §27-29, Contract §12): `RegistryThemeSource.ts`
(not `RegistryClient.ts` as originally reserved here in Story #5 -- it
implements the `ThemeSource` interface from `../core/ThemeSource.ts`
directly, so it's named to match that convention rather than standing alone
as a bare "client").

Deliberately empty in Story #5 (repo scaffold only). Populated by Story
**#16** (this README previously said "#8" -- that was stale even before
#16 landed; #8 built `Hud`/`ThemeResolver`/`RendererRegistry`, not this).
Registry *index generation* (the build-side tooling that produces
`registry/index.json`) is a separate concern -- Story **#1** -- and lives
under `scripts/build/`, not here.
