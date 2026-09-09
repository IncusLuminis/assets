# ADR-0001: HUD Theme Contract 1.0

- Status: Proposed (pending owner freeze — Plan §5 hard gate 1)
- Date: 2026-09-09
- Deciders: HUD Platform owner (freeze + the 2026-09-09 decisions), Coder (authoring)
- Related: `docs/architecture/HUD_Theme_Contract_1.0.md`, Story #4, Epic #22, board `IncusLuminis/projects/7`
- Supersedes: none
- Depends on: HUD Platform Vision 0.3, HUD Platform Architecture 0.3, HUD Platform 0.1 Implementation Plan (§2 d1–d12, §7 A–F), HUD Platform 0.1 Inventory (Story #2, §8 H1–H15), owner decisions dated 2026-09-09

## Context

The HUD Platform replaces per-project HUD implementations with reusable, versioned **HUD Themes** loaded through a shared Runtime (Vision §2, §25). The Architecture (§12, §55) names a single normative document — the **HUD Theme Contract** — as the stable boundary that the Runtime, Registry, Visual Composer, HUD Playground and every consumer must implement instead of inventing private conventions.

Contract 1.0 is **Plan §5 hard gate 1**: no implementation Story in Epics #20/#21/#23/#24 starts until it is frozen (co-frozen with the manifest JSON Schema, #3). The P1 *phase* boundary is the Plan §6 phase table; the *gate* itself is Plan §5. CONTRIBUTING requires an ADR for major architecture decisions.

The Story #2 inventory surfaced ~15 concrete decisions (§8, H1–H15). The owner recorded six decisions on 2026-09-09 (Plan §7 A–F) and, in a review of the first draft of this Contract, **reframed the form-factor model** and closed the open questions. The Contract is authored against the **blogger-template lineage** (owner A) — `widgets/sandbox/blogger-hud01-02-wip/`, `widgets/releases/blogger-pilot-hud03/`, `widgets/panels/hud-10/`, `widgets/shared/`.

## Decision

Adopt `docs/architecture/HUD_Theme_Contract_1.0.md` as the normative, independently versioned (`1.0`) consumer boundary. Key decisions and rationale:

1. **Contract is normative Markdown; the manifest JSON Schema (#3) is a separate artifact it governs.** Prose is the authority; the schema encodes it. Both versioned independently of each other, of Theme versions, of the Runtime, and of the Registry-index schema (Arch §30–31, Plan d7).

2. **Source vs published-package split** (Plan d4). Editable sources in `library/themes/<id>/`; deterministic immutable published package in `dist/themes/<id>/<version>/`. Published versions immutable — any change is a new version (Arch §2.4, §30).

3. **Renderer enum `svg | css | video | static | gadget`; only `svg` and `css` supported in 1.0.** `video/static/gadget` reserved so manifests and Registry listings can exist ahead of Runtime support; a 1.0 Runtime asked to load one MUST fail with `RendererUnsupported` and MUST NOT fall back (Plan d9, Arch §54.16).

4. **Lifecycle `mount → setData → resize → setVariant → destroy`** (Arch §22), with explicit ordering guarantees and a mandatory, idempotent, throw-free `destroy`. The inventory found **no teardown anywhere** in the baseline (Inv §6.5, H10); the Contract puts the teardown obligation on the renderer where a Theme cannot yet expose hooks, with concrete baseline targets enumerated (toolbar `click`, panel `animationend`, `NcHudMini` toggle listeners, the HUD-04 `MutationObserver`, Aladin, `HudPapers` `AbortController`) — and notes there is *no* `keydown` listener in the lineage.

5. **Form-factor model — loose orientations, not exact ratios (owner 2026-09-09).** The Contract uses `orientations: ["landscape", "portrait"]`; the rigid `ratios` / `aspectRatios` field is removed (a manifest containing it is invalid). There is no pixel-exact ratio enforcement anywhere — `preserveAspectRatio="none"` stretch, `@media` reflow and approximate canvas proportions (HUD-10's ~0.63 portrait canvas) are all conformant.

6. **Variant semantics (owner 2026-09-09).** `maxi` = full interface, landscape — REQUIRED. `mini` = miniature copy, landscape — REQUIRED. `micro` = miniature copy, portrait — REQUIRED (this is the "vertical thumbnail" from owner decision C; `micro` is now **in** 1.0, superseding the issue #4 out-of-scope list). The required composition set is `maxi:landscape`, `mini:landscape`, `micro:portrait`.

7. **`mini`/`micro` may be scaled miniatures OR authored compositions — both conformant, any Theme, any engine (owner 2026-09-09).** The `transform: scale()` approach (HUD-01/02/HUD-10 via `NcHudMini`) is the **sanctioned norm**, not a per-Theme exception, and needs no `knownDeviations` entry. A Theme may instead author a genuine distinct composition (HUD-03's `.nc-hp-mini-card`). The earlier engine-scoped "svg family only + knownDeviations" carve-out is removed.

8. **Full portrait `maxi` stays deferred (owner D)** — a Theme MAY declare `maxi:portrait` unsupported with `knownDeviations: no-maxi-portrait`, **except** a portrait-native Theme that already ships a real full portrait composition (HUD-10), which ships it. Adding it later is a non-breaking MINOR bump (Arch §31). No mechanical rotation to fabricate an unauthored composition (Arch §14).

9. **Semantic slots** — a closed standard vocabulary (`title, subtitle, status, primary, secondary, media, visualization, controls, content, footer`); consumers set values only through slots via `setData`, never by targeting Theme-internal DOM (Arch §15, §2.1). `system` folds into `subtitle`, `ticker` into `footer` (Inv H6). Custom slots via `customSlots`.

10. **Owner F — `dataSource` capability.** HUD-01/02 keep fetching their own data from an **object name**, modelled as a declared capability with a **closed provider enum `{simbad, vizier, ads}`** and matching host allowlist — not a "consumer passes rows" refactor. Aladin is declared only by the separate `skyViewer` boolean (never a `dataSource` provider); Google Fonts only by the general §16.2 font allowlist. This confines the Vision §12 "no domain logic in a Theme" tension to a declared, allowlisted, name-in/rendering-out channel (Inv H8).

11. **Owner E — one Theme, `capabilities.modes`.** HUD-01/02's object-viewer vs HTML-frame personalities are one Theme with a `{object, html}` flag, not two Themes (Inv H7). Live post-mount mode switching is out of 1.0 (owner O5) — construct a new `Hud`.

12. **CSS isolation: `scoped-root` is the 1.0 baseline for all Themes.** Shadow DOM is *attempted* only for the `css` family and kept only if the legacy `clip-path`/`drop-shadow`/`float` survive it (validated, not assumed; records `knownDeviations: shadow-dom-fallback` if it falls back — Plan d8). Shadow DOM is **not** used for HUD-01/02 (Aladin injects into `document.head`, uses `window` globals — Inv H3/H11). Host-wide `body`/`html`/`*`/`:root` selectors from the legacy shared layer are stripped/root-scoped at packaging; shared `@keyframes` are owned and de-duplicated by a **platform-provided versioned base** injected once per page (owner O4, Inv H12/H14) — Themes declare `baseVersion` (exact or caret range only).

13. **`overflowVisible` flag** — a conformant manifest boolean; a Theme MAY paint decoration outside its box (SVG glow runner, `drop-shadow` frames); the renderer MUST NOT hard-clip such a mount; validation's overflow check respects the flag. No deviation entry needed (Inv H13).

14. **JavaScript policy** (Arch §43): executable Themes load only from the controlled Registry; the §16.2 external-host allowlist (fonts, Aladin, CDS data services, HeyGen/YouTube/Vimeo) is **normative** and MAY be used without per-Theme manifest allowlisting (owner 2026-09-09, Plan Q4). Network during mount is permitted for allowlisted hosts (`knownDeviations: external-io-on-mount`) because Google Fonts + SIMBAD both fire at page load.

15. **Instances per page (owner 2026-09-09).** Single-instance is **fully conformant** — not a defect, not a validation requirement. Multi-instance is **supported where a Theme provides a per-widget factory**: the blogger lineage `NcHud01.init(widget, cfg)` is one; HUD-03/04 support multiple panels because `NcHudMini.init({widget, panel})` is per-widget and the per-post snippet guards with `:not([data-hud-init])` (the `blogger-hud03-template.js` module itself is only the `NcHudMini` toggle, not a factory). A Theme declaring `capabilities.multiInstance: true` MUST scope all state to its container and cooperatively share page-load head insertions. Defined 0.2 path via instance factory (Inv H15).

16. **Consumer API**: imperative `new Hud({theme, version, variant, orientation, config})` + `mount/setData/resize/setVariant/destroy` (Arch §25, Plan d10). The `<nebula-hud>` Web Component adapter is out of 1.0 (Platform 0.2), noted as a purely additive future extension.

17. **Error model**: the full `ThemeNotFound … ThemeRuntimeError` set (Arch §45); `RatioUnsupported` keeps its Arch §45 name but is defined in terms of orientation. A failed HUD fails locally and never breaks the host (Vision §18).

18. **`knownDeviations[]`** is the formal, closed-set, machine-readable mechanism for a 1.0 Theme to declare accepted Contract compromises so validation passes deliberately. The 1.0 recognised set shrank to `no-maxi-portrait`, `no-maxi-landscape`, `external-io-on-mount`, `shadow-dom-fallback`, `shared-base-host-selectors-stripped` (scaled miniatures, single-instance and `overflowVisible` are conformant and need no entry). An unrecognised code fails validation.

19. **Contract is independent of Visual Composer's internal document model** (Arch §35, §53.5, §2.2). Any field the Runtime does not need stays out of the manifest.

All six items previously in the Contract's "Open for owner" section were resolved by the owner on 2026-09-09 (micro in; multiInstance not a mandate; HUD-10 ships its portrait maxi; platform-provided base; no post-mount mode switching; media allowlist = HeyGen/YouTube/Vimeo). The §0 freeze box is the only outstanding owner action.

## Consequences

### Positive

- Every downstream Story (#3 schema, #8 Runtime, #9/#10 renderers, #11–#15 packaging, #14/#16 Playground, #17 consumer) has one authoritative boundary; codebases across three repos cannot drift into incompatible local conventions (Arch §55).
- The orientation model removes an entire class of contradiction: there is no exact ratio left for a stretched/reflowed baseline composition to violate, and HUD-10 stops being a special case (it is just a portrait-native Theme).
- The Contract is proven authorable, not aspirational: §25 cross-checks HUD-01/02/03/10 (and HUD-04) into manifest+Contract terms with only owner-sanctioned deviations.
- Sanctioning scaled miniatures for `mini`/`micro` matches what the baseline lineage actually does and removes the pressure to author four+ genuinely distinct low-density compositions for 1.0.
- Independent versioning means Themes iterate for many releases at `contractVersion 1.0`; additive Contract changes (new slot, host, capability, the Web Component adapter, promoting `video`) are MINOR bumps that don't invalidate existing Themes or Runtimes.
- The platform-provided versioned base removes the `@keyframes`-collision and drift risk that per-Theme vendoring would multiply.
- Closing all six open questions means the freeze is a clean gate, not "freeze with caveats".

### Negative

- `micro` (portrait miniature) is now a **required** deliverable for every 1.0 Theme — the baseline landscape panels must each ship a portrait micro composition (scaled is allowed, which limits the cost).
- Full portrait `maxi` compositions still must be **authored from scratch** for HUD-01/02/03/04 whenever the `no-maxi-portrait` deferral is lifted — they cannot be derived.
- `dataSource` keeps domain logic (astronomy queries) inside a Theme, against the pure Vision §12 model. It is bounded by a closed provider enum and a host allowlist, but it is a precedent other Themes may lean on.
- The renderer-owns-teardown fallback (because the baseline Themes expose no hooks) pushes real complexity into #9/#10: tracking listeners/observers/timers around unchanged Theme code.
- Shadow DOM for the CSS family is "attempt and validate" — the outcome (kept vs `shadow-dom-fallback`) is not known until #10, so the isolation story for HUD-03/04 is provisional at freeze.
- Removing the rigid ratio field means the Contract no longer enforces *any* proportion; a Theme could ship a near-square "landscape" and a near-square "portrait". This is the owner's explicit call ("nobody nitpicks pixels") but it weakens the form-factor guarantee to consumers.

### Neutral / follow-ups

- Story #3 encodes §3/§27 as `registry/schemas/manifest.schema.json` and is co-frozen at the gate; §27.8 lists 14 cross-field rules, §27.9 the closed slot enum.
- Story #1 defines `registry/index.json` and its schema (surfacing `knownDeviations`, capabilities, previews for discovery).
- Story #5 (library structure) must reflect the platform-provided base decision (§11.2).
- Contract §26 records all owner resolutions; only the §0 freeze remains.
