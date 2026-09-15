# scripts/build/

- `build.mjs` — **Story #5.** Bundles `src/runtime/` → `dist/runtime/` with
  esbuild. Exports `runBuild()` (used by `build-all.ts`) and still runs
  standalone via `npm run build`.
- `build-theme.ts` — **Story #1.** Packages ONE `library/themes/<id>/`
  source into a deterministic, published `dist/themes/<id>/<version>/`
  package per Contract §2.2 (manifest.json + supported composition dirs +
  `assets/styles/scripts/preview` if present — never `sources/`, README, or
  anything else not in that canonical list). Validates the source manifest
  against `registry/schemas/manifest.schema.json` first and fails closed
  (non-zero exit, no output written) on an invalid manifest or a missing
  entrypoint/composition asset. `npm run build:theme -- <id> [<id> ...]` or
  `--all` (every `library/themes/<id>/` with a `manifest.json`, including
  the Story #5 fixture Themes — see `build-all.ts` for why the *production*
  pipeline doesn't use `--all`).
- `build-registry.ts` — **Story #1.** Generates `registry/index.json` from
  the already-built `dist/themes/**` (never from `library/themes/` source —
  Arch §49: "Registry metadata is written only after the referenced Theme
  assets exist in dist/"). Validates every `dist/` manifest it finds against
  `registry/schemas/manifest.schema.json`, re-checks that every asset a
  manifest's `entrypoints`/`compositions` reference actually exists in that
  package (secondary, defense-in-depth check — `build-theme.ts` is the
  primary owner of that check; see `registry/schemas/README.md`), computes
  semver-correct version ordering and `latest`, and validates its own
  output against `registry/schemas/registry-index.schema.json` before
  writing. Fails closed (no partial index) on any of the above. `npm run
  build:registry`.
- `build-all.ts` — **Story #1.** Aggregate orchestrator: the four real
  Themes (`build-theme.ts`, explicit ids — not `--all`, so the Story #5
  fixture Themes never leak into the committed `registry/index.json`) →
  the Runtime (`build.mjs`'s `runBuild()`) → the Registry
  (`build-registry.ts`), in that order (Registry generation needs the
  Theme `dist/` packages to exist first). `npm run build:all`. `npm run
  build` (Story #5, unchanged) still builds only the Runtime.
- `lib/` — shared helpers: `manifest-validator.ts` /
  `registry-index-validator.ts` (ajv, independent of
  `tests/helpers/validator.js` — production tooling shouldn't import from
  `tests/`), `semver.ts` (strict `MAJOR.MINOR.PATCH` comparison/sort/max —
  numeric, not lexicographic), `fs-utils.ts` (deterministic directory
  walk/copy + atomic staged-directory writes).

All three `.ts` entrypoints run directly via `node scripts/build/*.ts` —
Node ≥22.18 (this repo's pinned `.nvmrc`/`engines`) strips TypeScript types
natively, so no `tsx`/`ts-node` devDependency was added. They're written to
stay within Node's "erasable syntax only" subset (no parameter properties,
enums, or namespaces with runtime code) so this keeps working without a
build step. `tsconfig.scripts.json` (root of the repo) is what `npm run
typecheck` runs against them, kept separate from the root `tsconfig.json`
(which type-checks the browser-bundled `src/runtime/`) so Node-only types
(`@types/node`) don't leak into that browser code's typecheck.

`scripts/validate/` and `scripts/deploy/` remain out of this Story's scope
(deploying the output is #6/#7) — see their own READMEs.
