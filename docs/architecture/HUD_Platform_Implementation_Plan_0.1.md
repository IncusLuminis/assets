# HUD Platform 0.1 — Implementation Plan

**Status:** Internal working document
**Version:** 0.1
**Depends on:** HUD Platform Vision 0.3, HUD Platform Architecture 0.3
**Board:** `IncusLuminis/projects/7` ("Assets Library") — 5 Epics (#20–#24), 19 Stories (#1–#19)
**Audience:** IncusLuminis internal (engineering + PO)

---

## 0. Purpose

The Vision and Architecture documents define *what* the HUD Platform is and *why*.
This document records the engineering decisions taken to start building **Platform
0.1** in `IncusLuminis/assets`, maps the existing project-7 backlog onto a real
build order, and names the cross-repository work and the normative documents that
still have to be authored.

It is decision-oriented. Where a choice resolves an open point in the source
documents, that is called out.

**Working constraint (owner, 2026-09-09):** all work happens on feature branches.
**Nothing merges to `main`** until the owner decides. Verification is local for
now; a staging target may be introduced later.

---

## 1. What exists today (survey)

| Area | Reality |
|---|---|
| `assets/src/` | Empty (`.gitkeep`). No `package.json`, no build, no runtime code. Greenfield for the platform. |
| Baseline HUDs | **HUD-01 … HUD-06** exist as vanilla HTML/CSS/JS panels in `assets/widgets/panels/hud-0N/` (`index.html` + `hud-0N.css` + `hud-0N.js`), on a shared foundation layer `widgets/shared/{css,js}`. No build step. Fully documented in `widgets/docs/audit-hud01-06.md`. |
| HUD Playground | `products/visualization-studio/visualization-studio-tools/hud-playground/` — currently an `index.html` + a **copy** of the same `widgets/` tree. Loads panels directly, not through any runtime. |
| Visual Composer | `products/visualization-studio/visualization-studio-tools/visual-composer/` — large existing Python/JS authoring app (exhibits, HUD templates, render pipeline). Not yet a HUD-Theme producer. Out of scope for 0.1 authoring; only its Registry-client shape matters later. |
| Publish infra | `assets/scripts/deploy_gadgets_media.sh` — an established pattern: a Cloudflare **Pages** project (`gadgets-media`) with **no GitHub connection**, receiving files by direct `wrangler pages deploy` of a gitignored `.deploy/` staging dir. Content-hashed incremental upload. This is the model for the Registry/CDN deploy. |
| CDN target | **`assets-4gy.pages.dev`** — an existing Cloudflare Pages project (owner, 2026-09-09). Stories #7/#6 wire `wrangler` config + a `dist/` publish dir to it. The `assets.nebulacast.app` custom domain is post-0.1 DNS. |
| git / media policy | `.gitignore` excludes all raster/video/audio/3D/project binaries but **keeps SVG and text** (json/csv/yml). HUD Themes are overwhelmingly SVG/CSS/JS/HTML text → **Theme sources and packages can live in git**; only heavy raster/video media goes to the CDN-only path. |
| Branch state | `assets` local checkout is on `agent/mini-raw-video` (2 commits of unrelated in-flight HUD tweaks ahead of `main`). The two arch docs were dropped in un-committed. This plan's branch (`feature/hud-platform-0.1`) is cut from `origin/main` and carries the arch docs + this plan. |

**Naming note:** the baseline set is *six* panels (HUD-01…06); the project-7
backlog and the arch docs target the *four* HUD-01…04. HUD-05/06 (runtime-drawn
SVG geometry, `ResizeObserver`) are strong Platform 0.2 candidates for the Video
renderer but are **out of 0.1 scope** — confirmed by Architecture §50.

---

## 2. Locked engineering decisions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Runtime language / build | **TypeScript**, bundled with a small tool (**esbuild** or **tsup**), output as ESM. No framework. | Arch §14 "deliberately small and framework-independent at its core"; §22 shows TS interfaces. The four baseline HUDs stay vanilla — only the *runtime* is TS. |
| 2 | Package manager / workspace | **npm** + a single `package.json` at `assets/` root, `"type": "module"`, Node ≥ 22.18 pinned via `.nvmrc` + `engines`. | Consistency with the rest of the portfolio; keeps the lockfile-optional-deps gotcha visible. One package, not a workspace — the Registry/library are data, not npm packages, in 0.1. |
| 3 | Repo layout | Follow Architecture §7 **literally**: `src/runtime/{core,renderers,registry,contract,adapters}`, `src/tooling/`, `library/{themes,components,media}`, `registry/{index.json,schemas}`, `scripts/{build,validate,deploy,maintenance}`, `dist/` (generated, gitignored). | §7 is normative; §54.1 makes the topology authoritative. |
| 4 | Theme source ↔ published package | Theme **sources** live in `library/themes/<id>/` (editable). The **published package** (`library/themes/<id>/<version>/…` deterministic layout per Arch §10) is a build artifact in `dist/`. `dist/` is never source of truth (Arch §7, §2.3). | Immutability (Arch §2.4, §30) requires the published form to be generated, not hand-edited. |
| 5 | Where Themes are stored | In **git** (SVG/CSS/JS/HTML text). Heavy media referenced by a Theme goes to the existing CDN-media path, addressed by stable URL from the manifest. Self-contained text Themes preferred (Arch §8.3). | `.gitignore` already permits this; keeps Theme versions diffable and reproducible. |
| 6 | CDN / Registry deployment | **RESOLVED (owner, 2026-09-09):** deploy the validated `dist/` to the **existing `assets-4gy` Cloudflare Pages project** (`https://assets-4gy.pages.dev/`) via a new `scripts/deploy/` tool **modelled on `deploy_gadgets_media.sh`** (direct `wrangler pages deploy`, no GitHub connection). `assets.nebulacast.app` custom domain is post-0.1. Reuse the pattern; do not invent a new mechanism. | Memory: reuse existing infra, don't stand up parallel CDN targets. Arch §33 allows "the most appropriate Wrangler-compatible mechanism"; Pages direct-upload is the one already proven here. |
| 7 | Contract vs manifest schema | The **HUD Theme Contract 1.0** is a normative Markdown doc (`docs/architecture/HUD_Theme_Contract_1.0.md`). The **manifest JSON Schema** is a real `.json` schema in `registry/schemas/` that the Contract references. Both independently versioned (Arch §12, §30–31). | Arch §55: the Contract is the shared boundary; it must exist before implementation spreads across repos. |
| 8 | Isolation mechanism for 0.1 | **Scoped Theme root** (a single mount container + build-time CSS scoping / prefixing) as the baseline; **Shadow DOM** attempted for the CSS renderer and kept if the legacy HUD-03/04 CSS survives it; **iframe** reserved for exceptional cases only. | Vision §18 "prefer the simplest isolation mechanism compatible with existing HUD implementations"; Arch §41 preferred order. The baseline HUDs already namespace every class `nc-…` — scoping is cheap; Shadow DOM may break Aladin/Google-Fonts assumptions in HUD-01/02 and is validated, not assumed. |
| 9 | Renderer families for 0.1 | **SVG** (HUD-01/02) and **CSS** (HUD-03/04) only. Video / Static / Gadget renderers are declared in the contract's renderer enum but **not implemented** (Arch §50, §54.16). | Scope discipline (Vision §23 "Premature Generalization", Arch §53.6). |
| 10 | Consumer API surface | Imperative `new Hud({theme, version, variant, ratio})` + `mount(el)` + `setData({...})` + `resize()` + `setVariant()` + `destroy()` (Arch §25). A **`<nebula-hud>` Web Component adapter** is Platform 0.2 (Arch §26, §51) — **not** 0.1, unless the external-consumer test (#17) needs it (then it becomes a thin 0.1 add). | Arch §51 lists the Web Component under 0.2. |
| 11 | Testing | **Vitest** for contract/schema/runtime unit tests; **Playwright** (headless) for renderer mount/destroy, isolation, viewport-overflow, and console-error checks against real Theme packages; the **HUD Playground** is the human/reference validation surface. No visual-regression in 0.1 (Vision §19 "later"). | Arch §46 minimum validation list maps cleanly to Vitest + Playwright. |
| 12 | This plan's home | Plain Markdown in `docs/architecture/`, on a feature branch. Not published. | Owner's stated preference; mirrors the stellar-attractor plan. |

---

## 3. Target repository layout (`assets/`)

```
assets/
├── package.json            .nvmrc  tsconfig.json          # NEW — runtime/tooling only
├── src/
│   ├── runtime/
│   │   ├── core/           Hud.ts  ThemeLoader.ts  ThemeResolver.ts  Lifecycle.ts
│   │   ├── renderers/      RendererInterface.ts  SvgRenderer.ts  CssRenderer.ts
│   │   │                   (+ stubs: VideoRenderer / StaticRenderer / GadgetRenderer → throw "unsupported in 0.1")
│   │   ├── registry/       RegistryClient.ts
│   │   ├── contract/       manifest.ts  slots.ts  variants.ts  types.ts   # TS mirror of the Contract
│   │   └── adapters/       (web-component/ — 0.2 placeholder)
│   └── tooling/            shared helpers for scripts/
│
├── library/
│   ├── themes/             hud-01/  hud-02/  hud-03/  hud-04/   # Theme SOURCES
│   │   └── hud-01/
│   │       ├── manifest.json
│   │       ├── mini/16x9/  mini/9x16/  maxi/16x9/  maxi/9x16/
│   │       ├── assets/  styles/  scripts/  preview/  sources/
│   ├── components/         (Platform 0.2 — Component Registry)
│   └── media/              (shared binary — CDN-only, gitignored where heavy)
│
├── registry/
│   ├── index.json          GENERATED discovery metadata (checked in for review, regenerated by build)
│   └── schemas/            manifest.schema.json  registry-index.schema.json  (+ version dirs)
│
├── scripts/
│   ├── build/              build-theme.ts  build-registry.ts  build-all.ts
│   ├── validate/           validate-theme.ts  validate-manifest.ts  validate-registry.ts
│   ├── deploy/             deploy-registry.sh   (modelled on deploy_gadgets_media.sh)
│   └── maintenance/        inventory.ts  verify-cdn.ts  detect-orphans.ts
│
├── dist/                   GENERATED, gitignored — themes/ components/ media/ registry/
│
├── widgets/                EXISTING baseline HUD-01..06 sources (migration inputs; not deleted)
└── docs/architecture/      Vision · Architecture · this plan · Contract 1.0 (to be written) · manifest-schema doc
```

`widgets/` is a **migration input**, not a build target. The four Themes are
*derived from* `widgets/panels/hud-0N/` into `library/themes/hud-0N/` (#11–#15),
preserving behaviour (Arch §40 Stage 3, §54.20). `widgets/` stays put until the
Playground no longer loads from it (#14).

---

## 4. Cross-repository & document dependencies

Platform 0.1 is not contained in `assets/`. It touches:

| Repo / artifact | What 0.1 needs from it | Owning story |
|---|---|---|
| `docs/architecture/HUD_Theme_Contract_1.0.md` (new, this repo) | The normative consumer boundary — gates every implementation story. | #4 |
| `registry/schemas/manifest.schema.json` (new, this repo) | Machine-validatable manifest; consumed by validate/build/runtime/playground. | #3 |
| `widgets/docs/audit-hud01-06.md` (exists) | Primary input to the inventory; already covers rendering tech, deps, data injection, form factors. | #2 |
| `hud-playground/` repo | Becomes a **Runtime consumer** — replace direct `widgets/` loading with `@incus/hud-runtime` + Registry resolution. Also gains a local-vs-published toggle. | #14, #16 |
| `assets-4gy` Cloudflare Pages project (exists) | `wrangler` config + the `dist/` publish dir wired to it; `wrangler` assumed already authenticated on the owner's machine. **DevOps.** | #6, #7 |
| **`stellar-attractor-site`** (owner, 2026-09-09) — its Phase 2 HUD work is parked; first real consumer | An implementation-agnostic integration using only the public Runtime/Contract API. | #17 |
| Visual Composer | *No 0.1 code change.* Only its future `RegistryClient` shape is informed by #1's `registry/index.json` format. | (0.2) |

**Documents to author in 0.1:** Contract 1.0 (#4), manifest JSON Schema + a short
schema-reference doc (#3), the HUD inventory report (#2), and an ADR per major
decision in §2 (`docs/adr/`, per CONTRIBUTING).

---

## 5. Build order & critical path

The Vision §20 and Architecture §50 already imply the sequence. Concretely, with
the project-7 issues:

```
                     ┌─────────────────────────── EPIC #22 Discovery & Contract ──────────────────────────┐
                     │  #2 inventory ──► #4 Contract 1.0 ──► #3 manifest JSON Schema                       │
                     └───────────────────────────────────────┬───────────────────────────────────────────┘
                                                             │  (Contract + schema frozen)
                        ┌────────────────────────────────────┼────────────────────────────────────┐
                        ▼                                                                          ▼
        ┌──── EPIC #23 Asset Library & Publication ────┐            ┌──────── EPIC #20 Runtime & Renderers ────────┐
        │  #5 library structure ──► #1 registry gen    │            │  #8 minimal Runtime ──► #9 SVG renderer      │
        │        │                                     │            │                    └──► #10 CSS renderer     │
        │        ▼                                     │            └───────────────────────────┬─────────────────┘
        │  #7 wrangler deploy tooling ──► #6 publish CDN│                                        │
        └──────────────────────────┬──────────────────┘                                        │
                                   │                                                            │
                                   └───────────────┬───────────────────────────────────────────┘
                                                   ▼
                        ┌──────────── EPIC #21 Theme Migration & Playground ────────────┐
                        │  #11 HUD-01 ─┐                                                 │
                        │  #12 HUD-02 ─┼─► (each: package → validate → load via Runtime) │
                        │  #15 HUD-03 ─┤                                                 │
                        │  #13 HUD-04 ─┘                                                 │
                        │        │                                                      │
                        │        ▼                                                      │
                        │  #14 Playground → Runtime loading ──► #16 Playground → CDN     │
                        └───────────────────────────┬─────────────────────────────────┘
                                                    ▼
                        ┌──────── EPIC #24 Compatibility & External Consumer ───────────┐
                        │  #19 mini/maxi validation                                      │
                        │  #18 16:9 / 9:16 validation                                    │
                        │  #17 one external consumer (published path)                    │
                        └───────────────────────────────────────────────────────────────┘
```

**Critical path:** `#2 → #4 → #3 → #8 → {#9, #10} → #11 → #14 → #17`.

**Parallelisable once #3 is frozen:**
- Track A (library/publish): #5 → #1 → #7 → #6 — independent of the Runtime, can run alongside #8–#10. Owner/DevOps unblocks the Cloudflare parts.
- Track B (runtime): #8 → #9 ∥ #10 (SVG and CSS renderers are disjoint files).
- Track C (theme packaging): #11/#12 need #9 + #3; #15/#13 need #10 + #3. The four packagings are disjoint (`library/themes/hud-0N/`) and parallel-safe.

**Hard gates (do not start downstream before these land):**
1. `#4` Contract 1.0 frozen — nothing implementation-side starts before it.
2. `#3` manifest schema frozen — all packaging + runtime manifest handling depends on it.
3. `#6` published CDN reachable — `#16` and `#17` (published path) depend on it.

---

## 6. Phasing (with owner gates)

Because nothing merges to `main` until the owner decides, work accumulates on
feature branches. Proposed: **one long-lived integration branch
`feature/hud-platform-0.1`**, with each story on its own child branch merged into
the integration branch (not `main`) after Coder→Validator. The owner reviews the
integration branch at each phase gate and merges to `main` when satisfied.

| Phase | Stories | Exit / owner gate |
|---|---|---|
| **P1 — Contract** | #2, #4, #3 | Inventory report complete; Contract 1.0 + manifest schema reviewed and frozen by the owner. **No implementation starts before this gate.** |
| **P2 — Skeleton & Runtime core** | repo scaffold (package.json/tsconfig/nvmrc, §3 layout), #5, #8 | `new Hud(...).mount()` resolves a hand-written fixture Theme and reports failures through the §45 error model. Vitest green. |
| **P3 — Renderers** | #9, #10 | A fixture SVG Theme and a fixture CSS Theme both mount/destroy through the one Runtime API; CSS isolation validated (Playwright). |
| **P4 — Library & publication** (parallel with P3) | #1, #7, #6 | `registry/index.json` generated from validated source; `dist/` builds; `assets-4gy.pages.dev` serves it; smoke check passes. |
| **P5 — Theme migration** | #11, #12, #15, #13 | HUD-01…04 packaged, each passes manifest+asset+isolation validation and loads through the Runtime with behaviour preserved (diff against `widgets/` baseline documented). |
| **P6 — Playground** | #14, #16 | Playground consumes all four Themes **only** through the Runtime; local vs published loading toggle; published path smoke-tested. |
| **P7 — Compatibility & external consumer** | #19, #18, #17 | mini/maxi + 16:9/9:16 validated (incl. explicit unsupported cases); one external consumer integrated on the published path using only the public API. **Platform 0.1 success criterion evidenced**, or gaps logged for 0.2. |

Platform 0.1 success criterion (Arch §50, Vision §20):

> HUD-01 through HUD-04 can be loaded through a common Runtime interface without
> the consumer knowing how each HUD is implemented.

---

## 7. Open questions for the owner

### Resolved (owner, 2026-09-09)

1. **Cloudflare target for the Registry/CDN** — **RESOLVED:** deploy to the **existing `assets-4gy` Cloudflare Pages project** (`https://assets-4gy.pages.dev/`). The work under #7 is (a) a publish directory the site is deployed from — the plan's `dist/` — and (b) `wrangler` configuration. `wrangler` is assumed already authenticated on the owner's machine (consistent with `scripts/deploy_gadgets_media.sh`). The `assets.nebulacast.app` custom domain is a later DNS concern and does **not** block #6/#7; the `.pages.dev` URL is the 0.1 target. → Q1 hold lifted on #7 and #6 (they remain behind the Contract-frozen gate, Role: DevOps).
2. **External-consumer target for #17** — **RESOLVED:** **`IncusLuminis/stellar-attractor-site`**. Its Phase 2 HUD work is parked and this is the first real consumer. → Q2 hold lifted on #17 (remains behind the #6/#16 gate).
4. **HUD-01/02 external CDN deps** (Aladin Lite, SIMBAD/VizieR/ADS, Google Fonts) — **RESOLVED:** **keep as-is** — lazy-loaded inside the Theme, not refactored. The manifest schema (#3) keeps the optional external-resource allowlist *field*, but declaring it is not mandatory for HUD-01/02 in 0.1; #4's JS/external-resource policy documents that Registry-loaded Themes may lazy-load from a fixed set of known hosts (Aladin CDS, SIMBAD/VizieR/ADS, Google Fonts) without per-Theme allowlisting in 0.1.

### Still open (not blocking; proceeding on the noted assumption)

3. **Baseline branch** — `agent/mini-raw-video` is ahead of `main` with unrelated HUD fixes and the arch docs are un-committed there. Confirm the platform work should branch from `origin/main` (as this plan's branch does) and that the in-flight `agent/*` HUD tweaks land separately. *Treated as confirmed unless the owner objects — this plan's branch already cut from `origin/main`.*
5. **`micro` variant** — none of HUD-01…04 has one today. 0.1 requires only `mini`+`maxi` (Arch §13). Confirm `micro` stays out of 0.1 entirely. *Recommendation stands; owner has not objected.*
6. **Integration-branch strategy** (§6) — one long-lived `feature/hud-platform-0.1` with child branches, reviewed at phase gates? Or per-epic feature branches? *Proceeding with one long-lived `feature/hud-platform-0.1` + per-story child branches merged into it, reviewed at phase gates.*

---

## 8. What the Product Owner should do next

Groom `IncusLuminis/projects/7`:

- The 5 Epics (#20–#24) and 19 Stories (#1–#19) exist but as short stubs. Add
  full INVEST acceptance criteria (pull from the Vision/Architecture section
  references already cited in each issue), Size estimates, and the dependency
  map from §5 of this plan.
- **Groom P1 (#2, #4, #3) to `Ready` now.** Everything else stays `Backlog`
  pending the P1 gate (Contract frozen) — mark that dependency on each downstream
  Epic.
- Reflect the §2 locked decisions and the §7 open questions on the board; the
  open questions are owner calls, not PO calls.
- Flag the cross-repo stories (#14/#16 touch `hud-playground`; #6/#7 need
  Cloudflare/DevOps; #17 touches an external consumer repo) so the right agent
  role is dispatched.
- Maintain `ROADMAP.md` in this repo as the backlog takes shape.
- Board `Priority` field / required-check conventions: match whatever
  `projects/6` settled on, or flag to the owner.

---

## 9. Risks (carried from Architecture §53, with 0.1 specifics)

1. **Contract churn after implementation starts** → P1 is a hard gate; freeze #4/#3 before P2.
2. **Legacy HUD CSS breaks under Shadow DOM** → decision §2.8 makes Shadow DOM validated-not-assumed; scoped-root is the fallback and the baseline HUDs already namespace everything.
3. **Registry/CDN divergence** → `dist/` gitignored, deploy is repository-driven, `scripts/maintenance/verify-cdn.ts` (Arch §48) compares published state to generated output.
4. **HUD-01/02 heavy runtime deps** (Aladin, contour-glow 4-layer SVG blur — §8 of the audit notes perf on old mobiles) → packaged as-is for 0.1; performance budgets are a 0.2 validation add.
5. **Playground is a copy of `widgets/`** → #14 must make it a true Runtime consumer, not re-copy; the copy is deleted once #16 lands.
6. **Scope creep into Visual Composer authoring** → explicitly 0.2 (Arch §52); 0.1 only informs the `registry/index.json` shape.
7. **Six panels vs four** → HUD-05/06 are 0.2 (Video renderer); do not let them into 0.1 packaging.
