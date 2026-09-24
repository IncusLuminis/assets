# HUD Platform: Phase 1 completion audit + Phase 2 scoping draft

**Status:** Product Owner draft — for owner review. Nothing here is scheduled or built yet. Section A is a factual audit (verified against the real, current code/Contract/manifests — every claim below was checked directly, not assumed). Section B is a first-pass spec for what a real Epic/Story breakdown would need to answer.

**Context:** the owner reformulated the platform's scope on 2026-09-24. Restated here for a shared baseline (correct me if this misreads intent):

- **4 engine types**: `svg`, `css` (existing, Contract 1.0), `bitmap`, `webm` (new — see §A.3, these map onto Contract's already-reserved `static`/`video` engine slots).
- **3 states**: `maxi` (full size), `mini`, `micro` — switched via a **toggle button embedded in the HUD's own top-left corner**.
- **2 orientations**: `portrait`/`landscape`.
- **A "HUD Theme"** is self-contained: it bundles the widgets for every state × orientation combo for one engine type.
- **Frame sizing**: fills the container's width, scales height proportionally.
- **Content**: Text/HTML/Image/Video/HeyGen/Object, injected into the frame by a script, authorable/testable in HUD Playground. The frame is a content container; content is separate from frame.
- **Phase 1**: finish HUD-01..04 (svg/css) + full `micro` support for every content type.
- **Phase 2**: a mechanism, built into HUD Playground, for adding and editing HUD Themes of all 4 engine types.

---

## A. Phase 1 — what's actually left (audited against real code, 2026-09-24)

### A.1 — Architecture conflict: the embedded toggle vs. the frozen Contract (read this first)

**This is the single biggest finding and affects both phases.** The reformulated vision describes the maxi/mini/micro toggle as **intrinsic to the HUD** — a button the HUD itself renders, in its own top-left corner, that switches its own state without any external call.

The **frozen** HUD Theme Contract 1.0 says the opposite, explicitly:

> §7.2: "A `maxi` composition MUST render fully expanded with **no collapse toggle** and no `is-mini` state."

Today, state switching is **100% external**: the consumer (or, in the Playground's case, the sidebar's Variant dropdown) calls `Hud.setVariant("mini")` from *outside* the mounted HUD. Maxi/mini/micro are three separately **authored compositions**, not one composition with a JS-driven expand/collapse toggle baked in. This is a deliberate Contract 1.0 design choice (see also §16.5 "no page-global state," the `RendererLifecycle.setVariant()` contract) — it exists so a HUD never needs to know *why* it's being resized, and so multiple instances of the same HUD on one page can each be independently controlled by whatever embeds them.

The **legacy** widgets (`widgets/panels/hud-01`, pre-Contract, what "Local" mode in the merged Playground still drives) DO have exactly the intrinsic top-left toggle the owner is now describing (`.nc-ol-toggle-btn`/`.nc-or-toggle-btn`, click-to-expand, `NcHudMini` module) — this is precisely the piece of the legacy design that Contract 1.0 consciously did **not** carry forward when HUD-01..04 were packaged (Story #11-#15).

**This needs an explicit owner decision before Phase 1 "finishing" can even be scoped, because it changes what "finished" means:**

- **Option 1 — keep Contract 1.0 as frozen.** State switching stays external/Runtime-driven. An embedded toggle, if wanted for real external-site embedding (a site owner drops in one `<script>` snippet and expects a working toggle with no extra JS), would need to be a **thin wrapper the Runtime or a Web Component adapter provides** (Plan §2 decision 10 already reserves a `<nebula-hud>` Web Component adapter for 0.2 — this could absorb the toggle-button chrome + `setVariant()` call, so the *Theme* itself still never renders a toggle, but the *embed snippet* one copy-pastes does). This preserves every already-frozen guarantee (§7.2, multi-instance isolation, no Theme-owned page-global state) and is the smaller change.
- **Option 2 — amend Contract 1.0** to permit (or require) an intrinsic Theme-rendered toggle. This is a real Contract change (not a Theme change) — it touches §7.2, the renderer lifecycle, probably the isolation model (a Theme-owned click handler that calls back into the Runtime needs a defined hook that doesn't exist today), and arguably the whole "who owns state" model the Contract is built around. Bigger, slower, and revisits a decision the owner already made and froze once.

**Recommendation: Option 1.** It gets to the same end-user outcome (a real external site embeds one HUD and gets a working toggle) without reopening a frozen, carefully-reasoned spec. But this is the owner's call, not something to default silently — flagging it as **open question #1** below.

### A.2 — `micro` is real but effectively untested for the content types that matter most

The manifests genuinely declare `micro:portrait` as supported, and the composition markup exists, for all 4 Themes. But:

- **`mediaEmbed` (YouTube/HeyGen) has never been exercised at `micro` for any Theme.** Checked directly: hud-01's and hud-02's Story #43 e2e tests (`tests/unit/hud-0{1,2}-e2e.test.js`, the "Story #43" describe blocks) all mount at the default `variant: "maxi"` — none of them test `setData({ media: <embed-url> })` at `micro`. hud-04's e2e suite has one `micro:portrait` mount test, but it only asserts the composition's static structure exists (title slot, media slot, the `RECONNECTING…` placeholder) — it never calls `setData({ media })` at micro and checks what actually happens.
- **What "an embed at micro" should even look like is an open design question, not just a missing test.** hud-01/02's `micro/portrait/hud.html` is an ~87×130px thumbnail with `<img data-slot="media">`. `mountMediaEmbed` (the shared module from Story #43) hides that `<img>` and inserts a full iframe next to it — a live YouTube/HeyGen iframe in an 87×130px box is not a real usable UI. The likely right behavior is "no live embed at micro, show a static poster/placeholder instead" — but nothing enforces or even documents that today; it would currently just render a tiny, probably-broken-looking iframe.
- **Object mode (hud-01/02) at `micro`**: works structurally (SIMBAD/reticle chrome exists in the micro composition) but has not been specifically re-verified against the same failure-mode tests (SIMBAD fetch race conditions, Aladin CDN failure) that `maxi`/`mini` already have from Story #36. Not necessarily broken — genuinely unverified.
- **Plain `content`/`media`-as-photo at `micro`**: this one is fine — already covered by real e2e assertions for all 4 Themes.

**Phase 1's "micro for all content types" is therefore not a small polish pass — it's: (a) decide what an embed should degrade to at micro, (b) implement that degradation, (c) write the missing test coverage, (d) re-verify object-mode's async paths at micro specifically.**

### A.3 — `bitmap`/`webm` engines: zero implementation exists, not partial

Mapping the owner's new vocabulary onto the Contract's existing (frozen) engine enum: `bitmap` = Contract's `static`, `webm` = Contract's `video`. Both are declared in the Contract (§5) as **"Reserved — unsupported."** Checked the actual code: `StaticRenderer.ts` and `VideoRenderer.ts` both extend `ReservedEngineRenderer` and do nothing but throw `RendererUnsupportedError` on every lifecycle call except `destroy()`. There is no partial groundwork to build on — no manifest-shape precedent for what a bitmap/webm composition even looks like, no test fixtures, no README, nothing. This is 100% net-new engine design and implementation, not a "finish it" task, and its scope is comparable to the original `svg`/`css` renderer work (Stories #9/#10) — it is not a small Phase 1 add-on.

**This matters directly for Phase 2**: an authoring tool that lets someone "add a new bitmap or webm HUD" is not meaningful until the Runtime can actually mount one. See open question #2.

### A.4 — Orientation coverage is real but narrow — confirm this is intentional before calling Phase 1 "done"

Checked all 4 manifests directly: **every single one** supports exactly the same 3 of 6 possible variant×orientation combinations — `maxi:landscape`, `mini:landscape`, `micro:portrait` — and declares the other 3 (`maxi:portrait`, `mini:portrait`, `micro:landscape`) unsupported via the Contract's `knownDeviations` escape hatch (`no-maxi-portrait` etc. — this mechanism is already symmetric in the frozen Contract text, an earlier session note flagging it as asymmetric turned out to be resolved by freeze time). HUD-10 (Contract's reference portrait-native Theme) is specified in the Contract but **not yet packaged** — `library/themes/` has no `hud-10` directory.

If the owner's restated vision ("HUD темы... для указанного типа" bundling every state×orientation) means every Theme should eventually offer full `portrait` maxi/mini too, that's real, currently-undone authoring work on top of everything in §A.2 — not implied by anything already in flight. Flagging as **open question #3**.

### A.5 — Frame responsive sizing: already built, not a gap

The owner's "frame fills container width, scales height proportionally" requirement is already the Contract's existing (frozen) design and, as far as could be checked, already the real behavior: SVG compositions use `preserveAspectRatio="none"` stretch, CSS compositions use `@media` reflow, and there is deliberately no pixel-exact aspect-ratio enforcement (Contract §8, owner decision 2026-09-09). Verified for hud-03 specifically via a real headless-Chromium Playwright suite (`tests/e2e/css-renderer-hud-03.spec.ts`). Not calling this out as a Phase 1 task — it already satisfies the restated requirement.

### A.6 — Phase 1 punch list (assuming Open Question #1 → Option 1)

- [ ] Design + implement the micro-embed degradation behavior (§A.2) — likely "no live iframe at micro, static poster/placeholder instead" — across hud-01, hud-02, hud-04.
- [ ] Test coverage: `mediaEmbed` at `micro` (all 3 Themes that declare it), object-mode async paths at `micro` (hud-01/02).
- [ ] `<nebula-hud>` Web Component adapter (or equivalent) that owns the toggle-button chrome + drives `setVariant()` — the Option-1 answer to the intrinsic-toggle ask. This was already reserved for "0.2" in the original Plan; the owner's new requirement makes it load-bearing for Phase 1 rather than a nice-to-have.
- [ ] Decide + record whether full portrait coverage (§A.4) is in scope for "Phase 1 done" or deferred again.

---

## B. Phase 2 — HUD Playground authoring/editing mechanism (spec draft)

This section is intentionally a **draft for the owner to react to**, not a final spec — it's shaped so it can become Epics/Stories once the open questions below are answered, not so it can be built as-is.

### B.1 — What "add/edit a HUD Theme in the Playground" has to actually produce

A HUD Theme, per the existing (frozen) Contract, is: a `manifest.json` (slots, capabilities, compositions, entrypoints) + a directory of markup/CSS/JS per supported variant×orientation composition. An authoring tool that's honest about this has two very different jobs, which should probably be scoped as separate Stories even if they end up in the same UI:

1. **Manifest/capability authoring** — id, name, engine, variants/orientations/compositions matrix, slots (standard + custom), capabilities (`modes`, `mediaEmbed` hosts, `dataSource`, etc.). This is essentially structured form-editing over a schema-validated JSON document — genuinely tractable as a Playground feature, and it directly extends work already done this session (the "Контент" archetype picker already reads a manifest's capabilities generically; a manifest *editor* is the natural next step from a manifest *reader*).
2. **Composition authoring** (the actual HTML/CSS/JS per variant×orientation) — this is real visual/frontend design work, not form-filling. For `svg`/`css` engines, today's Themes were hand-built by porting real pre-existing legacy widget markup (Stories #11-#15) — there was always a real design to copy from. A "create a brand-new HUD composition from scratch in the Playground" tool is a different, much larger problem (something closer to a visual builder) than "edit an existing one's metadata." Recommend scoping Phase 2 first around **editing/extending compositions that already exist** (e.g., "add a `mini:portrait` composition to an existing Theme," "swap out title styling") rather than "author a whole new Theme's visuals from a blank canvas" — the latter is a much bigger, separate ask worth its own explicit go/no-go.

### B.2 — Hard dependency: `bitmap`/`webm` need a real Runtime renderer before they need an authoring UI

Per §A.3, there is no `bitmap`/`webm` rendering capability at all today. Building "add a new webm HUD" into the Playground before the Runtime can mount one authors UI for a feature that cannot work. **Recommend**: real `StaticRenderer`/`VideoRenderer` implementations (mirroring the scope of the original Story #9/#10 `svg`/`css` work) are a prerequisite Epic, sequenced before or alongside Phase 2's authoring-tool Epic — not something Phase 2 can treat as already-solved groundwork.

### B.3 — Where a newly-authored Theme lives / how it reaches the Registry

Today, a Theme becomes real by: living under `library/themes/<id>/`, passing `npm run build:all` (Story #1's pipeline, includes manifest schema validation), and being deployed via `scripts/deploy/deploy-registry.sh` to the live CDN (issue #6). A Playground-based "add a new Theme" feature needs an answer for: does it write files into a real `library/themes/` checkout on someone's machine (requiring a local `assets` checkout + the existing build/deploy tooling, same as everything else this session), or does it need its own storage/publish path independent of that pipeline? Recommend the former (reuse the existing pipeline — consistent with this project's standing reuse-existing-infra practice) unless there's a reason a browser-only tool can't shell out to `npm run build:all`/`deploy-registry.sh` — flagging as **open question #4**.

### B.4 — What Phase 2 is NOT (explicitly out of scope until stated otherwise)

- Multi-Theme visual composition/layout tooling (arranging several HUDs on a page) — separate from this Theme-authoring ask.
- Non-owner/self-serve publishing (anyone-can-publish-to-the-shared-CDN) — the existing deploy tooling assumes a trusted human operator; Phase 2 shouldn't quietly turn the Playground into a public publishing surface.
- Versioning/rollback UI for published Themes — the Registry already has version history; editing an already-*published* version's compositions in place would violate the immutable-versioned-asset assumption baked into the CDN's cache policy (issue #6) and the Registry schema itself. Editing should always produce a new version.

---

## Open questions for the owner

1. **Intrinsic toggle**: Option 1 (Web Component/embed-snippet owns the toggle, Contract 1.0 stays as frozen) or Option 2 (amend the frozen Contract to allow a Theme-rendered toggle)? Recommendation: Option 1.
2. **`bitmap`/`webm`**: confirm these become a real prerequisite Epic (Runtime renderer implementation, comparable in size to the original `svg`/`css` work) before or alongside Phase 2's authoring UI, not folded into "Phase 2 just needs a form."
3. **Portrait coverage**: is full `maxi:portrait`/`mini:portrait` authoring for HUD-01..04 part of "Phase 1 done," or still deferred (as it has been since the original Contract freeze)?
4. **Phase 2 storage/publish path**: reuse the existing local-checkout + build + deploy pipeline (recommended), or does Phase 2 need its own?
5. **Phase 2 composition authoring scope**: start with editing-existing-compositions only (recommended), or is from-scratch visual authoring actually wanted for Phase 2 itself?

Once these are answered, B.1-B.4 (plus the Phase 1 punch list in A.6) translate fairly directly into Epics/Stories on the existing `IncusLuminis/projects/7` board, following the same Coder/Validator dispatch pattern used for every Story so far.
