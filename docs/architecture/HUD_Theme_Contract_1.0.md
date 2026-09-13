# HUD Theme Contract 1.0

**Status:** Draft — awaiting owner freeze (see §0)
**Contract version:** `1.0`
**Document type:** Normative specification
**Depends on:** HUD Platform Vision 0.3, HUD Platform Architecture 0.3, HUD Platform 0.1 Implementation Plan 0.1, HUD Platform 0.1 Existing HUD Implementation Inventory (Story #2)
**Consumed by:** HUD Runtime, HUD Registry / CDN, Visual Composer, HUD Playground, consumer applications
**Defines:** the stable boundary between a HUD Theme and everything that loads, renders, validates, publishes or consumes it

---

## 0. Owner freeze

Contract 1.0 is a **Plan §5 hard gate 1**. No implementation Story in Epics #20 / #21 / #23 / #24 (Runtime, renderers, packaging, publication, Playground, external consumer) may start until the owner records the freeze here, co-frozen with the manifest JSON Schema (#3). (The P1 *phase* boundary is the Plan §6 phase table; the *gate* itself is Plan §5.)

```
[x]  HUD Theme Contract 1.0 is FROZEN.
     Owner: ____________________    Date: ____________
     Co-frozen with: registry/schemas/manifest.schema.json  version ______
```

All items previously logged in §26 "Open for owner" were resolved by owner decisions dated 2026-09-09 (see §26). The freeze box above is the only outstanding owner action.

Until this box is checked the Contract is a review draft. After it is checked, changes follow §24 (additive evolution; breaking changes require Contract `2.0`).

---

## 1. Purpose & status

### 1.1 What this document is

This Contract is the **normative consumer boundary** for the HUD Platform (Vision §25, Architecture §12, §55). It is the prose authority that the manifest JSON Schema (#3) encodes, that the Runtime (#8) implements, that the renderers (#9/#10) satisfy, that packaging (#11–#15) targets, and that validation (#19) checks against.

It is **Markdown, not code.** It contains no application code and nothing outside `docs/`. The machine-readable manifest schema is a separate artifact (`registry/schemas/manifest.schema.json`, Story #3) that this Contract references and governs.

### 1.2 Normative language

Every requirement uses RFC 2119 / RFC 8174 keywords: **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, **MAY**, **OPTIONAL**. Each normative statement is traceable to a Vision or Architecture section, an Implementation Plan decision, or a dated owner decision, cited inline as `[Arch §NN]`, `[Vision §NN]`, `[Plan d N]`, `[Plan A–F]`, `[Inv H NN]`, or `[owner 2026-09-09]`.

Non-normative material (examples, rationale, notes) is marked *Note:* or shown as fenced examples.

### 1.3 Independent versioning

The Contract version is **independent** of every other version in the platform [Arch §30, §31]:

| Version axis | Owned by | 1.0 value |
|---|---|---|
| **Contract version** | this document | `1.0` |
| Manifest schema version (`schemaVersion`) | `registry/schemas/manifest.schema.json` (#3) | `1.0` (co-frozen, but bumped independently thereafter) |
| Registry index schema version | `registry/schemas/registry-index.schema.json` (#1) | `1.0` |
| Theme version (`version`) | each Theme, SemVer | per Theme, e.g. `1.0.0` |
| Runtime version | `@incus/hud-runtime` package | `0.x` during Platform 0.1 |
| Shared foundation / base version (`baseVersion`) | platform base package (§11) | `1.x` |

A Theme MUST declare which Contract version it targets (`contractVersion`, §5.3). The Runtime MUST refuse a Theme whose `contractVersion` major it does not implement, failing with `ContractUnsupported` (§20).

*Note:* "Platform 0.1" is a delivery milestone, not a version of this Contract. This document is called "1.0" because it is the first frozen Contract; the Platform 0.1 scope decisions it bakes in (SVG+CSS only, portrait full `maxi` deferred, etc.) are expressed as Contract rules and `knownDeviations`, not as a separate "0.1 profile".

### 1.4 Form-factor model — reframed 2026-09-09

The owner reframed the form-factor model on 2026-09-09 [owner 2026-09-09]: the Contract uses **loose orientations** (`landscape` / `portrait`), **not** exact aspect ratios. There is no pixel-exact ratio enforcement anywhere. `preserveAspectRatio="none"` stretch, `@media` reflow, and approximate canvas proportions (HUD-10's portrait canvas is ~0.63, not 0.5625) are all conformant. The owner's direction: proportions need not be held precisely; nobody nitpicks pixels. See §8.

---

## 2. Canonical Theme package structure

### 2.1 Source vs published package

A Theme exists in two forms [Plan d4, Arch §7, §2.3, §2.4]:

| Form | Location | Editable? | Immutable? |
|---|---|---|---|
| **Source** | `library/themes/<id>/` in the Shared Asset Repository | YES — hand-edited or Visual-Composer-authored | no |
| **Published package** | `dist/themes/<id>/<version>/` → deployed to `…/themes/<id>/<version>/` on the Registry/CDN | NO — generated build artifact | YES, once published |

- The published package MUST be produced by the build pipeline from the source; it MUST NOT be hand-edited [Arch §2.3, §32].
- The published package layout MUST be **deterministic**: the same source at the same commit MUST produce a byte-identical package (modulo timestamps the pipeline controls) [Arch §10].
- `dist/` MUST NOT become a source of truth and is gitignored [Arch §7, Plan d3].
- The source layout MAY differ from the published layout; only the **published** layout below is normative for consumers and the Runtime.

### 2.2 Published package layout (normative)

Per Architecture §7, §10 and Vision §7, with orientation directories:

```
themes/<id>/<version>/
├── manifest.json            REQUIRED — the authoritative descriptor (§3)
│
├── maxi/                    REQUIRED
│   ├── landscape/           REQUIRED
│   └── portrait/            OPTIONAL in 1.0 — MAY be declared unsupported (owner D, §8.3)
├── mini/                    REQUIRED
│   └── landscape/           REQUIRED
│   └── portrait/            OPTIONAL
├── micro/                   REQUIRED
│   └── portrait/            REQUIRED
│   └── landscape/           OPTIONAL
│
├── assets/                  OPTIONAL — Theme-local binary/text assets
│   ├── images/  video/  svg/  textures/
├── styles/                  OPTIONAL — shared-across-composition CSS
├── scripts/                 OPTIONAL — Theme JavaScript (§16)
├── preview/                 OPTIONAL — static preview images / poster frames
└── sources/                 OPTIONAL — non-runtime authoring sources, excluded from runtime resolution
```

Rules:

1. `manifest.json` MUST exist at the package root [Arch §11].
2. Directories a Theme does not use MAY be omitted [Arch §10]. Every `<variant>/<orientation>/` directory that the manifest's `compositions` map marks `supported: true` MUST exist and MUST contain the files its `entrypoints` list.
3. Orientation directory names are `landscape` and `portrait`; the corresponding manifest tokens are identical (`landscape`, `portrait`).
4. `sources/` and any path in the build's exclude set MUST NOT be required for runtime rendering and MAY be omitted from the deployed package entirely [Arch §44].
5. All runtime paths in the manifest MUST be **relative to the package root** and MUST NOT use `../` or absolute URLs (external hosts are declared separately, §3.13, §16).

### 2.3 Determinism & caching

A published version directory is immutable (§4.4) and MUST be safe for aggressive immutable caching [Arch §34]. Mutable discovery metadata (`registry/index.json`) is served with a short cache policy and is not part of a Theme package.

---

## 3. Manifest field enumeration

The manifest (`manifest.json`) is the **authoritative machine-readable description** of the Theme [Arch §11, §54.11]. This section is the prose authority; Story #3 encodes it as JSON Schema. Where this section and the schema disagree, **this section wins** until the Contract is revised.

All keys are camelCase. Unknown top-level keys MUST be rejected by validation (`ManifestInvalid`) but the Runtime SHOULD ignore unknown keys it does not use, to allow additive evolution [Arch §2.5].

### 3.1 Field table

| Field | Type | Req. | Meaning |
|---|---|---|---|
| `schemaVersion` | string `"MAJOR.MINOR"` | REQUIRED | Version of `manifest.schema.json` this manifest conforms to. Independent of `contractVersion` and `version` [Arch §30]. |
| `contractVersion` | string `"MAJOR.MINOR"` | REQUIRED | HUD Theme Contract version the Theme targets, e.g. `"1.0"`. The Runtime MUST reject a major it does not implement (`ContractUnsupported`). |
| `id` | string | REQUIRED | Theme identifier. Rules in §4.1. |
| `name` | string | REQUIRED | Human-readable display name, e.g. `"Object Lock"`. Not an identifier. |
| `version` | string SemVer `"MAJOR.MINOR.PATCH"` | REQUIRED | Theme version. Immutable once published (§4.3–4.4). |
| `description` | string | OPTIONAL | One-line summary for Registry discovery UIs. |
| `engine` | string enum | REQUIRED | Renderer identifier: `svg` \| `css` \| (`video` \| `static` \| `gadget` — reserved, unsupported in 1.0). §5. |
| `baseVersion` | string — exact SemVer or caret range | REQUIRED | Which platform shared-foundation ("base") version the Theme expects (§11) [Inv H14]. |
| `variants` | array of string enum | REQUIRED | Subset of `["maxi","mini","micro"]`; in 1.0 MUST include all three [owner 2026-09-09]. §7. |
| `orientations` | array of string enum | REQUIRED | Subset of `["landscape","portrait"]`; in 1.0 MUST include both [owner 2026-09-09]. §8. |
| `compositions` | object | REQUIRED | Map `"<variant>:<orientation>" → composition object` (§3.9). One entry per `variants` × `orientations`. |
| `slots` | object `{required:[],optional:[]}` | REQUIRED | Declared semantic slots (§9). Either list MAY be empty. |
| `customSlots` | array of custom-slot objects | OPTIONAL | Theme-defined slots beyond the standard vocabulary (§9.4). |
| `capabilities` | object | REQUIRED | Declared capability flags (§3.11, §10, §11). Absent capability = capability not present. |
| `entrypoints` | object | REQUIRED | Ordered load lists per supported composition (§3.10). |
| `externalResources` | array | OPTIONAL | Hosts the Theme loads from, with kind + timing (§3.13, §16). |
| `animations` | array of string | OPTIONAL | Names of shared `@keyframes` / animation identifiers the Theme consumes (§15.6) [Inv H12]. |
| `isolation` | string enum | REQUIRED | `scoped-root` \| `shadow-dom` \| `shadow-dom-preferred` \| `iframe` (§15) [Inv H11]. |
| `overflowVisible` | boolean | OPTIONAL (default `false`) | `true` = the Theme paints decoration outside its bounding box; the renderer MUST NOT hard-clip the mount (§15.5) [Inv H13]. |
| `knownDeviations` | array of deviation objects | OPTIONAL | Formal declarations of where the Theme does not fully meet this Contract (§22). |
| `preview` | object | OPTIONAL | `{ "<variant>:<orientation>": "preview/<file>" }` static preview images. |
| `metadata` | object | OPTIONAL | Free-form non-normative tags/categories for discovery. Ignored by the Runtime. |

### 3.2 `schemaVersion` vs `contractVersion` vs `version`

These are three orthogonal axes [Arch §30, §31]. Validation MUST check all three are present and well-formed. A Theme MAY, over many `version` releases, keep the same `contractVersion` and `schemaVersion` [Vision §17].

### 3.3 (removed)

*The rigid `ratios` / `aspectRatios` field is removed in 1.0. Form factor is expressed by `orientations` (§3.1, §8). A manifest containing `ratios` or `aspectRatios` MUST fail validation (`ManifestInvalid`) with a message pointing to `orientations`.*

### 3.4 `id`

See §4.1 for the grammar. MUST be unique in the Registry. MUST equal the `<id>` path segment of the package.

### 3.5 `name`

Display only. MAY contain spaces and mixed case. MUST NOT be used by any consumer as a key.

### 3.6 `version`

Strict SemVer 2.0.0 `MAJOR.MINOR.PATCH`, no pre-release or build metadata in 1.0. MUST equal the `<version>` path segment of the package. Immutable (§4.3).

### 3.7 `engine`

Exactly one value (§5). A Theme is single-engine in 1.0; composite/multi-engine Themes are out of scope.

### 3.8 `baseVersion`

The platform provides a **versioned shared foundation** ("base": reset-scoping, tokens, shared `@keyframes`, `.nc-panel-sweep`, `hud-core.js`, `NcHudMini`, `hud_papers.js` where used) that the Runtime injects **once per page** (§11) [Inv H14, Plan §3]. The Theme declares the base version it was authored against as an **exact version** (`1.2.0`) or a **caret range** (`^1.2.0`). Tilde (`~`) and other range operators are not permitted in 1.0. The Runtime MUST resolve a compatible base or fail with `AssetLoadFailed` (§20). `baseVersion` is REQUIRED even for a nominally self-contained Theme, so the compatibility check is always explicit.

### 3.9 `compositions`

```jsonc
"compositions": {
  "maxi:landscape":  { "dir": "maxi/landscape",  "supported": true },
  "maxi:portrait":   { "supported": false, "reason": "portrait-maxi-deferred-1.0" },
  "mini:landscape":  { "dir": "mini/landscape",  "supported": true },
  "mini:portrait":   { "supported": false, "reason": "not-authored" },
  "micro:landscape": { "supported": false, "reason": "not-authored" },
  "micro:portrait":  { "dir": "micro/portrait", "supported": true }
}
```

- Keys are `"<variant>:<orientation>"` for **every** combination in `variants` × `orientations` (in 1.0 that is all 6 pairs).
- Each value is an object: `dir` (string, package-relative, REQUIRED when `supported` is `true`), `supported` (boolean, REQUIRED), `reason` (string, REQUIRED when `supported` is `false` — SHOULD reference a `knownDeviations` entry or a Contract clause).
- The **REQUIRED** set that MUST be `supported: true` for every 1.0 Theme (§7, §8): `maxi:landscape`, `mini:landscape`, `micro:portrait`.
- `maxi:portrait` MAY be `supported: false` in 1.0 (owner D, §8.3) **unless the Theme already ships a real full portrait composition** (HUD-10), in which case it is `supported: true`.
- A composition marked `supported: false` that is later requested MUST fail with `RatioUnsupported` (§20) — never a rotated/scaled fallback (§8.4).

### 3.10 `entrypoints`

The **order of loading is significant** [Inv §1.3, §3] — CSS cascade and script dependency order both matter. Therefore `entrypoints` is an **ordered list per composition**, not a set.

```jsonc
"entrypoints": {
  "maxi:landscape": {
    "styles":  ["styles/frame.css", "maxi/landscape/layout.css"],
    "markup":  "maxi/landscape/hud.html",   // ".svg" or ".html" for engine "svg"; ".html" fragment for "css"
    "scripts": ["scripts/hud-01.js"]
  }
}
```

- `styles`: ordered array of package-relative CSS files, applied in array order **after** the shared base (§11).
- `markup`: exactly one package-relative entry document. For `engine: "svg"` it hosts an inline `<svg>` plus an HTML/CSS content layer [Inv §2.1]. For `engine: "css"` it is an `.html` fragment.
- `scripts`: ordered array of package-relative JS files, executed in array order after `markup` is in the DOM and after any base scripts. MAY be empty.
- Every path MUST resolve inside the package (`EntrypointMissing` at runtime; hard failure at publication, §19).
- A Theme MAY reuse a file across compositions.
- `entrypoints` MUST have exactly one key per composition that is `supported: true`, and MUST NOT have keys for unsupported compositions.

### 3.11 `capabilities`

Object of boolean or object-valued flags. Standard flags for 1.0:

| Capability | Type | Meaning |
|---|---|---|
| `animation` | boolean | Theme runs continuous animation (affects validation's animation-cleanup check). |
| `interactive` | boolean | Theme has user-interactive controls (tabs, toggles). |
| `background` | boolean | Theme is intended as a background layer with content composed over it. |
| `htmlSlot` | boolean | Theme exposes a freeform `content` slot that accepts arbitrary consumer HTML (§9.3) [Inv §1.8, H7]. |
| `dataSource` | object | Theme fetches its own data from an allowlisted host set (§10) [owner F, Inv H8]. |
| `skyViewer` | boolean | Theme embeds an Aladin Lite sky viewer driven by a coordinate/name input (§10.4) [Inv §1.5]. |
| `mediaEmbed` | object | Theme embeds third-party media iframes (HeyGen / YouTube / Vimeo) (§10.5) [Inv §1.30]. |
| `modes` | object | Theme has more than one composition personality selectable by config (§11.1, owner E) [Inv §1.8, H7]. |
| `multiInstance` | boolean | Theme supports more than one instance per page via a per-widget factory (§16.5) [Inv H15]. Absent = single-instance; not a defect. |

Absent = not present. An unknown capability key MUST fail validation but SHOULD be ignored by a Runtime that does not implement it.

### 3.12 `animations`

Array of animation identifiers (shared `@keyframes` names such as `hudBreath`, `hudPanelSweep`, `hudRotate`, `hudPulseOuter`) the Theme's CSS references but does not itself define [Inv §3, §2.3.3]. Used by the base-injection / namespacing machinery (§15.6) and by validation to confirm every referenced keyframe is provided by the declared `baseVersion` or by the Theme's own `styles`.

### 3.13 `externalResources`

Array of objects; each:

```jsonc
{ "host": "aladin.cds.unistra.fr", "kind": "script", "timing": "lazy", "required": false, "note": "Aladin Lite v3" }
```

- `host`: bare hostname (no scheme, no path). MUST be on the platform allowlist (§16.2) OR the Theme MUST carry a `knownDeviations` entry justifying it.
- `kind`: `script` \| `style` \| `font` \| `fetch` \| `iframe`.
- `timing`: `page-load` (loads during mount) or `lazy` (loads on later interaction).
- `required`: `true` if the Theme cannot render its primary content without it.
- Declaring `externalResources` is **OPTIONAL** in 1.0 for the known-host set (§16.2) [issue #4 AC, owner 2026-09-09]; a Theme MAY still enumerate them for documentation and stricter validation, and SHOULD.

### 3.14 Example manifest (non-normative)

```jsonc
{
  "schemaVersion": "1.0",
  "contractVersion": "1.0",
  "id": "hud-01",
  "name": "Object Lock",
  "version": "1.0.0",
  "engine": "svg",
  "baseVersion": "^1.0.0",
  "variants": ["maxi", "mini", "micro"],
  "orientations": ["landscape", "portrait"],
  "compositions": {
    "maxi:landscape":  { "dir": "maxi/landscape",  "supported": true },
    "maxi:portrait":   { "supported": false, "reason": "portrait-maxi-deferred-1.0" },
    "mini:landscape":  { "dir": "mini/landscape",  "supported": true },
    "mini:portrait":   { "supported": false, "reason": "not-authored" },
    "micro:landscape": { "supported": false, "reason": "not-authored" },
    "micro:portrait":  { "dir": "micro/portrait", "supported": true }
  },
  "slots": {
    "required": ["title"],
    "optional": ["subtitle", "media", "visualization", "primary", "secondary",
                 "status", "controls", "content", "footer"]
  },
  "capabilities": {
    "animation": true,
    "interactive": true,
    "htmlSlot": true,
    "multiInstance": true,
    "modes": { "values": ["object", "html"], "default": "object", "config": "mode" },
    "skyViewer": true,
    "dataSource": {
      "providers": ["simbad", "vizier", "ads"],
      "hosts": ["simbad.cds.unistra.fr", "vizier.cds.unistra.fr", "ui.adsabs.harvard.edu"],
      "input": "objectName"
    }
  },
  "entrypoints": {
    "maxi:landscape":  { "styles": ["styles/shared.css", "maxi/landscape/hud.css"],  "markup": "maxi/landscape/hud.html",  "scripts": ["scripts/hud-01.js"] },
    "mini:landscape":  { "styles": ["styles/shared.css", "mini/landscape/hud.css"],  "markup": "mini/landscape/hud.html",  "scripts": ["scripts/hud-01.js"] },
    "micro:portrait":  { "styles": ["styles/shared.css", "micro/portrait/hud.css"],  "markup": "micro/portrait/hud.html",  "scripts": ["scripts/hud-01.js"] }
  },
  "externalResources": [
    { "host": "fonts.googleapis.com", "kind": "style", "timing": "page-load", "required": false },
    { "host": "fonts.gstatic.com",   "kind": "font",  "timing": "page-load", "required": false },
    { "host": "simbad.cds.unistra.fr", "kind": "fetch", "timing": "page-load", "required": false },
    { "host": "aladin.cds.unistra.fr", "kind": "script", "timing": "lazy", "required": false },
    { "host": "vizier.cds.unistra.fr", "kind": "fetch", "timing": "lazy", "required": false }
  ],
  "animations": ["hudBreath", "hudPanelSweep", "hudRotate", "hudPulseOuter", "hudPulseInner"],
  "isolation": "scoped-root",
  "overflowVisible": true,
  "knownDeviations": [
    { "code": "no-maxi-portrait",     "scope": "maxi:portrait", "clause": "8.3",  "note": "portrait full maxi deferred (owner D)" },
    { "code": "external-io-on-mount", "scope": "all",           "clause": "16.3", "note": "Google Fonts + SIMBAD fetch during mount (owner F)" }
  ]
}
```

---

## 4. Theme ID, naming & versioning

### 4.1 Theme ID rules

- Grammar: `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` — lowercase ASCII, digit-and-hyphen separated, MUST start with a letter, no leading/trailing/double hyphen. Length 3–40.
- The baseline set uses the reserved pattern `hud-NN` where `NN` is zero-padded (`hud-01` … `hud-10`) [Arch §39, Plan A].
- The ID MUST be stable for the life of the Theme. Renaming means a new ID and a fresh version history.
- The ID MUST equal the manifest `id` and the `<id>` package path segment.
- IDs are globally unique within the Registry [Arch §28].

### 4.2 Semantic versioning

Theme versions are SemVer 2.0.0 `MAJOR.MINOR.PATCH` [Arch §30, Vision §17]:

- **PATCH** — a fix that changes no composition geometry, no slot vocabulary, no capability, no manifest field meaning.
- **MINOR** — additive, backward-compatible (a new optional slot, a new supported composition, a new capability, a new orientation) [Arch §31].
- **MAJOR** — a breaking change to what a consumer sees: a removed/renamed slot, a removed composition, a changed required-slot set, a semantic change to slot presentation a consumer relied on.

### 4.3 Immutability of published versions

- A published `themes/<id>/<version>/` directory MUST be immutable [Arch §2.4, §30, §54.10, Vision §17].
- Any change to any asset, style, script, manifest field or observable behaviour REQUIRES a new `version` [Arch §30].
- The pipeline MUST refuse to overwrite an already-published version [Arch §48, §49].
- Consumers pinning `<id>@<version>` MUST get byte-identical bytes forever (until formal deprecation/removal via §21.3).

### 4.4 `latest`

The Registry index MAY expose a `latest` pointer per Theme [Arch §28, Vision §17]. Production consumers **SHOULD** pin an explicit `version`; development tooling and the Playground **MAY** use `latest` [Arch §29]. `latest` is a mutable discovery convenience, never an immutable URL.

---

## 5. Renderer identifiers

### 5.1 The `engine` enum

`engine` is one of a **closed enum** [Arch §16, §54.15–16, Plan d9]:

| Value | Status in 1.0 | Baseline Themes |
|---|---|---|
| `svg` | **Supported — fully specified** | HUD-01, HUD-02, HUD-10 |
| `css` | **Supported — fully specified** | HUD-03, HUD-04 |
| `video` | **Reserved — unsupported** | — |
| `static` | **Reserved — unsupported** | — |
| `gadget` | **Reserved — unsupported** | — |

### 5.2 Reserved-but-unsupported

`video`, `static`, `gadget` are valid enum values so manifests can be authored ahead of Runtime support and the Registry can list such Themes [Arch §21, §51]. A 1.0 Runtime asked to load a Theme whose `engine` is one of these **MUST** fail with `RendererUnsupported` (§20) and MUST NOT attempt a fallback renderer [Plan d9, Arch §54.16]. Validation MUST NOT block publication purely on engine, but SHOULD warn that no 1.0 Runtime can mount it.

### 5.3 `svg` renderer — normative definition

The `svg` renderer:

1. MUST create the isolation boundary per the Theme's `isolation` value (§15) and mount the Theme's `markup` document inside it.
2. MUST support a `markup` document that contains **both** an inline `<svg>` layer and an HTML/CSS content layer in the same document [Inv §2.1] — it is not an "SVG document only" renderer.
3. MUST honour `overflowVisible: true` by not applying `overflow:hidden`/`clip`/`clip-path` to the mount container or any ancestor it creates (§15.5) [Inv H13].
4. MUST inject semantic data through slots (§9), never by requiring the consumer to know internal `<svg>` element IDs or `nc-ol-*` / `nc-or-*` class names [Arch §18, §15].
5. MUST drive the Theme script lifecycle (§6, §16, §17) and guarantee teardown (§17).
6. MUST tolerate a Theme that injects a third-party script into `document.head` and uses `window` globals (Aladin Lite) when `isolation` is `scoped-root` [Inv §1.11, H11].

### 5.4 `css` renderer — normative definition

The `css` renderer:

1. MUST create the isolation boundary per `isolation` and mount the Theme's `markup` HTML fragment inside it.
2. MUST preserve CSS `clip-path` frames and `filter: drop-shadow()` glow that paint outside the panel box when `overflowVisible: true` [Inv §6.7, H13] — its isolation strategy MUST NOT hard-clip.
3. MUST support CSS `float` layout inside the content slot [Inv §1.21, §1.28].
4. MAY use Shadow DOM when `isolation` is `shadow-dom` or `shadow-dom-preferred`, and MUST fall back to `scoped-root` (recording `knownDeviations: shadow-dom-fallback`) if the Theme's `clip-path` / `drop-shadow` / `float` do not survive the shadow boundary in validation (§15.3) [Plan d8, Inv H11].
5. Same slot, lifecycle and teardown obligations as §5.3 points 4–5.

### 5.5 Consumer opacity

A consumer MUST NOT be able to select a renderer directly, branch on `engine`, or depend on which renderer a Theme uses [Arch §2.1, §16, §25]. The only consumer-visible selector is the Theme `id` (+ `version`, `variant`, `orientation`).

---

## 6. Renderer lifecycle

### 6.1 The lifecycle interface

Every renderer implements this lifecycle [Arch §22]. It is an **internal** Runtime interface; the consumer-facing surface is §14. Signatures are normative for the Runtime↔renderer boundary; language shown is illustrative.

```
mount(container, context)  -> Promise<void>
setData(data)              -> void
resize(viewport)           -> void
setVariant(variant)        -> Promise<void>
destroy()                  -> void
```

### 6.2 `mount(container, context)`

- `container` is a host-owned `HTMLElement`. The renderer MUST render **only** inside it and MUST NOT mutate host DOM outside it, **except** documented, cooperative, once-per-page insertions into `document.head` for shared external stylesheets/scripts a Theme legitimately needs (fonts, Aladin) (§15, §16) [Inv §1.11].
- `context` carries the resolved `{ theme, version, variant, orientation, manifest, baseVersion, assetBaseUrl }` and Runtime-provided services (logger, error sink).
- `mount` MUST be asynchronous and MUST resolve only when the composition's `styles` and `markup` are in the DOM and `scripts` have run their initialisation. Page-load `externalResources` (§3.13) MAY still be in flight; the Theme MUST render a sensible pre-data state without them.
- `mount` MUST be called **exactly once** per renderer instance. A second call MUST throw.
- On any failure during `mount`, the renderer MUST reject with a typed error (§20: `EntrypointMissing`, `AssetLoadFailed`, `ThemeMountFailed`) and MUST leave `container` empty (no partial DOM).

### 6.3 `setData(data)`

- Synchronous. Applies semantic slot values (§9). MAY be called zero or more times, before or after the first paint, in any order.
- MUST be idempotent for equal input: calling `setData` twice with equal data MUST produce the same result as calling it once.
- Unknown slot keys MUST be ignored (not throw) and SHOULD be logged once [Arch §15].
- MUST NOT trigger a network fetch **except** for a Theme that declares `capabilities.dataSource`, and then only for the allowlisted providers keyed off the declared `input` (§10).
- The Runtime MUST queue `setData` calls issued before `mount` resolves and replay them in issue order once mount completes. A renderer is **not** required to accept `setData` directly before its own `mount` resolves; that queueing is the Runtime's responsibility.

### 6.4 `resize(viewport)`

- Synchronous. `viewport` is `{ width, height }` in CSS pixels of the mount container.
- The renderer MUST re-fit the current composition to the new box. It MUST NOT switch composition, variant or orientation.
- MUST be safe to call frequently (e.g. from a `ResizeObserver`); the renderer SHOULD debounce internally if its re-fit is expensive.
- For intrinsically fluid compositions (all baseline Themes below a breakpoint), `resize` MAY be a no-op beyond storing the viewport.

### 6.5 `setVariant(variant)`

- Asynchronous. Switches to another declared variant at the **same orientation the variant naturally uses** (§7), loading that composition's `entrypoints` if not already loaded, then transferring current slot data into the new composition.
- MUST reject with `VariantUnsupported` if `variant` is not in `variants` **or** the target `<variant>:<orientation>` composition is `supported: false` (§3.9).
- MUST preserve slot data across the switch (the Runtime re-applies the last `setData`).
- Orientation changes are **not** performed by `setVariant`; an orientation change requires a new `Hud` instance in 1.0 (§14.4).
- If the target variant is already active, `setVariant` MUST resolve without work (idempotent).

### 6.6 `destroy()`

- Synchronous. Tears the Theme down completely (§17): remove every event listener the Theme/renderer added, disconnect every observer, cancel every timer/animation frame, abort every in-flight fetch, destroy embedded viewers (Aladin), blank embedded media iframes, and empty `container`.
- MUST be **idempotent**: a second (or later) `destroy()` MUST be a safe no-op [Arch §22, §43].
- MUST NOT throw, even if `mount` never completed or failed.
- After `destroy()`, the instance is dead: any further `setData` / `resize` / `setVariant` MUST throw (or be ignored with a logged warning); `mount` MUST NOT be reusable.
- Cooperative once-per-page head insertions (fonts, Aladin script) MAY remain in `document.head` after `destroy()`; the renderer MUST ensure they are inert with respect to the destroyed instance.

### 6.7 Ordering guarantees

1. `mount` happens-before every other call.
2. `destroy` happens-after every other call the Runtime issues; the Runtime MUST NOT issue `setData`/`resize`/`setVariant` after `destroy`.
3. `setData` calls are applied in issue order.
4. `setVariant` serialises: the Runtime MUST NOT overlap two `setVariant` calls; a `setData` issued during a pending `setVariant` is applied after it resolves.
5. `resize` MAY interleave with anything except that it is never called before `mount` resolves or after `destroy`.

---

## 7. Standard variants

### 7.1 The variant set (1.0)

`maxi`, `mini`, `micro` are **semantic presentation modes**, each with a natural orientation [Arch §13, Vision §11, §54.13, owner 2026-09-09]:

| Variant | Natural orientation | 1.0 requirement | Meaning |
|---|---|---|---|
| `maxi` | `landscape` | **REQUIRED** | Full interface presentation: primary + secondary data, visualization, controls, extended metadata [Vision §11]. |
| `mini` | `landscape` | **REQUIRED** | A **miniature copy** of the Theme in landscape — a compact thumbnail form [owner 2026-09-09]. |
| `micro` | `portrait` | **REQUIRED** | A **miniature copy** of the Theme in portrait — the vertical thumbnail form [owner 2026-09-09, was owner decision C]. |

All three are REQUIRED in 1.0. This supersedes the earlier "`micro` reserved / out of 1.0" position [issue #4 out-of-scope list] per the owner's 2026-09-09 reframe.

### 7.2 `maxi` is an authored variant

`maxi` MUST be an **authored composition**, not "the default panel with the collapse chrome removed" [Inv H2]. A `maxi` composition MUST render fully expanded with no collapse toggle and no `is-mini` state.

### 7.3 `mini` and `micro` are miniature copies

`mini` and `micro` are both "miniature copies" of the Theme. A Theme MAY implement either:

- **(a) a scaled miniature** — a `transform: scale()` (e.g. `0.352`) crop of the `maxi` DOM, as HUD-01 / HUD-02 / HUD-10 do via `NcHudMini`; **or**
- **(b) a genuine distinct lower-density composition** — as HUD-03 / HUD-04 do with `.nc-hp-mini-card`.

**Both are conformant** [owner 2026-09-09]. The scaled-miniature approach is the **sanctioned norm**, not a per-Theme exception and not tied to `engine`. Pixel-exactness of a scaled miniature is explicitly not required. A Theme choosing (a) does **not** need a `knownDeviations` entry for it.

### 7.4 (removed)

*The earlier §7.4 "`mini` scale exception, `svg` family only, requires `knownDeviations`" carve-out is removed. §7.3 replaces it: scaled miniatures are allowed for any Theme, any engine, with no deviation record.*

### 7.5 Requesting a variant directly

The Runtime's `new Hud({variant})` MUST mount the requested variant **directly**, with no "load mini then expand" flash [Inv §4 item 4]. A directly-requested `maxi` MUST start expanded.

---

## 8. Orientations (form factor)

### 8.1 The orientation model

Form factor is expressed as one of two **loose orientations** [owner 2026-09-09, Arch §14, Vision §10]:

| Orientation | Meaning |
|---|---|
| `landscape` | wider than tall — the `maxi` and `mini` home |
| `portrait` | taller than wide — the `micro` home, and (deferred) full portrait `maxi` |

There is **no exact aspect-ratio requirement**. A `landscape` composition need not be 16:9; a `portrait` composition need not be 9:16. `preserveAspectRatio="none"` stretch inside a single authored composition, `@media` reflow, and approximate canvas proportions (HUD-10's ~0.63 portrait canvas) are all conformant [owner 2026-09-09, Inv §1.10, §5]. `orientations` replaces the removed `ratios` field (§3.3).

### 8.2 1.0 requirements

Every 1.0 Theme MUST declare `orientations: ["landscape", "portrait"]` and MUST provide these compositions as `supported: true`:

| Composition | 1.0 requirement | Basis |
|---|---|---|
| `maxi:landscape` | **REQUIRED** | Arch §14, owner 2026-09-09 |
| `mini:landscape` | **REQUIRED** | owner 2026-09-09 |
| `micro:portrait` | **REQUIRED** — the vertical thumbnail | owner 2026-09-09 (was owner C) |

Other combinations (`maxi:portrait`, `mini:portrait`, `micro:landscape`) are OPTIONAL and default to `supported: false` with a `reason` (§3.9).

### 8.3 Full portrait `maxi` deferral (owner D)

A 1.0 Theme **MAY** declare `maxi:portrait` as `{ "supported": false, "reason": "portrait-maxi-deferred-1.0" }` and MUST then carry a `knownDeviations` entry code `no-maxi-portrait` (§22) — **except** a Theme that already ships a real full portrait composition, which MUST declare `maxi:portrait` `supported: true`. HUD-10 is such a Theme (its native canvas is portrait) and ships its portrait `maxi` in 1.0. Adding `maxi:portrait` to a Theme that deferred it is a **MINOR** version bump and non-breaking [Arch §31]. Validation MUST treat a declared-unsupported `maxi:portrait` as a **known exception**, not a failure (§19.3).

### 8.4 No mechanical orientation swap

The Runtime **MUST NOT** synthesise one orientation from the other by rotating or cropping a composition authored for the other orientation [Arch §14, §54.14, Vision §10]. If a requested `<variant>:<orientation>` is `supported: false` or absent, the Runtime MUST fail with `RatioUnsupported` (§20) and let the consumer decide (§20.3). This rule is about *not fabricating a composition that was never authored*; it does **not** forbid a Theme's own internal fluid stretch/reflow within one authored composition, and it does **not** impose any pixel-ratio target (§8.1).

### 8.5 Baseline orientation coverage

The baseline lineage's landscape panels (HUD-01/02/03/04) provide `maxi:landscape` and, via `NcHudMini`, `mini:landscape` and `micro:portrait` miniatures (scaled or authored, §7.3); they defer `maxi:portrait` with `no-maxi-portrait`. HUD-10 is natively portrait: it provides `maxi:portrait` (`supported: true`) and its miniatures, and MAY defer `maxi:landscape` with a `no-maxi-landscape`-style note if a landscape full composition is not authored (§25.4). Under the orientation model HUD-10 is a normal Theme, not a special case (this reconciles the earlier §8.5 / §25.4 tension).

---

## 9. Semantic slot vocabulary

### 9.1 The core principle

**The consumer owns data; the Theme owns presentation; the Runtime owns the boundary** [Arch §15, Vision §2, §12]. Consumers set values **only** through slots via `setData` (§6.3) / the declarative slot form (§14.5). Consumers **MUST NOT** target Theme-internal DOM — no `nc-ol-*`, `nc-or-*`, `nc-hp-*`, `nc-hud-10-*` class or `<svg>` id is part of the Contract [Arch §2.1, §15, §53.1, Vision §12].

### 9.2 Standard slot vocabulary (1.0)

Ratified from the inventory's per-HUD slot passes [Inv §1.12, §1.19, §1.29, §1.36, H6]. This is a **closed set** in 1.0 (extend only via `customSlots`, §9.4, or a Contract MINOR bump):

| Slot | Kind | Typical content | Baseline mapping |
|---|---|---|---|
| `title` | text | Primary identity line | `nc-ol-title` / `nc-or-title` / `nc-hp-title` / `nc-*-title-maxi`; `nc-*-title-micro` at micro density |
| `subtitle` | text | Secondary identity / system label | `nc-hp-system` ("OUTPOST 32") |
| `status` | text | Short state string | `nc-ol-data-status`, `TARGET LOCK` label, `nc-reconnect`, progress label |
| `primary` | text \| structured rows | The headline value(s) | `#nc-hud01-data-panel` DATA grid rows |
| `secondary` | text \| structured rows | Supporting values | CATALOGS (VizieR) / PAPERS (ADS) panels |
| `media` | url \| media ref | Image / portrait / video embed | `nc-ol-image`, `nc-hud-float-image`, `nc-hp-float-image`, `nc-hp-media` |
| `visualization` | ref / config | A Theme-owned visual driven by a small input | `nc-hud-01-aladdin` viewer + `nc-ol-reticle` (driven by an object name/coordinate) |
| `controls` | (Theme-owned) | Interactive chrome the Theme renders | `nc-ol-toolbar` (RETICLE toggle, DATA/PAPERS/CATALOGS tabs) — **not** consumer content |
| `content` | HTML fragment | Arbitrary consumer HTML body | `nc-hud-01-html-slot`, `nc-hp-text` |
| `footer` | text | Footer / ticker line | `nc-hp-frame-ticker` scrolling text |

Notes:

- `system` and `ticker` do **not** get dedicated slots [Inv H6]: `system` folds into `subtitle`, `ticker` folds into `footer`. A Theme MAY document that its `footer` is presented as a marquee.
- `controls` and (in object mode) `visualization` are **Theme-owned**: the consumer supplies at most a small input, never markup.
- `status` in the baseline is almost entirely Theme-owned; a Theme MAY accept a consumer `status` string in `html`/editorial mode.

### 9.3 The `content` slot & `htmlSlot` capability

A Theme that accepts arbitrary consumer HTML MUST declare `capabilities.htmlSlot: true` and list `content` in `slots` [Inv §1.8, H7]. The Theme:

- MUST sandbox `content` styling so consumer HTML cannot break the Theme frame;
- MUST NOT execute `<script>` inside `content` (the Runtime SHOULD strip it);
- SHOULD document which tags it styles.

### 9.4 Custom slots

A Theme MAY define custom slots via `customSlots` [Arch §15]:

```jsonc
"customSlots": [
  { "name": "objectName", "kind": "text", "required": false,
    "description": "Astronomical target name; drives the sky viewer and data fetch" }
]
```

Rules:

- Custom slot names MUST match `^[a-z][a-zA-Z0-9]*$` and MUST NOT collide with a standard slot name (§9.2).
- A custom slot MUST have a `kind` (`text` \| `html` \| `url` \| `ref` \| `config`) and a human `description`.
- Consumers set custom slots through the same `setData` map. A consumer that does not know a Theme's custom slots still gets a working Theme.
- Custom slots are semantic inputs the Theme interprets — not an escape hatch for Theme-internal DOM.

### 9.5 Required vs optional slots

- `slots.required` lists slots the Theme needs to render meaningfully. The Runtime SHOULD warn (not fail) if a required slot is unset at first paint; the Theme MUST still render a placeholder/empty state [Arch §46].
- `slots.optional` lists slots the Theme will use if given.
- A slot in neither list is unknown to the Theme and MUST be ignored (§6.3).

---

## 10. `dataSource` capability (owner F)

### 10.1 Purpose

HUD-01/HUD-02 in object mode fetch their own astronomy data (SIMBAD / VizieR / ADS) and drive an Aladin Lite sky viewer, given only an **object name** [Inv §1.4, §1.8]. Owner F [Plan F, owner 2026-09-09]: this stays as a Theme capability — modelled as `dataSource` — **not** refactored into "consumer passes resolved rows". The semantic-slot contract (§9) still governs all **non-astronomy** content.

### 10.2 Declaration

```jsonc
"capabilities": {
  "dataSource": {
    "providers": ["simbad", "vizier", "ads"],
    "hosts": ["simbad.cds.unistra.fr", "vizier.cds.unistra.fr", "ui.adsabs.harvard.edu"],
    "input": "objectName",
    "timing": { "simbad": "page-load", "vizier": "lazy", "ads": "lazy" }
  }
}
```

- `providers`: subset of the closed enum **`["simbad", "vizier", "ads"]`** — the astronomy data providers, and nothing else (§10.3).
- `hosts`: MUST be a subset of the corresponding provider hosts (§10.3), all of which are on the §16.2 allowlist.
- `input`: the slot / custom-slot name the consumer sets to select what to fetch (e.g. `objectName`). The consumer supplies **only this**; the Theme owns the query, parsing and rendering.
- `timing`: per-provider `page-load` \| `lazy`.

### 10.3 `dataSource` providers and hosts (1.0)

`providers` is exactly `simbad` \| `vizier` \| `ads`:

| Provider id | Host(s) | Kind |
|---|---|---|
| `simbad` | `simbad.cds.unistra.fr` | `fetch` (TAP/ADQL) — object identity + basic data |
| `vizier` | `vizier.cds.unistra.fr` | `fetch` (VOTable) — catalog cross-references |
| `ads` | `ui.adsabs.harvard.edu` | `fetch` + link target — publications |

**Not** `dataSource` providers:

- **Aladin** (`aladin.cds.unistra.fr`) is declared solely by the `capabilities.skyViewer` boolean (§10.4); it is **never** a `dataSource.providers` value and never appears in `dataSource.hosts`. It is on the §16.2 allowlist so `skyViewer` Themes may load it.
- **Google Fonts** (`fonts.googleapis.com`, `fonts.gstatic.com`) is covered solely by the general §16.2 font allowlist and the platform base font loader; it is **never** a capability provider or host.

Adding a `dataSource` provider is a Contract MINOR change (§24).

### 10.4 `skyViewer` (Aladin) coexistence

`capabilities.skyViewer: true` declares the Aladin Lite embed. It:

- loads the Aladin script/style **lazily and cooperatively once per page** — the baseline lineage shares one loader across HUD-01/HUD-02 instances via a page global (`global._ncAladinLoader`) and assigns unique viewer ids per instance [Inv, `blogger-hud01-template.js`];
- is driven by the same `input` slot as `dataSource`;
- is Theme-owned decoration under the `visualization` slot (§9.2);
- runs under `isolation: scoped-root` only (Aladin injects into `document.head` and uses `window` globals — Shadow DOM is not attempted for these Themes in 1.0, §15.2) [Inv H11, §1.11].

### 10.5 `mediaEmbed` (third-party media iframes)

`capabilities.mediaEmbed` declares embedded media (HeyGen / YouTube / Vimeo) in the `media` slot [Inv §1.30, §1.36]:

```jsonc
"mediaEmbed": { "hosts": ["app.heygen.com", "www.youtube.com", "player.vimeo.com"], "lifecycle": "src-swap" }
```

- `hosts` MUST be a subset of the media allowlist (§16.2).
- `lifecycle: "src-swap"` documents that the Theme parks a hidden iframe at `about:blank` and restores `src` on expand [Inv §1.32–1.34]. The Runtime's `resize`/`setVariant` MUST NOT fight this mutation.
- The renderer's `destroy()` MUST blank every embedded iframe `src` before removing it (§17.2).

### 10.6 How `dataSource` coexists with slots

- A `dataSource` Theme's **object-mode** content (`primary`, `secondary`, `status`) is **fetched, not injected**; the consumer sets only `input`.
- The same Theme's **non-astronomy** content — `title` (when consumer-overridden), `content` (html mode), `media`, `footer` — is set through slots normally.
- A `dataSource` Theme MUST still render (empty/placeholder state) if the consumer sets no `input` and if the providers are unreachable [Inv §1.8 NGC 1300 fallback].
- This resolves the Vision §12 tension [Inv H8]: domain logic is confined to a **declared, allowlisted, name-in / rendering-out** capability; it is not free rein.

---

## 11. Modes & shared foundation

### 11.1 One Theme, one `modes` flag (owner E)

HUD-01/HUD-02 have two personalities — **object viewer** (reticle / Aladin / SIMBAD) and **HTML frame** (blog-post body) [Inv §1.8]. Owner E [Plan E, owner 2026-09-09]: **one Theme** with a config flag, **not** two Themes.

```jsonc
"capabilities": { "modes": { "values": ["object", "html"], "default": "object", "config": "mode" } }
```

- `config` names the construction option (`new Hud({ config: { mode: "html" } })`, §14.2) and/or the declarative attribute.
- In `object` mode the Theme uses `dataSource` + `skyViewer`; in `html` mode it disables all network init and shows the `content` slot [Inv §1.8].
- A Theme without `modes` has exactly one composition personality.
- `modes` selects a **personality within a composition**, orthogonal to `variant` and `orientation`. Switching `mode` after mount is **out of scope for 1.0** [owner 2026-09-09, O5] — construct a new `Hud`.

### 11.2 Platform-provided shared foundation ("base") — [Inv H14, owner O4]

The baseline Themes are near-identical at the foundation layer and load the same shared files in the same order [Inv §3]. **Decision [owner 2026-09-09, O4]:** the platform provides a **single versioned base**, injected **once per page** by the Runtime; Themes do **not** each vendor a divergent copy.

- The base contains: the scoped reset, `--hud-*` / `--nc-*` design tokens, the shared `@keyframes` set (`hudBreath`, `hudPanelSweep`, `hudRotate`, `hudPulseOuter`, `hudPulseInner`, `hudBlinkSoft`, `hudLockBoxPulse`, `hudProgressScan`, `hudTickerScroll`, …), `.nc-panel-sweep`, and the shared JS singletons (`HUDCore`, `NcHudMini`, `HudPapers`).
- The base is **versioned** (`baseVersion`, §3.8) and immutable per version.
- A Theme declares `baseVersion`; the Runtime resolves a compatible base and injects it before the Theme's own `entrypoints`.
- The base is responsible for making its global identifiers safe: its `@keyframes` and any `*`/`:root`-scoped rules MUST be namespaced/scoped by the base build so two Theme bundles cannot collide (§15.6) [Inv H12].
- A Theme MAY still be "self-contained" for portability (Arch §8.3) by bundling its own base at build time, but MUST still declare `baseVersion` for the compatibility check.

### 11.3 Asset addressing

- **Self-contained text Themes are preferred** [Plan d5, Arch §8.3]. SVG / CSS / JS / HTML Themes SHOULD carry all their text assets in-package.
- **Heavy media** (raster, video, textures) MUST be referenced by a **stable, versioned, absolute CDN URL** declared in the manifest, never hot-linked from an arbitrary origin [Plan d5, Arch §8.3, §34].
- Consumer-supplied media (a portrait URL in the `media` slot) is passed at runtime and is not a package asset.
- In-package asset paths MUST be package-relative (§2.2 rule 5); the Runtime resolves them against `context.assetBaseUrl`.

---

## 12. Registry resolution flow

The Runtime resolves a Theme deterministically [Arch §29, §23]:

```
1. Theme id                (consumer input)
2. requested version       (explicit SHOULD; "latest" MAY in dev)
3. Registry resolution     id + version -> manifest URL   (via /registry/index.json)
4. manifest fetch          GET themes/<id>/<version>/manifest.json
5. manifest validation     against manifest.schema.json + this Contract's §3 rules
6. Contract-compat check   manifest.contractVersion major implemented by Runtime?
7. renderer selection      manifest.engine -> svg | css  (else RendererUnsupported)
8. base resolution         manifest.baseVersion -> compatible base, inject once/page
9. variant + orientation   requested (variant, orientation) -> compositions["<v>:<o>"]
                           must exist and be supported (else Variant/RatioUnsupported)
10. entrypoint set         compositions -> entrypoints["<v>:<o>"] (styles, markup, scripts)
11. resource loading       base -> styles -> markup -> scripts (order significant)
12. mount                  renderer.mount(container, context)
```

Each step maps to a failure mode in §20. Steps 1–6 are Registry/manifest concerns; 7–12 are Runtime/renderer concerns. Production consumers SHOULD pin the version at step 2 [Arch §29].

---

## 13. Reserved

Section number reserved; no content. (Compatibility is covered in §18 and §24; the consumer API is §14.)

---

## 14. Consumer API

### 14.1 Surface (1.0)

The consumer-facing API is **imperative and small** [Arch §25, Plan d10, Vision §14]:

```js
import { Hud } from "@incus/hud-runtime";

const hud = new Hud({
  theme:       "hud-01",       // REQUIRED — Theme id
  version:     "1.0.0",        // SHOULD in production; "latest" MAY in dev
  variant:     "maxi",         // REQUIRED — "maxi" | "mini" | "micro"
  orientation: "landscape",    // REQUIRED — "landscape" | "portrait"
  config:      { mode: "object", objectName: "NGC 1300" }  // OPTIONAL — Theme capability config
});

await hud.mount(containerEl);
hud.setData({ title: "BETELGEUSE", primary: "642 ly", status: "OBSERVING" });
hud.resize();                 // or hud.resize({ width, height })
await hud.setVariant("mini");
hud.destroy();
```

### 14.2 Constructor

- `new Hud(options)` validates options synchronously; an invalid `theme`/`variant`/`orientation` shape throws a `TypeError` (programmer error, not a Theme error).
- `config` carries Theme-capability configuration (`mode`, `objectName`, `vizierLimit`, …). Keys a Theme does not understand are ignored.
- Construction does **no** network I/O; resolution starts at `mount`.

### 14.3 Methods

| Method | Returns | Contract |
|---|---|---|
| `mount(el)` | `Promise<void>` | Runs §12 flow, then renderer `mount`. Once per instance. Rejects with a typed error (§20). |
| `setData(obj)` | `void` | Slot values (§9). Queued if called before `mount` resolves; replayed in order. |
| `resize(viewport?)` | `void` | Re-fit. `viewport` optional; Runtime measures the container if omitted. |
| `setVariant(v)` | `Promise<void>` | Different variant (§6.5). Rejects `VariantUnsupported`. |
| `destroy()` | `void` | Full teardown (§6.6, §17). Idempotent. |

### 14.4 Orientation changes

Changing `orientation` after construction is **not** in the 1.0 API. To change orientation, `destroy()` the instance and construct a new one [Plan d10]. A `setOrientation` is a candidate additive 0.2 extension.

### 14.5 Declarative adapter — out of 1.0

The `<nebula-hud>` Web Component adapter [Arch §26, §51] is **Platform 0.2 / out of scope for Contract 1.0** [Plan d10, issue #4 AC]. It is a planned **additive** extension: a thin wrapper over this same imperative API and this same Contract, with `slot`-based content projection mapping to `setData`. It introduces no new Theme obligations. If the external-consumer story (#17) needs a minimal adapter, it MAY be added as a thin 1.0 addition without a Contract version bump (purely additive, §24.2).

### 14.6 What the consumer never does

The consumer MUST NOT [Arch §25, §2.1]: import Theme CSS; fetch Theme SVG/HTML; insert Theme markup; call Theme-specific functions (`NcHud01.*`); read or write Theme-internal DOM; branch on `engine` or renderer.

---

## 15. CSS isolation rules

### 15.1 Baseline: scoped Theme root

**`scoped-root` is the 1.0 baseline for every Theme** [Plan d8, Inv H11]. The renderer creates one mount container that is the Theme root; the build scopes/prefixes every Theme selector under that root; the Theme renders only within it.

`isolation` manifest values:

| Value | Meaning |
|---|---|
| `scoped-root` | Scoped-root only. **Required for `svg`-engine Themes with `skyViewer` or `dataSource` (HUD-01/02); used by HUD-10.** |
| `shadow-dom-preferred` | Renderer attempts Shadow DOM, falls back to `scoped-root` if validation (§15.3) fails. Allowed for `css`-engine Themes. |
| `shadow-dom` | Shadow DOM required (renderer MUST fail rather than fall back). Not used by any 1.0 baseline Theme. |
| `iframe` | Reserved for exceptional cases [Arch §41]; not used in 1.0. |

### 15.2 Shadow DOM is NOT used for HUD-01/HUD-02

Aladin Lite injects `<script>`/`<link>` into `document.head` and assumes a light-DOM document with `window` globals; a Google Fonts `<link>` in a shadow root does not inherit [Inv §1.11, H3, H11]. Therefore `svg`-engine Themes with `skyViewer`/`dataSource` MUST declare `isolation: scoped-root` and the Runtime MUST NOT wrap them in Shadow DOM in 1.0 [Plan d8].

### 15.3 Shadow DOM attempt for the CSS family

For HUD-03/HUD-04 (`css` engine), the renderer MAY attempt Shadow DOM (`shadow-dom-preferred`) and MUST **keep it only if**, in validation, the legacy `clip-path` frame, `filter: drop-shadow()` glow and `float` layout all survive the shadow boundary visually [Plan d8, Inv H11]. Otherwise it MUST fall back to `scoped-root` and record `knownDeviations: shadow-dom-fallback`. The chosen mechanism per version MUST be recorded (validation report).

### 15.4 Forbidden host-wide selectors

A Theme's shipped CSS MUST NOT contain selectors that escape the Theme boundary [Arch §42, §53.2]:

```css
body { ... }      html { ... }      :root { ... }      * { ... }
```

when those rules would apply outside the Theme root. Legacy host-wide rules from the panel lineage (`reset.css` `*`/`html`/`body`, `base.css` `body{}`) MUST be **stripped or rewritten to be root-scoped at packaging** (recording `knownDeviations: shared-base-host-selectors-stripped` when packaging relaxes the check) [Inv §1.11, H12]. The blogger lineage's `blogger-hud-shared.css` is already free of host-wide `*`/`html`/`body` and is the cleaner starting point [inspection].

### 15.5 `overflow: visible` decoration

A Theme MAY paint decoration outside its bounding box (HUD-01's 4-layer SVG glow runner; HUD-03/04's `drop-shadow` frame) when it declares `overflowVisible: true` [Inv H13]. The renderer MUST NOT apply `overflow:hidden` / `clip` / `clip-path` to the mount container or an ancestor it owns for such a Theme. Validation's viewport-overflow check MUST respect the flag (§19.2). A consumer that needs the HUD strictly clipped can wrap the container itself.

### 15.6 Shared `@keyframes` and tokens

Shared `@keyframes` names and `--hud-*` / `--nc-*` custom properties are **global identifiers** that collide across Theme bundles [Inv §3, H12]. The platform base (§11.2) is responsible for:

- defining each shared `@keyframes` exactly once per page;
- re-rooting `:root { --hud-* }` tokens onto the Theme container (or a documented single scoped layer) so they do not repaint the host;
- namespacing or de-duplicating keyframes if two base versions coexist.

A Theme lists the shared animations it consumes in `manifest.animations` (§3.12) so validation can confirm provenance.

### 15.7 z-index

Themes SHOULD use `--hud-z-*` tokens rather than raw integers; the baseline's raw integers up to ~50 [Inv §1.5] are tolerated in 1.0, but the renderer MUST establish a **stacking context** on the mount container (e.g. `isolation: isolate`) so Theme z-index cannot collide with host stacking [Arch §41].

---

## 16. JavaScript & external-resource policy

### 16.1 Executable Themes come only from the Registry

Theme scripts MUST be loaded **only from the controlled Registry/CDN** [Arch §43, §54.17, Vision §18]. Arbitrary third-party JavaScript Theme URLs are unsupported. The Runtime MUST NOT execute a `scripts` entry that resolves to any origin other than the Registry.

### 16.2 External-resource allowlist (1.0, normative)

Registry-loaded Themes **MAY lazy-load or page-load from this fixed host set without per-Theme manifest allowlisting** [issue #4 AC, owner 2026-09-09, Plan Q4]:

| Purpose | Hosts | Kinds | Typical timing |
|---|---|---|---|
| Typeface | `fonts.googleapis.com`, `fonts.gstatic.com` | `style`, `font` | page-load |
| Sky viewer | `aladin.cds.unistra.fr` | `script`, `style` | lazy |
| Astronomy data | `simbad.cds.unistra.fr`, `vizier.cds.unistra.fr`, `ui.adsabs.harvard.edu` | `fetch`, link target | SIMBAD page-load; VizieR/ADS lazy |
| Media embeds | `app.heygen.com`, `www.youtube.com`, `player.vimeo.com` | `iframe` | page-load |

- This list is **normative** [owner 2026-09-09, O6]. The manifest `externalResources[]` field remains OPTIONAL; declaring it enables stricter validation and better documentation, and is RECOMMENDED.
- Any host **outside** this set MUST be declared in `externalResources[]` **and** justified by a `knownDeviations` entry; a Runtime with strict policy enabled MAY block it.
- Adding a host is a Contract MINOR change (§24).

### 16.3 Network during mount is permitted (owner F)

A strict "no network on mount" rule would break the baseline: Google Fonts and SIMBAD both fire at page load [Inv §1.4]. 1.0 **permits** page-load external I/O for allowlisted hosts. A Theme that does so MUST carry `knownDeviations` code `external-io-on-mount` and MUST render a coherent pre-response state (§10.6) [Inv §1.4].

### 16.4 Lifecycle-bound scripts

Theme scripts MUST operate within the renderer lifecycle (§6) [Arch §43]:

- initialisation runs during `mount`;
- the Theme MUST expose the hooks the renderer needs to drive `setData` / `resize` / `setVariant` / teardown (§17.1);
- scripts MUST NOT assume ownership of global application state [Arch §43, §54.17];
- scripts MUST NOT block the main thread on synchronous network I/O.

### 16.5 Instances per page

- **Single-instance is fully conformant.** A Theme that supports one instance per page (panel-lineage globals, first-match `querySelector`) MUST NOT be treated as defective and MUST pass validation. `multiInstance` is **not** a 1.0 validation requirement [owner 2026-09-09, Inv H15].
- **Multi-instance is SUPPORTED where the Theme provides a per-widget factory.** The blogger-template lineage does: `NcHud01.init(widget, cfg)` / `NcHud02.init(widget, cfg)` create isolated per-widget state, assign unique embedded-viewer ids, and cooperatively share one page-load Aladin `<script>` via a page global [Inv, `blogger-hud01-template.js`]. HUD-03/HUD-04 support multiple panels per page because `NcHudMini.init({widget, panel})` is per-widget and the per-post snippet guards with `:not([data-hud-init])`; the shared `NcHudMini` module holds no per-panel global state. `blogger-hud03-template.js` is **only** the `NcHudMini` toggle module (~130 lines), not a Theme factory.
- A Theme that supports multiple instances MAY declare `capabilities.multiInstance: true`. It then MUST scope every DOM query, id and piece of state to its mount container, and MUST cooperatively share (never duplicate) page-load external `<script>`/`<link>` insertions.
- Absent `multiInstance`, the Runtime MUST assume single-instance and SHOULD warn (not fail) if a second instance of the same Theme id is mounted on one page.
- **Path to multi-instance for a single-instance Theme (0.2):** an instance-factory pattern (as the blogger lineage already demonstrates) — no Contract break; a Theme MINOR bump flips `multiInstance` to `true`.

### 16.6 `<script>`-stripping context

The baseline Themes are standalone pages / iframe embeds because Blogger strips `<script>` from HTML gadgets [Inv §1.11]. This is **not** a Runtime concern (the Runtime is the trusted loader) but explains why the Theme sources are whole HTML documents that packaging reduces to `markup` fragments + `scripts`.

---

## 17. Teardown contract

### 17.1 Theme teardown hooks

The inventory found **no teardown exists anywhere** in the baseline [Inv §6.5, H10, §1.6, §1.33]. 1.0 REQUIRES it. A Theme's entry script MUST expose, on a documented handle the renderer can reach (e.g. a return value from an init function, or a known property on the Theme root):

```
init(root, context) -> {
  setData(data)      // optional; renderer may also drive slots via DOM the Theme documents
  resize(viewport)   // optional
  setVariant(v)      // optional
  destroy()          // REQUIRED
}
```

- `destroy()` on this handle MUST remove every listener the Theme added, disconnect every `MutationObserver` / `ResizeObserver`, cancel timers and `requestAnimationFrame` loops, `abort()` every `AbortController`, destroy Aladin instances, and blank media iframes [Inv §6.5, §1.32–1.34].
- If a Theme cannot yet expose these hooks, the **renderer** MUST wrap the unchanged Theme code and perform teardown around it. Concrete baseline teardown targets [Inv, `blogger-hud01/02-template.js`]: toolbar button `click` listeners, panel `animationend` listeners, the `NcHudMini` toggle button/widget `click` listeners, `transitionend` handlers with their `setTimeout` fallbacks, the HUD-04 `MutationObserver` (`.observe()` with no `disconnect()`), the Aladin instance and its listeners, and any `HudPapers` `AbortController` / in-flight fetch. *There is no `keydown`/Escape listener in the blogger lineage* — do not look for one. This wrapper obligation is on the renderer implementers (#9/#10), specified here.

### 17.2 Renderer teardown obligations

`renderer.destroy()` (§6.6) MUST, in order:

1. call the Theme handle's `destroy()` if present;
2. remove any renderer-added listeners/observers;
3. cancel any renderer-scheduled work;
4. for `mediaEmbed` Themes, set every embedded iframe `src=""` / `about:blank`, then remove it;
5. empty the mount container;
6. mark the instance dead.

### 17.3 Idempotency & failure tolerance

`destroy()` MUST be idempotent and MUST NOT throw even if `mount` failed or never ran (§6.6) [Arch §22, §43].

### 17.4 Validation

Publication validation MUST include a **mount → destroy → assert-clean** check: no leaked listeners on `document`/`window`, no live observers, no pending timers, container empty [Arch §46, §19].

---

## 18. Compatibility model

Compatibility summary [Arch §31] (mechanics enforced via §20.4 and evolved via §24):

- **Theme version** ↔ **`contractVersion`** ↔ **Runtime version** ↔ **Registry-schema version** are four independent axes.
- Runtime↔Theme compatibility is **capability-based**, not release-number-based: the Runtime inspects `engine`, `contractVersion` major, `capabilities`, `variants`, `orientations` and decides whether it can mount — it does not compare its own version to the Theme's.
- A breaking Contract change ⇒ new **major** Contract version; the Runtime rejects a `contractVersion` major it does not implement (`ContractUnsupported`).
- Additive Contract changes (new optional field, new capability, new allowlist host, new slot) ⇒ Contract **minor**; older Themes stay valid, older Runtimes ignore what they don't understand.

---

## 19. Validation rules

A Theme MUST pass automated validation before publication [Arch §46, §19, Vision §19]. This section states the checks as **Contract requirements**.

### 19.1 Minimum checklist (MUST all pass)

```
manifest.json exists at package root
manifest validates against manifest.schema.json (schemaVersion)
manifest satisfies §3 of this Contract (prose authority)
no removed fields present (ratios / aspectRatios -> ManifestInvalid, point to orientations)
id matches ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ and equals the package <id> segment
version is strict SemVer and equals the package <version> segment
contractVersion major is a version this validator/Runtime implements
engine is in the enum; if svg|css it is buildable; if video|static|gadget -> WARN (no 1.0 Runtime)
baseVersion resolves to an available base (exact or caret only)

variants == ["maxi","mini","micro"]  (all three, 1.0)
orientations == ["landscape","portrait"]  (both, 1.0)
compositions has exactly one entry per variant x orientation (6 entries)
compositions["maxi:landscape"].supported == true
compositions["mini:landscape"].supported == true
compositions["micro:portrait"].supported == true
compositions["maxi:portrait"].supported == true  OR  a knownDeviations "no-maxi-portrait" entry exists
every supported composition's dir exists
entrypoints keys == the set of supported composition keys (no more, no fewer)
every entrypoints[...] styles/markup/scripts path resolves inside the package
markup present for every supported composition
slots.required and slots.optional are standard slot names (§9.2 enum) or declared customSlots; no overlap
isolation is in the enum; svg + (skyViewer | dataSource) => isolation == "scoped-root"
externalResources hosts are on the §16.2 allowlist OR have a knownDeviations entry
dataSource.providers subset of ["simbad","vizier","ads"]; dataSource.hosts subset of their §10.3 hosts
animations referenced by CSS are provided by baseVersion or the Theme's own styles

Runtime mount succeeds for every supported composition
Runtime destroy succeeds and leaves no leaked listeners/observers/timers (§17.4)
CSS isolation check: no host-wide body/html/:root/* selectors escape the root (§15.4)
script-policy check: scripts resolve only to the Registry origin (§16.1)
```

### 19.2 Recommended additional checks (SHOULD)

Console-error detection; viewport-overflow check (**respecting `overflowVisible`**); broken-link detection for `assets`/`externalResources`; preview generation; animation-cleanup check; performance budget (0.2) [Arch §46, Vision §19].

### 19.3 Known exceptions pass deliberately

Every `knownDeviations` entry (§22) whose `code` is in the recognised set MUST cause the corresponding check to **pass as a logged known exception**, not fail [Inv §8]. Recognised 1.0 codes: `no-maxi-portrait`, `no-maxi-landscape`, `external-io-on-mount`, `shadow-dom-fallback`, `shared-base-host-selectors-stripped`. An unrecognised code MUST fail validation (so deviations cannot be invented to dodge checks).

### 19.4 Atomic publication

A Theme failing any MUST check MUST NOT be partially published; Registry index metadata is updated only after all Theme assets are in place [Arch §49].

---

## 20. Error model

### 20.1 The error set

The Runtime MUST surface exactly these typed errors [Arch §45]:

| Error | Raised when |
|---|---|
| `ThemeNotFound` | `id` not in the Registry |
| `VersionNotFound` | `id` exists, requested `version` does not |
| `RegistryUnavailable` | Registry/index/manifest fetch fails at the network level |
| `ManifestInvalid` | manifest fails schema or §3 validation |
| `ContractUnsupported` | manifest `contractVersion` major not implemented by this Runtime |
| `RendererUnsupported` | `engine` is `video`/`static`/`gadget` (reserved-unsupported) or unknown |
| `VariantUnsupported` | requested `variant` not in `variants`, or `<variant>:<orientation>` composition `supported: false` |
| `RatioUnsupported` | requested `orientation` not in `orientations`, or `<variant>:<orientation>` composition `supported: false` / absent (name retained from Arch §45; covers orientation) |
| `EntrypointMissing` | a `styles`/`markup`/`scripts` path does not resolve in the package |
| `AssetLoadFailed` | a required in-package asset or required base fails to load |
| `ThemeMountFailed` | renderer `mount` throws / rejects |
| `ThemeRuntimeError` | a Theme script throws after a successful mount |

*Note:* when `<variant>:<orientation>` is unsupported, prefer `RatioUnsupported` if the variant is otherwise valid at another orientation, else `VariantUnsupported`; both are acceptable and consumers should handle both. The name `RatioUnsupported` is kept verbatim from Architecture §45 for traceability even though form factor is now expressed as orientation.

### 20.2 Structure

Each error MUST carry: `code`, `message`, `theme`, `version`, and where relevant `variant`/`orientation`/`resource`. Errors from `mount` reject its Promise; errors after mount are delivered to a Runtime error sink/callback the consumer can subscribe to.

### 20.3 Local failure

**A failed HUD MUST fail locally and MUST NOT break the host** [Arch §45, §54.18, Vision §18, §23]. The Runtime MUST catch all Theme errors (mount, script, animation loop) at the Theme boundary. The consumer decides what to do — hide the HUD, show fallback content, switch Theme, report diagnostics [Arch §45]. The Runtime MUST NOT: rethrow into host code paths, leave partial DOM on mount failure (§6.2), or leak a broken animation loop (it MUST tear the instance down on an unrecoverable `ThemeRuntimeError`).

### 20.4 Compatibility checks feed the error model

Steps 5/6/7/9 of §12 produce `ManifestInvalid` / `ContractUnsupported` / `RendererUnsupported` / `Variant|RatioUnsupported` respectively. This is how the capability-based compatibility model (§18) is enforced at load time.

---

## 21. Publication rules & backward compatibility

### 21.1 Publication

- Only validated, built output is deployed [Arch §32, §49].
- Deployment is `build → validate → stage → deploy → verify` [Arch §49].
- A published version is immutable (§4.3) [Arch §2.4, §30].
- Registry index metadata (mutable) is updated only after Theme assets are live [Arch §49].
- The CDN is never the editing environment [Arch §32, §2.3].

### 21.2 Backward compatibility & additive evolution

- New platform capabilities are introduced **additively wherever practical** [Arch §2.5, §54.19, Vision §24.6].
- A Theme evolves through many `version` releases at one `contractVersion` [Vision §17].
- Adding a slot, composition, orientation or capability to a Theme is a **MINOR** bump and MUST NOT break existing consumers (§4.2).
- Removing/renaming a slot or composition, or changing `slots.required`, is a **MAJOR** bump.
- Existing HUDs and consumers are migrated incrementally, not rewritten [Arch §2.5, §40, Vision §24.7]; behaviour is preserved before redesign [Arch §54.20].

### 21.3 Deprecation

A Theme version MAY be marked deprecated in the Registry index (a hint, not a removal). Actual removal of a published version is an owner decision and MUST be announced; pinned consumers MUST be given a migration path [Vision §24.7].

---

## 22. `knownDeviations[]`

### 22.1 Purpose

The formal, machine-readable mechanism for a 1.0 Theme to declare **where it does not fully meet this Contract**, so validation passes **with eyes open** [Inv §8, issue #4 AC, §19.3].

### 22.2 Shape

```jsonc
"knownDeviations": [
  { "code": "no-maxi-portrait", "scope": "maxi:portrait", "clause": "8.3",
    "note": "full portrait maxi deferred; owner D accepted 2026-09-09",
    "plannedResolution": "Contract 1.1 / Platform 0.2" }
]
```

### 22.3 Recognised 1.0 codes

| Code | Deviation | Clause | Basis |
|---|---|---|---|
| `no-maxi-portrait` | full portrait `maxi` composition not provided | §8.3 | owner D |
| `no-maxi-landscape` | full landscape `maxi` composition not provided (portrait-native Theme, e.g. HUD-10) | §8.5 | orientation model |
| `external-io-on-mount` | page-load network I/O to an allowlisted host during mount | §16.3 | owner F / Inv §1.4 |
| `shadow-dom-fallback` | CSS Theme fell back from Shadow DOM to scoped-root | §15.3 | Plan d8 |
| `shared-base-host-selectors-stripped` | legacy host-wide reset rules rewritten at packaging | §15.4 | Inv H12 |

*Note:* scaled miniatures for `mini`/`micro` (§7.3), single-instance operation (§16.5), and `overflowVisible: true` (§15.5, via the manifest flag) are all **conformant** and require **no** deviation entry.

### 22.4 Rules

- A deviation with an **unrecognised** `code` MUST fail validation (§19.3) — deviations cannot be invented to bypass checks.
- Each deviation SHOULD name a `clause` and SHOULD carry a `plannedResolution`.
- `knownDeviations` is surfaced in the Registry index so consumers can see what a Theme does not do.
- Deviations are for **accepted 1.0 compromises**, not bugs.

---

## 23. Visual Composer independence

This Contract is **not** Visual Composer's internal document model [Arch §35, §53.5, §2.2, §54.9, Vision §24.3]. Visual Composer:

- **consumes** this Contract, the Component Library, the Registry and the validation rules;
- **produces** Theme sources, manifests and buildable packages that conform to this Contract;
- MUST NOT define a private runtime format, and MUST NOT require the Runtime, Registry or consumers to understand any Visual-Composer-specific structure.

Any field the Runtime does not need MUST NOT be in the manifest; Visual-Composer authoring metadata lives in `sources/` (§2.2) or outside the package entirely. The Contract is frozen and versioned independently of any editor [Arch §52].

---

## 24. Contract evolution

### 24.1 Versioning of this document

`MAJOR.MINOR` (no patch). `1.0` is the first frozen Contract.

### 24.2 MINOR (additive, backward-compatible)

- new OPTIONAL manifest field;
- new capability flag;
- new standard slot;
- new allowlist host or `dataSource` provider;
- new recognised `knownDeviations` code;
- the `<nebula-hud>` adapter (§14.5);
- promoting a reserved renderer (`video`/`static`/`gadget`) to supported.

A MINOR bump MUST NOT invalidate an existing conformant Theme or require a Runtime change to keep mounting existing Themes.

### 24.3 MAJOR (breaking)

- removing/renaming a manifest field or changing its meaning;
- removing a standard slot or changing slot semantics consumers rely on;
- changing the lifecycle signatures or ordering guarantees;
- tightening a rule such that previously-valid Themes become invalid.

A MAJOR bump ⇒ new `contractVersion` major; Runtimes that implement only the old major reject the new Themes with `ContractUnsupported` (§20).

### 24.4 Process

Contract changes follow the same review + owner-freeze gate as this document (§0). The manifest schema (#3) is bumped in lockstep where a change touches manifest shape, but keeps its own version number.

---

## 25. Cross-checked against the baseline HUDs

Per DoD: proof the Contract is **authorable, not aspirational**. Source lineage = **blogger-template lineage** [Plan A]: `widgets/sandbox/blogger-hud01-02-wip/`, `widgets/releases/blogger-pilot-hud03/`, `widgets/panels/hud-10/`, `widgets/shared/`.

### 25.1 HUD-01 — "Object Lock"

| Aspect | Contract expression |
|---|---|
| `id` / `name` | `hud-01` / `Object Lock` |
| `engine` | `svg` (§5.3) — inline `<svg>` polygon frame + HTML/CSS content + 4-layer SVG glow runner [Inv §1.2] |
| `variants` | `["maxi","mini","micro"]` |
| `orientations` | `["landscape","portrait"]` |
| `compositions` | `maxi:landscape` ✓, `mini:landscape` ✓ (scaled miniature, §7.3), `micro:portrait` ✓ (scaled miniature / `NcHudMini` `data-collapse="micro"`), `maxi:portrait` = `supported:false` (`no-maxi-portrait`), `mini:portrait`/`micro:landscape` = `supported:false` (`not-authored`) |
| `slots` | required `title`; optional `subtitle`, `media`, `visualization`, `primary`, `secondary`, `status`, `controls`, `content`, `footer` [Inv §1.12] |
| `customSlots` | `objectName` (drives `dataSource` + `skyViewer`) |
| `capabilities` | `animation`, `interactive`, `htmlSlot`, `skyViewer`, `dataSource{simbad,vizier,ads}`, `modes{object,html}`, `multiInstance:true` — the last because `NcHud01.init(widget,cfg)` is a per-widget factory with a cooperative page-global Aladin loader [Inv, `blogger-hud01-template.js`] |
| `isolation` | `scoped-root` (Aladin head injection — §15.2) |
| `overflowVisible` | `true` (glow runner) — conformant flag, no deviation |
| `knownDeviations` | `no-maxi-portrait`, `external-io-on-mount` |
| Teardown | renderer wraps unchanged Theme, destroys Aladin, aborts SIMBAD/VizieR fetches, removes toolbar `click` + panel `animationend` + `NcHudMini` toggle listeners (no `keydown` exists) [Inv §1.6, §17.1] |

### 25.2 HUD-02 — "Object Report"

| Aspect | Contract expression |
|---|---|
| `id` / `name` | `hud-02` / `Object Report` |
| `engine` | `svg` — two inline `<svg>`s (frame + runner overlay) [Inv §1.14] |
| `variants` / `orientations` | as HUD-01 |
| `compositions` | as HUD-01 (`maxi:portrait` deferred) |
| `slots` | as HUD-01 (`nc-or-*` internals) [Inv §1.19] |
| `capabilities` | as HUD-01; uses shared `NcHudMini` for the toggle; `NcHud02.init(widget,cfg)` factory + cooperative Aladin loader ⇒ `multiInstance:true` |
| `isolation` | `scoped-root` |
| `overflowVisible` | `true` (separate runner-overlay SVG) |
| `knownDeviations` | `no-maxi-portrait`, `external-io-on-mount` |

### 25.3 HUD-03 — "HUD Post / Character Post"

| Aspect | Contract expression |
|---|---|
| `id` / `name` | `hud-03` / `HUD Post` |
| `engine` | `css` (§5.4) — `clip-path: polygon()` frame on `<div>`s + `filter: drop-shadow()`; near-zero JS [Inv §1.21] |
| `variants` | `["maxi","mini","micro"]` — `mini`/`micro` MAY adopt the **genuine** `.nc-hp-mini-card` composition (§7.3 option b) or a scale (option a); both conformant [Inv §1.26] |
| `orientations` | `["landscape","portrait"]` |
| `compositions` | `maxi:landscape` ✓, `mini:landscape` ✓, `micro:portrait` ✓, `maxi:portrait` = `supported:false` (`no-maxi-portrait`; HUD-10 is the future portrait editorial start point) |
| `slots` | required `title`; optional `subtitle` (`nc-hp-system`), `media` (`nc-hp-float-image`), `content` (`nc-hp-text`), `footer` (`nc-hp-frame-ticker`), `status` [Inv §1.29] |
| `capabilities` | `animation`, `htmlSlot`, `interactive` (toggle only); no `dataSource`. `multiInstance:true` is **available**: `blogger-hud03-template.js` is only the `NcHudMini` toggle module (~130 lines) — it holds no per-panel global state; each post calls `NcHudMini.init({widget, panel})` on its own element and the per-post snippet guards with `:not([data-hud-init])`. There is no Theme factory in the module itself. Not a mandate (§16.5). |
| `isolation` | `shadow-dom-preferred` → kept only if `clip-path`+`drop-shadow`+`float` survive (§15.3), else `scoped-root` + `shadow-dom-fallback` |
| `overflowVisible` | `true` (`drop-shadow` outside the box) |
| `knownDeviations` | `no-maxi-portrait`; possibly `shadow-dom-fallback`, `shared-base-host-selectors-stripped` |

### 25.4 HUD-10 — portrait editorial SVG panel

| Aspect | Contract expression |
|---|---|
| `id` / `name` | `hud-10` / (portrait panel) |
| `engine` | `svg` — portrait SVG panel, native canvas ~992×1586 (≈0.63, not 9:16 — fine under §8.1), `aspect-ratio` CSS + auto-scaling `viewBox` [Inv §0.4, `blogger-hud10-template.css`] |
| `variants` | `["maxi","mini","micro"]` |
| `orientations` | `["landscape","portrait"]` |
| `compositions` | `maxi:portrait` ✓ **shipped as-is** (this Theme is natively portrait — §8.3 exception), `mini:portrait`/`micro:portrait` ✓ via `NcHudMini`, `mini:landscape`/`micro:landscape` ✓ or `supported:false`, `maxi:landscape` MAY be `supported:false` + `knownDeviations: no-maxi-landscape` if a landscape full composition is not authored |
| `slots` | `title`, `subtitle`, `media`, `content`, `footer` (editorial, same family as HUD-03) |
| `capabilities` | `animation`; `htmlSlot`; uses `NcHudMini` (`NcHud10.init`, `panelW` default 901) |
| `isolation` | `scoped-root` (SVG family) |
| `overflowVisible` | `true` (`hudBreath` box-shadow) |
| `knownDeviations` | `no-maxi-landscape` if landscape full not authored |
| Under the orientation model | HUD-10 is a **normal Theme**: it happens to be portrait-native, ships its portrait `maxi`, and defers landscape `maxi` the same way landscape Themes defer portrait `maxi`. No special-casing (reconciles former §8.5 / §25.4 tension). |

*Note:* HUD-04 (media-embed variant of HUD-03) maps identically to HUD-03 plus `capabilities.mediaEmbed{app.heygen.com, www.youtube.com, player.vimeo.com, lifecycle:"src-swap"}`, a `MutationObserver` the renderer must `disconnect()` on `destroy` (§17.1), and `knownDeviations` unchanged. It is omitted from the four-row table only because it is structurally HUD-03; the Contract covers it via §10.5 and §17.2.4.

### 25.5 Conclusion

All four (five with HUD-04) baseline Themes express fully in manifest + Contract terms with only the **owner-sanctioned** deviations (`no-maxi-portrait`, `external-io-on-mount`, and possibly `shadow-dom-fallback` / `no-maxi-landscape` / `shared-base-host-selectors-stripped`). Nothing in the baseline requires a Contract mechanism that does not exist here [issue #4 AC].

---

## 26. Open for owner — RESOLVED

All items previously open were resolved by owner decisions dated 2026-09-09. Recorded here for traceability:

| # | Question | Resolution |
|---|---|---|
| O1 | `micro` in or out of 1.0? | **IN.** `micro` is a REQUIRED portrait miniature variant (§7.1). Supersedes the issue #4 out-of-scope list. |
| O2 | Is `multiInstance` an expected 1.0 deliverable? | **No.** Multi-instance is SUPPORTED where a Theme provides a per-widget factory (blogger lineage does) and is **not** a 1.0 validation requirement (§16.5). Single-instance is fully conformant. |
| O3 | Does HUD-10 ship its portrait `maxi`? | **Yes.** A portrait-native Theme ships its portrait `maxi`; other Themes defer it (§8.3, §25.4). HUD-10 is not a special case under the orientation model. |
| O4 | Platform-provided versioned base vs per-Theme vendoring? | **Platform-provided, versioned**, `baseVersion` in the manifest (§11.2). |
| O5 | Live post-mount `mode` switching in 1.0? | **No.** Construct a new `Hud` instance (§11.1). |
| O6 | Media-embed host allowlist? | **`app.heygen.com`, `www.youtube.com`, `player.vimeo.com`** — normative in §16.2. |

No owner decision remains outstanding except the §0 freeze.

---

## 27. Handoff to #3 (manifest JSON Schema)

The exact field list, types and constraints the schema MUST encode. §3 remains the prose authority.

### 27.1 Top-level fields

| Field | JSON type | Required | Constraint |
|---|---|---|---|
| `schemaVersion` | string | ✅ | `^\d+\.\d+$` |
| `contractVersion` | string | ✅ | `^\d+\.\d+$`; 1.0 Runtime accepts major `1` |
| `id` | string | ✅ | `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, len 3–40 |
| `name` | string | ✅ | len 1–80 |
| `version` | string | ✅ | strict SemVer `^\d+\.\d+\.\d+$` |
| `description` | string | — | len ≤ 200 |
| `engine` | string enum | ✅ | `svg` \| `css` \| `video` \| `static` \| `gadget` |
| `baseVersion` | string | ✅ | **exact SemVer `^\d+\.\d+\.\d+$` OR caret range `^\^\d+\.\d+\.\d+$`** — no tilde, no other operators |
| `variants` | array<string enum> | ✅ | items ∈ `maxi`\|`mini`\|`micro`; unique; **1.0: MUST equal the set `{maxi,mini,micro}`** |
| `orientations` | array<string enum> | ✅ | items ∈ `landscape`\|`portrait`; unique; **1.0: MUST equal the set `{landscape,portrait}`** |
| `ratios` / `aspectRatios` | — | ❌ | **MUST NOT be present** (removed §3.3) → `ManifestInvalid` |
| `compositions` | object | ✅ | keys `^(maxi\|mini\|micro):(landscape\|portrait)$`; **exactly one key per `variants` × `orientations` (6 in 1.0)**; value = composition object (§27.2); `maxi:landscape`, `mini:landscape`, `micro:portrait` MUST have `supported:true`; `maxi:portrait` MUST have `supported:true` OR a `knownDeviations` `no-maxi-portrait` entry |
| `slots` | object | ✅ | `{ required: string[], optional: string[] }`; every item ∈ the standard slot enum (§27.9) or a `customSlots[].name`; arrays unique; `required ∩ optional == ∅` |
| `customSlots` | array<object> | — | §27.3 |
| `capabilities` | object | ✅ | §27.4 |
| `entrypoints` | object | ✅ | **keys == the set of composition keys with `supported:true` (no more, no fewer)**; value = entrypoint object (§27.5) |
| `externalResources` | array<object> | — | §27.6 |
| `animations` | array<string> | — | unique; `^[A-Za-z][A-Za-z0-9_-]*$` |
| `isolation` | string enum | ✅ | `scoped-root` \| `shadow-dom` \| `shadow-dom-preferred` \| `iframe`; if `engine=svg` and (`capabilities.skyViewer` or `capabilities.dataSource`) then MUST be `scoped-root` |
| `overflowVisible` | boolean | — | default `false` |
| `knownDeviations` | array<object> | — | §27.7 |
| `preview` | object | — | keys = composition keys; values = package-relative path |
| `metadata` | object | — | free-form; Runtime ignores |

Schema MUST set `"additionalProperties": false` at top level.

### 27.2 Composition object

```
{ "dir": string (package-relative, no "../", no scheme),   // required when supported=true
  "supported": boolean,                                     // required
  "reason": string }                                        // required when supported=false
```

### 27.3 Custom-slot object

```
{ "name": string  ^[a-z][a-zA-Z0-9]*$  (NOT in the standard slot enum §27.9),   // required
  "kind": "text"|"html"|"url"|"ref"|"config",                                   // required
  "required": boolean,                                                           // default false
  "description": string (len 1–200) }                                            // required
```

### 27.4 `capabilities` object

`additionalProperties: false`. All keys optional; absence = false/not-present.

| Key | Type | Shape |
|---|---|---|
| `animation` | boolean | — |
| `interactive` | boolean | — |
| `background` | boolean | — |
| `htmlSlot` | boolean | — |
| `multiInstance` | boolean | — |
| `skyViewer` | boolean | — (the **only** way to declare Aladin; `aladin.cds.unistra.fr` is never a `dataSource` provider/host) |
| `dataSource` | object | `{ providers: enum["simbad","vizier","ads"][] (closed, no "aladin"/"googleFonts"), hosts: string[] (⊆ §10.3 provider hosts), input: string, timing?: object }` |
| `mediaEmbed` | object | `{ hosts: string[] (⊆ ["app.heygen.com","www.youtube.com","player.vimeo.com"]), lifecycle: "src-swap"\|"static" }` |
| `modes` | object | `{ values: string[] (≥1), default: string (∈ values), config: string }` |

### 27.5 Entrypoint object

```
{ "styles":  string[]  (package-relative, ordered, may be []),   // required
  "markup":  string     (package-relative, exactly one),         // required
  "scripts": string[]   (package-relative, ordered, may be []) } // required
```

All paths: `^[^/].*`, no `../`, no scheme, must be inside the package.

### 27.6 External-resource object

```
{ "host": string (bare hostname, ^[a-z0-9.-]+$),   // required
  "kind": "script"|"style"|"font"|"fetch"|"iframe", // required
  "timing": "page-load"|"lazy",                     // required
  "required": boolean,                              // default false
  "note": string }                                  // optional
```

Validation (beyond schema): `host` ∈ §16.2 allowlist OR a matching `knownDeviations` entry exists.

### 27.7 Known-deviation object

```
{ "code": enum(no-maxi-portrait | no-maxi-landscape | external-io-on-mount |
               shadow-dom-fallback | shared-base-host-selectors-stripped),   // required, CLOSED set
  "scope": string ("all" | comma-list of composition keys | capability name),  // required
  "clause": string (Contract clause, e.g. "8.3"),      // optional
  "note": string,                                       // required
  "plannedResolution": string }                         // optional
```

### 27.8 Cross-field rules the schema (or the validator layered on it) MUST enforce

1. `ratios` / `aspectRatios` absent (removed) — presence ⇒ invalid, message points to `orientations`.
2. `variants` == `{maxi,mini,micro}` and `orientations` == `{landscape,portrait}` in 1.0.
3. `compositions` has **exactly one key per `variants` × `orientations`** (6 keys); keys match `^(maxi|mini|micro):(landscape|portrait)$`.
4. `compositions["maxi:landscape"|"mini:landscape"|"micro:portrait"].supported === true`.
5. `compositions["maxi:portrait"].supported === true` **OR** a `knownDeviations` entry with `code: "no-maxi-portrait"` exists.
6. `entrypoints` keys === the set of `compositions` keys with `supported: true` — exactly, no extras, no omissions.
7. `slots.required ∩ slots.optional === ∅`; every entry ∈ the standard slot enum (§27.9) or a `customSlots[].name`.
8. `engine ∈ {video,static,gadget}` ⇒ schema-valid but emit a WARNING annotation (no 1.0 Runtime).
9. `engine === "svg"` && (`capabilities.skyViewer` || `capabilities.dataSource`) ⇒ `isolation === "scoped-root"`.
10. every `externalResources[].host`, `capabilities.dataSource.hosts[]`, `capabilities.mediaEmbed.hosts[]` is on the §16.2 allowlist unless covered by a `knownDeviations` entry.
11. `capabilities.dataSource.providers` ⊆ `{simbad,vizier,ads}` (closed); `capabilities.dataSource.hosts` ⊆ the §10.3 hosts for the declared providers.
12. `knownDeviations[].code` ∈ the closed set (§27.7); unknown ⇒ invalid.
13. `contractVersion` major must be `1` for a Theme intended for the 1.0 Runtime.
14. `baseVersion` matches exact-SemVer or caret-range only (§27.1).

### 27.9 Standard slot-name enum (closed, 1.0)

```
"title" | "subtitle" | "status" | "primary" | "secondary" |
"media" | "visualization" | "controls" | "content" | "footer"
```

Any other slot name in `slots.required` / `slots.optional` MUST be declared in `customSlots` or the manifest is invalid. Extending this enum is a Contract MINOR bump (§24.2).

---

## 28. Traceability index

| Contract § | Vision / Architecture / Plan / Owner basis |
|---|---|
| 1 Purpose & status | Vision §25; Arch §12, §55; owner 2026-09-09 (form-factor reframe) |
| 2 Package structure | Arch §7, §10; Vision §7; Plan d4 |
| 3 Manifest fields | Arch §11, §54.11; Vision §8; Inv §8 (#3 table) |
| 4 ID & versioning | Arch §17, §30, §54.10; Vision §17 |
| 5 Renderer identifiers | Arch §16, §50, §54.15–16; Plan d9 |
| 6 Lifecycle | Arch §22 |
| 7 Variants | Arch §13, §54.13; Vision §11; owner 2026-09-09 |
| 8 Orientations | Arch §14, §54.14; Vision §10; owner 2026-09-09 (was owner C/D) |
| 9 Slots | Arch §15, §53.1; Vision §12; Inv §1.12/§1.19/§1.29/§1.36, H6 |
| 10 `dataSource` | owner F; Inv §1.4, §1.8, H8/H9 |
| 11 Modes & base | owner E; Inv §1.8, H7, H14; Plan §3 |
| 12 Resolution flow | Arch §29, §23 |
| 13 Reserved | — |
| 14 Consumer API | Arch §25, §26, §51; Plan d10 |
| 15 CSS isolation | Arch §41, §42, §53.2; Plan d8; Inv H11/H12/H13 |
| 16 JS & external-resource policy | Arch §43, §54.17; Vision §18; Plan Q4; owner 2026-09-09; Inv H9/H15 |
| 17 Teardown | Arch §22, §43, §46; Inv §6.5, H10 |
| 18 Compatibility | Arch §31 |
| 19 Validation | Arch §46, §19; Vision §19 |
| 20 Error model | Arch §45, §54.18; Vision §18 |
| 21 Publication & back-compat | Arch §2.4, §2.5, §32, §49, §54.19–20; Vision §17, §24.6–7 |
| 22 `knownDeviations` | Inv §8; issue #4 AC |
| 23 Visual Composer independence | Arch §2.2, §35, §52, §53.5, §54.9; Vision §24.3 |
| 24 Contract evolution | Arch §31, §2.5 |
| 25 Baseline cross-check | Arch §2.6, §39, §40; Plan A; Inv §1–§7 |
| 26 Open for owner (resolved) | owner 2026-09-09 |
| 27 Handoff to #3 | Inv §8 (#3 table); Arch §11 |

---

## 29. Resolution of the inventory §8 handoff (H1–H15)

| # | Handoff decision | Resolution in this Contract |
|---|---|---|
| **H1** | Source lineage | **Blogger-template lineage** [owner A]. §2, §11, §25 authored against it. |
| **H2** | `maxi` = expanded panel, as an authored variant | §7.2 — `maxi` MUST be an authored composition, fully expanded, no toggle. |
| **H3** | `mini` for HUD-01/02: scale crop vs authored | §7.3 — **either is conformant for any Theme/engine**; scaled miniature is the sanctioned norm, no `knownDeviations` needed. The earlier engine-scoped exception is removed [owner 2026-09-09]. |
| **H4** | `micro` reserved / out of 1.0 | **Superseded** [owner 2026-09-09]: `micro` is IN 1.0 as a REQUIRED portrait miniature (§7.1). |
| **H5** | `9:16` compositions do not exist | §8 — reframed as orientations. `micro:portrait` REQUIRED (the vertical thumbnail); full portrait `maxi` DEFERRED (`no-maxi-portrait`), except portrait-native Themes (HUD-10) ship it. No exact-ratio requirement (§8.1). |
| **H6** | Semantic slot vocabulary; `system`/`ticker` fate | §9.2 — standard vocabulary ratified as a closed enum (§27.9); `system` → `subtitle`, `ticker` → `footer`; `controls`/`visualization` Theme-owned. |
| **H7** | HUD-01/02 dual personality | §11.1 — **one Theme** with `capabilities.modes {object, html}` (owner E). |
| **H8** | Fetched-not-injected content policy | §10 — `capabilities.dataSource` with a closed provider enum `{simbad,vizier,ads}` and host allowlist; name-in / rendering-out (owner F). |
| **H9** | External-resource allowlist, timing, kind taxonomy | §3.13, §16.2 — normative allowlist; `externalResources[]` optional for allowlisted hosts; `kind` ∈ {script,style,font,fetch,iframe}; `timing` ∈ {page-load,lazy}. |
| **H10** | JS lifecycle / teardown hook signature | §17.1 — `init(root, context) → { setData?, resize?, setVariant?, destroy! }`; renderer wraps Themes lacking hooks and owns teardown (concrete targets listed; no `keydown` exists in the lineage). |
| **H11** | Isolation mechanism per family | §15 — `scoped-root` baseline; `shadow-dom-preferred` (attempt + validate + fall back with `shadow-dom-fallback`) for the `css` family; Shadow DOM NOT attempted for HUD-01/02. |
| **H12** | Shared-foundation CSS policy | §15.4, §15.6, §11.2 — host-wide selectors stripped/root-scoped at packaging (`shared-base-host-selectors-stripped`); shared `@keyframes` owned & de-duplicated by the platform base; Theme declares `animations`. |
| **H13** | `overflow: visible` glow | §15.5, §3.1 `overflowVisible` — a conformant manifest flag; renderer MUST NOT hard-clip; validation respects it. No deviation entry needed. |
| **H14** | Shared-foundation ownership | §11.2 — **platform-provided versioned base**, injected once per page; `baseVersion` REQUIRED [owner O4]. |
| **H15** | Single-instance constraint | §16.5 — single-instance fully conformant, **not** a defect and **not** a validation requirement; `multiInstance: true` allowed where a per-widget factory exists (blogger lineage HUD-01/02; HUD-03/04 via per-widget `NcHudMini` + `data-hud-init` guard). Defined 0.2 path via instance factory. |

---

## 30. Resolution of Plan §7 owner decisions A–F (+ 2026-09-09 reframe)

| Owner decision | Baked into the Contract |
|---|---|
| **A — Source lineage = blogger-template** | §2, §11.2, §25. |
| **B — Migration input under version control** | Not a Contract clause (done, commit `aa13591`); §25 relies on it. |
| **C — HUD-01/02 `mini` scale + `mini` in both orientations** | Reframed 2026-09-09: `mini` = landscape miniature (REQUIRED), `micro` = portrait miniature (REQUIRED); scaled miniature is the norm for any Theme (§7.3). |
| **D — Full portrait `maxi` deferred** | §8.3 — `maxi:portrait` MAY be `supported:false` + `no-maxi-portrait`; portrait-native Themes (HUD-10) ship it. |
| **E — object-viewer vs html-frame = one Theme + flag** | §11.1 — `capabilities.modes {object, html}`. |
| **F — astronomy data stays a Theme concern** | §10 — `capabilities.dataSource` (providers `{simbad,vizier,ads}`) + §16.3 permits page-load I/O (`external-io-on-mount`). |
| **2026-09-09 — orientation model** | §1.4, §8 — `orientations` replaces `ratios`; no pixel-exact enforcement. |

---

## 31. Architecture §55 coverage checklist

| §55 item | Contract § |
|---|---|
| canonical Theme package structure | §2 |
| manifest fields (schema is #3; prose authority here) | §3, §27 |
| Theme ID and naming rules | §4.1 |
| semantic versioning | §4.2–4.4 |
| renderer identifiers | §5 |
| renderer lifecycle | §6 |
| variant requirements | §7 |
| aspect-ratio requirements (→ orientation requirements) | §8 |
| standard slot vocabulary | §9.2, §27.9 |
| custom-slot rules | §9.4 |
| asset addressing | §11.3, §2.2 |
| Registry resolution | §12 |
| Runtime behavior | §6, §12, §14, §20 |
| CSS isolation rules | §15 |
| JavaScript policy | §16, §17 |
| error model | §20 |
| compatibility rules | §18, §24 |
| validation rules | §19 |
| publication rules | §21.1 |
| backward compatibility | §21.2, §24 |
| (Arch §12 extra) Visual Composer independence | §23 |
| (Arch §12 extra) failure behavior | §20.3 |

---

*End of HUD Theme Contract 1.0 (draft — awaiting owner freeze, §0).*
