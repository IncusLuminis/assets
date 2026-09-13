# assets

> IncusLuminis Shared Asset Repository — the HUD Platform's authoritative
> source for the HUD Runtime, HUD Theme Contract types/schemas, reusable HUD
> components, complete HUD Theme sources/packages, shared media, Registry
> metadata, and the build/validate/deploy/maintenance tooling around all of
> it (Architecture §6).

---

## Status

| Property | Value |
|----------|-------|
| Status | Active — HUD Platform 0.1 in progress |
| Version | See `VERSION` |
| License | See `LICENSE` |

---

## Source vs. generated — the one rule that matters most

| | Location | Source of truth? |
|---|---|---|
| **Source** | `src/`, `library/`, `registry/schemas/` | YES — hand-edited, committed |
| **Generated** | `dist/` | **NO — never.** Build output only, gitignored. |

`dist/` is produced by `npm run build` (and, once Theme packaging lands,
`scripts/build/build-theme.ts`) from the sources above. It MUST NOT be
hand-edited, and nothing in this repo treats it as authoritative — the
published, immutable Theme packages that ship to the CDN are themselves
generated from `library/themes/<id>/` sources (HUD Theme Contract 1.0 §2.1,
§2.3; Implementation Plan §2 decision 4). If you find yourself editing a file
under `dist/`, stop — edit its source instead and rebuild.

---

## Repository structure

```text
.
├── package.json  .nvmrc  tsconfig.json   Runtime/tooling build config (single npm package, ESM, Node >=22.18)
│
├── src/
│   ├── runtime/
│   │   ├── core/         RESERVED for #8  — Hud.ts, ThemeLoader.ts, ThemeResolver.ts, Lifecycle.ts
│   │   ├── renderers/    SvgRenderer/CssRenderer land in #9/#10. Story #5 ships the reserved-engine
│   │   │                 stubs (VideoRenderer.ts, StaticRenderer.ts, GadgetRenderer.ts — each throws
│   │   │                 RendererUnsupportedError, Contract §5.2/§20.1) + the shared RendererInterface.
│   │   ├── registry/     RESERVED for #8  — RegistryClient.ts
│   │   ├── contract/     RESERVED for #8  — manifest.ts, slots.ts, variants.ts, types.ts (TS mirror of the Contract)
│   │   ├── adapters/     RESERVED for 0.2 — <nebula-hud> Web Component adapter
│   │   └── index.ts      Bundler entry point (dist/runtime/index.js)
│   └── tooling/          RESERVED — shared helpers for scripts/
│
├── library/                        Asset library — SOURCE (Theme Contract §2.1)
│   ├── themes/                     HUD Theme sources, one dir per Theme id
│   │   └── fixture-hud/            Story #5's minimal schema-valid fixture Theme (not a real HUD)
│   ├── components/                 RESERVED for 0.2 — Component Registry (Visual Composer primitives)
│   └── media/                      RESERVED — shared binary media (CDN-only; see .gitignore)
│
├── registry/
│   └── schemas/
│       └── manifest.schema.json    Frozen 1.0 manifest JSON Schema (Story #3) — the machine-readable
│                                   encoding of HUD Theme Contract 1.0 §3/§27
│                                   (registry/index.json generation is Story #1, not yet built)
│
├── scripts/
│   ├── build/            build.mjs (Story #5, esbuild) — RESERVED: build-theme.ts, build-registry.ts, build-all.ts
│   ├── validate/         RESERVED — CLI wrappers around this repo's own manifest-validation logic
│   ├── deploy/           RESERVED for #7 — deploy-registry.sh (existing assets-4gy Cloudflare Pages project)
│   └── maintenance/      RESERVED — inventory.ts, verify-cdn.ts, detect-orphans.ts
│
├── dist/                 GENERATED, gitignored — never source of truth (see above)
│
├── widgets/               EXISTING baseline HUD-01..10 sources. Migration INPUT for Stories #11-#15
│                          (`library/themes/hud-0N/` is derived from here, preserving behaviour —
│                          Architecture §40 Stage 3). Not a build target; not deleted; stays put until
│                          the HUD Playground no longer loads from it (#14).
│
├── tests/                 Vitest unit tests + fixture corpus (manifest schema, semantics, renderer stubs)
│
└── docs/
    ├── adr/               Architecture Decision Records (this repo's major decisions)
    └── architecture/      Vision, Architecture, Implementation Plan, HUD Theme Contract 1.0
```

---

## Getting started

```sh
nvm use            # Node >=22.18, pinned in .nvmrc
npm install
npm run build       # bundles src/runtime/ -> dist/runtime/ (esbuild)
npm run typecheck   # tsc --noEmit
npm test            # vitest run
```

There is no framework dependency in the Runtime (Plan §2 decision 1) and no
npm workspace — this is a single package at the repo root (Plan §2 decision
2).

---

## Documentation

| Directory | Purpose |
|-----------|---------|
| `docs/architecture/` | HUD Platform Vision, Architecture, Implementation Plan 0.1, HUD Theme Contract 1.0 — read these before changing repo structure or Runtime/Contract code |
| `docs/adr/` | Architecture Decision Records |
| `registry/schemas/README.md` | What the manifest schema enforces structurally vs. what this repo's test suite enforces semantically |

---

## Contributing

See **CONTRIBUTING.md**.

---

## Roadmap

See **ROADMAP.md**.

---

## License

See **LICENSE**.
