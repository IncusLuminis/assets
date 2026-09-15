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
 * `runBuild()` is exported so `build-all.ts` (Story #1) can fold this
 * bundling step into the aggregate `npm run build:all` pipeline alongside
 * Theme packaging (`build-theme.ts`) and Registry generation
 * (`build-registry.ts`) without duplicating this esbuild call or shelling
 * out to a second process. Running this file directly (`npm run build`,
 * unchanged from Story #5) still does exactly what it always did.
 */
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

export async function runBuild() {
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
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  await runBuild();
}
