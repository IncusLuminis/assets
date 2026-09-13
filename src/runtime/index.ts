/**
 * Runtime package entry point, bundled by `scripts/build/build.mjs` into
 * `dist/runtime/index.js` (Plan §2 decision 1, §3).
 *
 * Story #5 scaffolded the build pipeline and the renderer lifecycle contract
 * + reserved-engine stubs. Story #8 adds the real Runtime: the TS mirror of
 * the Contract (`contract/`) and the consumer-facing `Hud` class + Theme
 * resolution (`core/`). `registry/` (a Registry/CDN-backed `ThemeSource`) is
 * #1/#16's job and stays unexported until it lands -- swapping one in needs
 * no change here. As #9/#10 land, they register their renderers on a
 * `RendererRegistry` (see `core/RendererRegistry.ts`) rather than adding new
 * exports to this file.
 */
export * from "./renderers/index.js";
export * from "./contract/index.js";
export * from "./core/index.js";
