/**
 * Runtime package entry point, bundled by `scripts/build/build.mjs` into
 * `dist/runtime/index.js` (Plan §2 decision 1, §3).
 *
 * Story #5 scaffolds the build pipeline only. The real Runtime
 * (`src/runtime/core/`, `registry/`, `contract/`) does not exist yet (#8),
 * so this entry re-exports only what Story #5 itself ships: the renderer
 * lifecycle contract and the reserved-engine stubs. As #8/#9/#10 land, their
 * exports are added here -- the bundler wiring itself does not need to
 * change.
 */
export * from "./renderers/index.js";
