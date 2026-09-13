/**
 * Shared primitives used across `contract/` and `core/`.
 *
 * The renderer lifecycle types (`RendererLifecycle`, `MountContext`,
 * `Viewport`) are Story #5's `../renderers/RendererInterface.ts` -- the
 * Runtime<->renderer boundary (Contract §6). They are deliberately not
 * re-exported from this module (or from `contract/index.ts`): `renderers/
 * index.ts` already exports them, and re-exporting the same names from two
 * barrels would collide when `src/runtime/index.ts` does `export *` from
 * both. Import them directly from `../renderers/RendererInterface.js` where
 * needed.
 */

/** The `setData` payload shape (Contract §6.3, §9): consumer slot values keyed by slot name. */
export type HudData = Record<string, unknown>;
