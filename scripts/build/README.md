# scripts/build/

- `build.mjs` — **Story #5.** Bundles `src/runtime/` → `dist/runtime/` with
  esbuild (`npm run build`). See the file's own header comment for what it
  does and does not cover yet.

Reserved for later, not yet built: `build-theme.ts` (package one
`library/themes/<id>/` source into a deterministic `dist/themes/<id>/<version>/`
per Contract §2.2–§2.3), `build-registry.ts` (generate `registry/index.json`,
Story #1), and `build-all.ts` (aggregate). Theme packaging and registry-index
generation are explicitly out of Story #5's scope.
