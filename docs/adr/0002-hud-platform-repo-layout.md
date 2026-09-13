# ADR-0002: HUD Platform repo layout & build scaffold

- Status: Accepted
- Date: 2026-09-13
- Deciders: HUD Platform owner (Plan §2 decisions 1–5, frozen ahead of this Story), Coder (authoring, Story #5)
- Related: `docs/architecture/HUD_Platform_Implementation_Plan_0.1.md` §2 (d1–d5), §3, §6; `docs/architecture/HUD_Platform_Architecture.md` §6–§10; `docs/architecture/HUD_Theme_Contract_1.0.md` §2; Story #5, Epic #23, board `IncusLuminis/projects/7`
- Supersedes: none
- Depends on: ADR-0001 (HUD Theme Contract 1.0), the frozen manifest JSON Schema (Story #3)

## Context

Stories #1–#4 (Epics #20/#22) froze the HUD Theme Contract 1.0 and its
manifest JSON Schema — Plan §5 hard gates 1–2. With that gate cleared, this
repo (`assets/`) needs the physical directory structure, package manifest,
and minimal build wiring that every downstream Platform 0.1 Story
(`#1`, `#7`, `#8`, `#9`, `#10`, `#11`–`#15`) will build inside. The
Implementation Plan §6 phase table originally listed "repo scaffold
(package.json/tsconfig/nvmrc, §3 layout)" as a line item alongside Story #5;
the PO folded it directly into Story #5's acceptance criteria rather than
opening a separate Story (see the issue's PO note).

Story #3 already landed a **minimal bootstrap** on this branch ahead of this
Story — `package.json`, `.nvmrc`, `vitest.config.js`, `registry/schemas/`
with the frozen schema, and the fixture-corpus test suite — scoped
narrowly to what the schema-freeze gate needed. This ADR covers the decision
to build the *full* Plan §3 / Architecture §7 layout on top of that
bootstrap, not to replace it.

## Decision

1. **Directory tree matches Plan §3 / Architecture §7 literally.**
   `src/runtime/{core,renderers,registry,contract,adapters}`,
   `src/tooling/`, `library/{themes,components,media}`,
   `registry/schemas/` (already present from #3), and
   `scripts/{build,validate,deploy,maintenance}`. Directories with no content
   yet in this Story carry a `README.md` explaining their future occupant and
   which Story populates them, rather than a bare `.gitkeep` — so the repo
   structure is self-documenting to the next Coder, not just present.

2. **Single npm package, no workspace, TypeScript + esbuild, ESM output, no
   framework** (Plan §2 decisions 1–2, unchanged from the bootstrap). Added
   `tsconfig.json` (strict, `NodeNext` module/resolution, ES2022 target,
   declarations on) and `esbuild` as the bundler. `esbuild` is pinned to
   `^0.28.0` rather than the Plan's illustrative `^0.24.0` — Vitest 5's `vite`
   peer dependency requires `esbuild ^0.27.0 || ^0.28.0`; using an older
   pin fails `npm install` with an unresolvable peer conflict. `tsup` was not
   chosen: it wraps esbuild and adds no capability this repo's single-entry,
   framework-free bundle needs (Plan §2 decision 1 names either as
   acceptable).

3. **The runtime build has a real, minimal entry point, not a no-op.**
   `src/runtime/index.ts` re-exports only what Story #5 itself ships (the
   renderer lifecycle interface and the three reserved-engine stubs) rather
   than an empty placeholder file. `scripts/build/build.mjs` bundles it with
   esbuild into `dist/runtime/index.js`. This means `npm run build` proves
   the pipeline actually bundles real TypeScript today, and requires **no
   changes** as `#8` (Runtime core), `#9` (SvgRenderer), and `#10`
   (CssRenderer) land — they are picked up by adding exports to the same
   entry file. The alternative (an empty entry, or no `npm run build` script
   at all until #8 exists) was rejected: it would leave the AC
   ("a no-op build runs clean") satisfied only vacuously, with the wiring
   itself unverified until #8, several Stories later.

4. **`dist/` is generated-only and gitignored** (Plan §2 decision 4,
   Architecture §7) — already true in the existing `.gitignore` from the
   original repo scaffold; confirmed, not re-declared. Documented explicitly
   in both README.md and CONTRIBUTING.md as the one boundary contributors
   must not cross.

5. **`.gitignore`'s existing binary-media policy stands unchanged** (Plan §2
   decision 5): SVG/CSS/JS/HTML/JSON Theme sources stay in git; only heavy
   raster/video/audio/3D formats are excluded (CDN-only). No loosening or
   tightening in this Story.

6. **Reserved-engine renderer stubs implement enough of the Contract's
   renderer shape to compile, and throw `RendererUnsupportedError` (code
   `RendererUnsupported`, Contract §20.1) unconditionally from every
   lifecycle method** (`mount`, `setData`, `resize`, `setVariant`,
   `destroy`) — per Contract §5.2: a 1.0 Runtime asked to mount `video`,
   `static`, or `gadget` MUST fail this way and MUST NOT fall back. A
   minimal `RendererInterface.ts` (type-only, no logic) gives the stubs — and
   the real `SvgRenderer`/`CssRenderer` landing in #9/#10 — a single shared
   shape to compile against. `SvgRenderer.ts`/`CssRenderer.ts` are
   deliberately **not** stubbed or scaffolded beyond a `README.md` note:
   Story #5's AC and out-of-scope list draw the line at the reserved
   engines; the supported engines are #9/#10's Stories to open, not this
   one's to pre-shape.

7. **One fixture Theme, not a real HUD, proves the source-side package
   shape.** `library/themes/fixture-hud/` uses a placeholder `id` (not a
   reserved `hud-NN` baseline ID — those belong to #11–#15), the minimal
   1.0-required composition set (`maxi:landscape`, `mini:landscape`,
   `micro:portrait`, each a bare placeholder `.html` fragment under its
   `<variant>/<orientation>/` directory per Contract §2.2), no
   consumer-specific capabilities (no `dataSource`/`skyViewer`/`mediaEmbed`/
   `modes`), and validates against the frozen schema plus this repo's
   semantic layer (`tests/helpers/semantics.js`, from #3). This is the
   directory-and-manifest shape proof the AC calls for — not a template
   intended to be copied verbatim into a real Theme.

8. **`widgets/` is untouched, left in place, and documented (not deleted or
   restructured)** as migration input for #11–#15 (Plan §3, Architecture
   §40 Stage 3) — in the top-level README's repo-structure section and its
   own existing `widgets/README.md`.

9. **The existing #3 bootstrap is extended, not replaced.**
   `package.json`'s `type: module` and Node `>=22.18` engine pin,
   `vitest.config.js`, `registry/schemas/manifest.schema.json` +
   its README, and the full `tests/fixtures/`/`tests/unit/` corpus from #3
   are kept as-is; this Story only adds to `package.json` (`build`,
   `typecheck` scripts; `esbuild`, `typescript` devDependencies) and adds
   new test files alongside the existing ones. No file from #3 was deleted
   or rewritten from scratch.

## Consequences

### Positive

- Every downstream Story lands inside a repo shape that already matches the
  normative Plan §3 / Architecture §7 layout — no later "move things into
  place" migration.
- The build pipeline is proven end-to-end (real TypeScript in, real ESM
  bundle out) rather than aspirational, so #8/#9/#10 inherit working
  tooling instead of having to first debug it.
- Every reserved directory documents *why* it's empty and *which Story*
  populates it, reducing the chance a future Coder invents a conflicting
  convention out of uncertainty.
- The fixture Theme gives the Vitest suite (and any future
  `scripts/validate/` CLI) a schema-valid, non-`hud-NN` example to test
  against without waiting on #11's real migration.

### Negative

- Pinning `esbuild ^0.28.0` (rather than the Plan's illustrative `^0.24.0`)
  is a small, silent deviation from the Plan's exact text, forced by
  Vitest 5's peer-dependency range; flagged here rather than left
  undocumented.
- `src/runtime/index.ts` re-exporting the renderer stubs means the bundler
  entry point already has *some* shape opinion before Story #8 exists. This
  is a deliberate, narrow choice (item 3 above) but a future Runtime design
  could in principle want a different entry surface; #8 is free to
  restructure `index.ts`'s exports as needed, at the cost of a small,
  known-in-advance edit.
- The `RendererInterface.ts` lifecycle shape is authored now, ahead of the
  Runtime that will actually drive it (#8). If #8 needs to change the
  lifecycle signature, this file (and the three stubs implementing it) need
  a follow-up edit — a small, contained cost against Contract §6 already
  being frozen.

### Neutral / follow-ups

- Story #1 (registry index generation) adds `registry/index.json` and
  `scripts/build/build-registry.ts`; not created here per this Story's
  explicit out-of-scope list.
- Story #7 (deploy tooling) populates `scripts/deploy/`.
- Story #8 (Runtime logic) populates `src/runtime/{core,registry,contract}/`
  and adds `SvgRenderer.ts`/`CssRenderer.ts` awareness to
  `src/runtime/index.ts`'s exports; #9/#10 add the renderers themselves.
- Stories #11–#15 migrate `widgets/panels/hud-0N/` into
  `library/themes/hud-0N/`, following the same `<variant>/<orientation>/`
  package shape this Story's fixture Theme demonstrates.
