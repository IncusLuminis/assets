# ADR-0001: HUD Theme Contract 1.0

- Status: Proposed (pending owner freeze — Plan §6 P1 gate)
- Date: 2026-09-09
- Deciders: HUD Platform owner (freeze), Coder (authoring)
- Related: `docs/architecture/HUD_Theme_Contract_1.0.md`, Story #4, Epic #22, board `IncusLuminis/projects/7`
- Supersedes: none
- Depends on: HUD Platform Vision 0.3, HUD Platform Architecture 0.3, HUD Platform 0.1 Implementation Plan (§2 d1–d12, §7 A–F), HUD Platform 0.1 Inventory (Story #2, §8 H1–H15)

## Context

The HUD Platform replaces per-project HUD implementations with reusable, versioned **HUD Themes** loaded through a shared Runtime (Vision §2, §25). The Architecture (§12, §55) names a single normative document — the **HUD Theme Contract** — as the stable boundary that the Runtime, Registry, Visual Composer, HUD Playground and every consumer must implement instead of inventing private conventions.

Contract 1.0 is **Plan §6 hard gate P1**: no implementation Story in Epics #20/#21/#23/#24 starts until it is frozen (co-frozen with the manifest JSON Schema, #3). CONTRIBUTING requires an ADR for major architecture decisions; Plan §2 also calls for "an ADR per major decision".

The Story #2 inventory surfaced ~15 concrete decisions (§8, H1–H15) the Contract must resolve, and the owner recorded six further decisions on 2026-09-09 (Plan §7 A–F). The Contract is authored against the **blogger-template lineage** (owner A) — `widgets/sandbox/blogger-hud01-02-wip/`, `widgets/releases/blogger-pilot-hud03/`, `widgets/panels/hud-10/`, `widgets/shared/` — i.e. what actually ships and what the Playground renders, not the older `widgets/panels/hud-0N/` lineage.

## Decision

Adopt `docs/architecture/HUD_Theme_Contract_1.0.md` as the normative, independently versioned (`1.0`) consumer boundary. Key decisions and their rationale:

1. **Contract is normative Markdown; the manifest JSON Schema (#3) is a separate artifact it governs.** The prose is the authority; the schema encodes it. Both are versioned independently of each other, of Theme versions, of the Runtime, and of the Registry-index schema (Arch §30–31, Plan d7).

2. **Source vs published-package split** (Plan d4). Editable sources in `library/themes/<id>/`; deterministic immutable published package in `dist/themes/<id>/<version>/`. Published versions are immutable — any change is a new version (Arch §2.4, §30).

3. **Renderer enum `svg | css | video | static | gadget`; only `svg` and `css` are supported in 1.0.** `video/static/gadget` are reserved so manifests and Registry listings can exist ahead of Runtime support; a 1.0 Runtime asked to load one MUST fail with `RendererUnsupported` and MUST NOT fall back (Plan d9, Arch §54.16).

4. **Lifecycle `mount → setData → resize → setVariant → destroy`** (Arch §22), with explicit ordering guarantees and a mandatory, idempotent, throw-free `destroy`. The inventory found **no teardown anywhere** in the baseline (H5/H10); the Contract puts the teardown obligation on the renderer where a Theme cannot yet expose hooks.

5. **Variants `mini` + `maxi` REQUIRED, `micro` reserved/out-of-1.0** (Arch §13, Plan Q5). `maxi` is an authored composition, not "default minus chrome" (H2).

6. **Owner C — `mini` scale exception.** For the `svg` family (HUD-01/02), `mini` MAY be a `transform: scale()` of the `maxi` DOM in 1.0, declared via `knownDeviations: mini-is-transform-scale`. The non-negotiable part: a `mini` composition MUST exist in **both** `16:9` and `9:16`. The `css` family (HUD-03/04) has genuine `mini` compositions and MUST NOT use the exception.

7. **Owner D — `maxi:9:16` deferred.** `mini:9:16` is REQUIRED (the vertical thumbnail); `maxi:9:16` MAY be declared `supported: false` with `knownDeviations: no-maxi-9x16` and added later as a non-breaking MINOR bump (Arch §31). No rotate/mechanical-scale to fake portrait (Arch §14). HUD-10 (an existing portrait SVG panel) is the reference that proves `9:16` is authorable.

8. **Semantic slots**: consumers set values only through slots via `setData`, never by targeting Theme-internal DOM (`nc-ol-*`, `nc-hp-*`, `<svg>` ids) (Arch §15, §2.1). Standard vocabulary ratified from the inventory; `system` folds into `subtitle`, `ticker` into `footer`; `controls`/`visualization` are Theme-owned (H6).

9. **Owner F — `dataSource` capability.** HUD-01/02 keep fetching their own SIMBAD/VizieR/ADS data from an **object name**, modelled as a declared capability with a fixed host allowlist (CDS, SIMBAD, VizieR, ADS, Google Fonts) — not a "consumer passes rows" refactor. This confines the Vision §12 "no domain logic in a Theme" tension to a declared, allowlisted, name-in/rendering-out channel (H8).

10. **Owner E — one Theme, `capabilities.modes`.** HUD-01/02's object-viewer vs HTML-frame personalities are one Theme with a `{object, html}` flag, not two Themes (H7).

11. **CSS isolation: `scoped-root` is the 1.0 baseline for all Themes.** Shadow DOM is *attempted* only for the `css` family and kept only if the legacy `clip-path`/`drop-shadow`/`float` survive it (validated, not assumed — Plan d8). Shadow DOM is **not** used for HUD-01/02 because Aladin injects into `document.head` and uses `window` globals (H3/H11). Host-wide `body`/`html`/`*` selectors from the legacy shared layer are stripped/root-scoped at packaging; shared `@keyframes` are owned and de-duplicated by a **platform-provided versioned base** injected once per page (H12/H14) — Themes declare `baseVersion`.

12. **`overflowVisible` flag** — a Theme MAY paint decoration outside its box (SVG glow runner, `drop-shadow` frames); the renderer MUST NOT hard-clip such a mount (H13).

13. **JavaScript policy** (Arch §43): executable Themes load only from the controlled Registry; allowlisted external hosts MAY be lazy/page-load loaded **without per-Theme manifest allowlisting** in 1.0 (owner 2026-09-09, Plan Q4); the `externalResources[]` field stays optional. Network during mount is permitted for allowlisted hosts (`knownDeviations: external-io-on-mount`) because Google Fonts + SIMBAD both fire at page load.

14. **Single-instance is the 1.0 floor** (documented limitation, `knownDeviations: single-instance`), but `capabilities.multiInstance: true` is allowed and expected where a factory pattern already exists — the blogger lineage `NcHud01.init(widget, cfg)` is one. Defined 0.2 path via instance factory (H15).

15. **Consumer API**: imperative `new Hud({theme, version, variant, ratio, config})` + `mount/setData/resize/setVariant/destroy` (Arch §25, Plan d10). The `<nebula-hud>` Web Component adapter is out of 1.0 (Platform 0.2), noted as a purely additive future extension.

16. **Error model**: the full `ThemeNotFound … ThemeRuntimeError` set (Arch §45); a failed HUD fails locally and never breaks the host (Vision §18).

17. **`knownDeviations[]`** is the formal, closed-set, machine-readable mechanism for a 1.0 Theme to declare accepted Contract compromises so validation passes deliberately. An unrecognised deviation code fails validation (deviations cannot be invented to dodge checks).

18. **Contract is independent of Visual Composer's internal document model** (Arch §35, §53.5, §2.2). Any field the Runtime does not need stays out of the manifest.

Six items are logged in the Contract's §26 "Open for owner" (micro out entirely; multiInstance expectation; whether HUD-10 ships its portrait maxi; base ownership confirmation; post-mount mode switching; media-embed host list). None blocks freeze if the owner accepts the stated defaults.

## Consequences

### Positive

- Every downstream Story (#3 schema, #8 Runtime, #9/#10 renderers, #11–#15 packaging, #14/#16 Playground, #17 consumer) has one authoritative boundary to build against; codebases across three repos cannot drift into incompatible local conventions (Arch §55).
- The Contract is proven authorable, not aspirational: §25 cross-checks HUD-01/02/03/10 (and HUD-04) into manifest+Contract terms with only owner-sanctioned deviations.
- `knownDeviations` lets Platform 0.1 ship the real baseline HUDs (transform-scale `mini`, deferred portrait `maxi`, page-load network I/O, overflow-visible glow) without weakening the Contract's long-term rules or hiding the compromises.
- Independent versioning means Themes can iterate for many releases at `contractVersion 1.0`, and additive Contract changes (new slot, host, capability, the Web Component adapter, promoting `video`) are MINOR bumps that don't invalidate existing Themes or Runtimes.
- The platform-provided versioned base removes the `@keyframes`-collision and drift risk that per-Theme vendoring of the shared foundation would multiply.

### Negative

- The `mini`-is-`transform: scale()` exception (owner C) formally admits an Arch §13/§14 violation into 1.0 for the SVG family; it must be actively revisited in Contract 1.1 / Platform 0.2 or it ossifies.
- `9:16` `mini` compositions and (later) `maxi` must be **authored from scratch** for HUD-01/02/03/04 — they cannot be derived. 1.0 packaging carries that cost for `mini:9:16` immediately.
- `dataSource` keeps domain logic (astronomy queries) inside a Theme, against the pure Vision §12 model. It is bounded by an allowlist, but it is a precedent other Themes may lean on.
- The renderer-owns-teardown fallback (because the baseline Themes expose no hooks) pushes real complexity into #9/#10: tracking listeners/observers/timers around unchanged Theme code.
- Shadow DOM for the CSS family is "attempt and validate" — the outcome (kept vs fallback) is not known until #10, so the isolation story for HUD-03/04 is provisional at freeze.
- Six open-for-owner items mean the freeze is "freeze with logged assumptions", not "all questions closed".

### Neutral / follow-ups

- Story #3 encodes §3/§27 as `registry/schemas/manifest.schema.json` and is co-frozen at the P1 gate.
- Story #1 defines `registry/index.json` and its schema (surfacing `knownDeviations`, capabilities, previews for discovery).
- Story #5 (library structure) must reflect the platform-provided base decision (§11.2 / H14).
- Contract §26 O1–O6 tracked for owner sign-off at freeze.
