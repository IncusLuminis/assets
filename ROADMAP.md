# Roadmap — HUD Platform 0.1 (Assets Library)

**Board:** [`IncusLuminis/projects/7`](https://github.com/orgs/IncusLuminis/projects/7) ("Assets Library")
**Source docs:** `docs/architecture/HUD_Platform_Vision.md` (0.3) · `docs/architecture/HUD_Platform_Architecture.md` (0.3) · `docs/architecture/HUD_Platform_Implementation_Plan_0.1.md` (0.1)
**Working constraint (owner, 2026-09-09):** all work on feature branches; **nothing merges to `main`** until the owner decides. Verification is local for now.

Platform 0.1 is successful when:

> HUD-01 through HUD-04 can be loaded through a common Runtime interface without the consumer knowing how each HUD is implemented. — Architecture §50 / Vision §20

Priorities are **Medium** across the board and target dates are blank — the source plan states none. Sequencing is by phase (P1–P7), not by the Priority field.

---

## Epics

| Epic | Outcome (one line) | Phases |
|---|---|---|
| **#22 Discovery & Contract** | Inventory + frozen HUD Theme Contract 1.0 + manifest JSON Schema — the platform boundary. | P1 |
| **#20 Runtime & Renderers** | Implementation-neutral Runtime + SVG and CSS renderers behind one small API. | P2–P3 |
| **#23 Asset Library & Publication** | Authoritative repo layout, deterministic Registry generation, reproducible Wrangler publish to `assets.nebulacast.app`. | P2, P4 |
| **#21 Theme Migration & Playground** | HUD-01…04 packaged as Themes without redesign; Playground becomes a pure Runtime consumer that can load published Themes. | P5–P6 |
| **#24 Compatibility & External Consumer** | mini/maxi + 16:9/9:16 validated; one external consumer on the published path; 0.1 success criterion evidenced. | P7 |

---

## Phased backlog (Implementation Plan §6)

| Phase | Stories | Exit / owner gate |
|---|---|---|
| **P1 — Contract** | #2, #4, #3 | Inventory complete; Contract 1.0 + manifest schema reviewed and **frozen by the owner**. **No implementation starts before this gate.** |
| **P2 — Skeleton & Runtime core** | #5 (incl. repo scaffold), #8 | `new Hud(...).mount()` resolves a fixture Theme and reports failures via the §45 error model; Vitest green. |
| **P3 — Renderers** | #9, #10 | A fixture SVG Theme and a fixture CSS Theme both mount/destroy through the one Runtime API; CSS isolation validated (Playwright). |
| **P4 — Library & publication** (parallel with P3) | #1, #7, #6 | `registry/index.json` generated from validated source; `dist/` builds; `assets.nebulacast.app` serves it; smoke check passes. |
| **P5 — Theme migration** | #11, #12, #15, #13 | HUD-01…04 packaged; each passes manifest + asset + isolation validation and loads through the Runtime with behaviour preserved (diff documented). |
| **P6 — Playground** | #14, #16 | Playground consumes all four Themes **only** through the Runtime; local-vs-published toggle; published path smoke-tested. |
| **P7 — Compatibility & external consumer** | #19, #18, #17 | mini/maxi + 16:9/9:16 validated (incl. explicit unsupported cases); one external consumer on the published path using only the public API. 0.1 success criterion evidenced, or gaps logged for 0.2. |

---

## Story table

| # | Story | Epic | Size | Phase | Status | Depends on |
|---|---|---|---|---|---|---|
| 2 | Inventory HUD-01…04 | #22 | M | P1 | **Ready** | — |
| 4 | Define HUD Theme Contract 1.0 | #22 | L | P1 | **Ready** | #2 |
| 3 | Define Theme manifest JSON Schema | #22 | M | P1 | **Ready** | #4 |
| 5 | Establish asset-library structure (+ repo scaffold) | #23 | S | P2 | Backlog | gate: #4+#3 |
| 8 | Implement the minimal HUD Runtime | #20 | L | P2 | Backlog | gate: #4+#3; #5 |
| 1 | Establish Registry generation | #23 | M | P4 | Backlog | gate: #4+#3; #5, #3 |
| 7 | Establish Wrangler deployment tooling | #23 | M | P4 | Backlog | gate: #4+#3; #1; **Cloudflare/DevOps (Q1)** |
| 6 | Publish the HUD Registry/CDN | #23 | S | P4 | Backlog | gate: #4+#3; #7, #1; **Cloudflare/DevOps (Q1)** |
| 9 | Implement the SVG Renderer | #20 | L | P3 | Backlog | gate: #4+#3; #8 |
| 10 | Implement the CSS Renderer | #20 | M | P3 | Backlog | gate: #4+#3; #8 |
| 11 | Package HUD-01 as a Theme | #21 | L | P5 | Backlog | gate: #4+#3; #9, #3 |
| 12 | Package HUD-02 as a Theme | #21 | M | P5 | Backlog | gate: #4+#3; #9, #3 |
| 15 | Package HUD-03 as a Theme | #21 | M | P5 | Backlog | gate: #4+#3; #10, #3 |
| 13 | Package HUD-04 as a Theme | #21 | M | P5 | Backlog | gate: #4+#3; #10, #3 |
| 14 | Migrate HUD Playground to Runtime loading | #21 | L | P6 | Backlog | gate: #4+#3; #11, #12, #15, #13, #8; **`hud-playground` repo** |
| 16 | Load published Themes from the CDN in Playground | #21 | M | P6 | Backlog | gate: #4+#3; #14, **#6**; **`hud-playground` repo** |
| 17 | Integrate one external consumer | #24 | L | P7 | Backlog | gate: #4+#3; #16, #6; **external-consumer repo (Q2)** |
| 18 | Validate 16:9 and 9:16 behavior | #24 | M | P7 | Backlog | gate: #4+#3; #14 |
| 19 | Validate mini/maxi Theme behavior | #24 | M | P7 | Backlog | gate: #4+#3; #14 |

---

## Dependency map (Implementation Plan §5)

**Critical path:** `#2 → #4 → #3 → #8 → {#9, #10} → #11 → #14 → #17`

**Parallel tracks once #3 is frozen:**
- **Track A — library / publish:** `#5 → #1 → #7 → #6` — independent of the Runtime; runs alongside #8–#10. Cloudflare parts wait on the owner/DevOps.
- **Track B — runtime:** `#8 → #9 ∥ #10` (SVG and CSS renderers are disjoint files).
- **Track C — theme packaging:** `#11/#12` need `#9 + #3`; `#15/#13` need `#10 + #3`. The four packagings are disjoint (`library/themes/hud-0N/`) and parallel-safe.

**Hard gates — do not start downstream before these land:**
1. **#4 Contract 1.0 frozen** by the owner — nothing implementation-side starts before it.
2. **#3 manifest schema frozen** by the owner — all packaging + runtime manifest handling depends on it.
3. **#6 published CDN reachable** — #16 and #17 (published path) depend on it.

```
        ┌──────────── #22 Discovery & Contract (P1) ─────────────┐
        │   #2 inventory → #4 Contract 1.0 → #3 manifest schema   │
        └───────────────────────────┬───────────────────────────┘
                        (Contract + schema frozen — hard gates 1 & 2)
          ┌──────────────────────────┼──────────────────────────┐
          ▼                                                     ▼
  #23 Asset Library & Publication              #20 Runtime & Renderers
  #5 → #1 → #7* → #6*   (Track A)              #8 → #9 ∥ #10   (Track B)
          │  (*Cloudflare/DevOps — Q1)                          │
          └──────────────────────────┬──────────────────────────┘
                                     ▼
              #21 Theme Migration & Playground
              #11/#12 (SVG)  #15/#13 (CSS)   (Track C, parallel)
                        → #14 Playground→Runtime (hud-playground repo)
                        → #16 Playground→CDN  (needs #6 — hard gate 3)
                                     ▼
              #24 Compatibility & External Consumer
              #19 mini/maxi   #18 16:9/9:16   #17 external consumer (repo TBD — Q2)
```

---

## Resolved (locked engineering decisions — Implementation Plan §2)

| # | Decision |
|---|---|
| 1 | Runtime in **TypeScript**, bundled with esbuild/tsup, ESM output, no framework. Baseline HUDs stay vanilla. |
| 2 | **npm** + single root `package.json`, `"type": "module"`, Node ≥ 22.18 via `.nvmrc` + `engines`. One package, not a workspace. |
| 3 | Repo layout follows **Architecture §7 literally** (`src/runtime/{core,renderers,registry,contract,adapters}`, `src/tooling/`, `library/{themes,components,media}`, `registry/{index.json,schemas}`, `scripts/{build,validate,deploy,maintenance}`, `dist/` gitignored). |
| 4 | Theme **sources** in `library/themes/<id>/`; the **published package** is a deterministic `dist/` build artifact (Arch §10). `dist/` is never source of truth. |
| 5 | Themes stored **in git** (SVG/CSS/JS/HTML text); heavy media goes to the existing CDN-media path, addressed by stable URL from the manifest. |
| 6 | CDN/Registry: a dedicated **Cloudflare Pages** project for `assets.nebulacast.app`, deployed by `scripts/deploy/` **modelled on `deploy_gadgets_media.sh`** (direct `wrangler pages deploy` of a validated `dist/`, no GitHub connection). *(Cloudflare target itself — open Q1.)* |
| 7 | **HUD Theme Contract 1.0** = normative Markdown (`docs/architecture/HUD_Theme_Contract_1.0.md`); **manifest JSON Schema** = real `.json` in `registry/schemas/`, referenced by the Contract. Independently versioned. |
| 8 | Isolation for 0.1: **scoped Theme root** baseline; **Shadow DOM** attempted for the CSS renderer and kept only if legacy HUD-03/04 CSS survives; **iframe** reserved for exceptional cases. |
| 9 | Renderer families for 0.1: **SVG** (HUD-01/02) and **CSS** (HUD-03/04) only. Video/Static/Gadget declared in the enum but not implemented. |
| 10 | Consumer API: imperative `new Hud({theme,version,variant,ratio})` + `mount` / `setData` / `resize` / `setVariant` / `destroy`. `<nebula-hud>` Web Component is 0.2 (thin add only if #17 needs it). |
| 11 | Testing: **Vitest** for contract/schema/runtime units; **Playwright** (headless) for renderer mount/destroy, isolation, overflow, console-error checks; the HUD Playground is the human/reference surface. No visual-regression in 0.1. |
| — | Scope: **HUD-05 / HUD-06 are out of 0.1** (runtime-drawn SVG geometry → Video renderer, 0.2). |

---

## Open — owner calls (Implementation Plan §7; NOT resolved by the PO)

| Q | Question | Holds from `Ready` | Recommendation in the plan |
|---|---|---|---|
| **Q1** | Cloudflare target for `assets.nebulacast.app` (new dedicated Pages project vs attach to existing) + who provisions DNS + `wrangler` token (DevOps). | **#7, #6** (and #16/#17 transitively) | New dedicated Pages project, mirroring `gadgets-media`. |
| **Q2** | External-consumer target for #17 — `nebulacast-site` (Blogger case) or `stellar-attractor-site` (parked Phase 2 HUD work). | **#17** | Not stated — owner call; affects which repo is touched. |
| **Q3** | Baseline branch — confirm platform work branches from `origin/main` and the in-flight `agent/*` HUD tweaks land separately. | none directly (process) | Branch from `origin/main` (as `feature/hud-platform-0.1` does). |
| **Q4** | HUD-01/02 external CDN deps (Aladin Lite, SIMBAD/VizieR/ADS, Google Fonts) — keep as-is inside the Theme, or allowlist explicitly in the Contract's JS policy. | informs **#4, #3**; holds **#11, #12** detail | Allowlist in the manifest, keep lazy loading. |
| **Q5** | `micro` variant — confirm it stays out of 0.1 entirely. | informs **#4, #19** | `micro` out of 0.1 (only `mini` + `maxi` required). |
| **Q6** | Integration-branch strategy — one long-lived `feature/hud-platform-0.1` with child branches reviewed at phase gates, or per-epic feature branches. | none (process) | One long-lived integration branch with per-story child branches. |

---

## Cross-repo / role notes

- **#7, #6** — need Cloudflare provisioning; dispatch to **DevOps**. Media_keeper owns Theme lifecycle once real Themes publish.
- **#14, #16** — PRs on the **`hud-playground`** repo (`products/visualization-studio/visualization-studio-tools/hud-playground/`).
- **#17** — PR on an **external-consumer repo** (target undecided — Q2).
- **#5** — folds in the "repo scaffold" line from Plan §6 P2 rather than opening a new issue; revisit if the owner wants it split out.
