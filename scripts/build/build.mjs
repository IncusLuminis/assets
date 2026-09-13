#!/usr/bin/env node
/**
 * Runtime build: bundles `src/runtime/index.ts` -> `dist/runtime/index.js`
 * (ESM) with esbuild (Plan §2 decision 1). Invoked via `npm run build`.
 *
 * This is the build-scaffold wiring Story #5's AC calls for -- it runs clean
 * today because the renderer stubs in `src/runtime/renderers/` give it real,
 * if minimal, source to bundle. It requires no changes as the real Runtime
 * (#8) and renderers (#9/#10) land under `src/runtime/`; they are picked up
 * automatically once `src/runtime/index.ts` re-exports them.
 *
 * Theme packaging (`build-theme.ts`), registry index generation
 * (`build-registry.ts`, Story #1) and an aggregate `build-all.ts` are
 * separate, not-yet-built tools per Plan §3 -- out of this Story's scope.
 */
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

await build({
  entryPoints: [path.join(repoRoot, "src/runtime/index.ts")],
  outfile: path.join(repoRoot, "dist/runtime/index.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  sourcemap: true,
  logLevel: "info"
});
