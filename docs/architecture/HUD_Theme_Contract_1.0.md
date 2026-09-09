# HUD Theme Contract 1.0

**Status:** Draft — awaiting owner freeze (see §0)
**Contract version:** `1.0`
**Document type:** Normative specification
**Depends on:** HUD Platform Vision 0.3, HUD Platform Architecture 0.3, HUD Platform 0.1 Implementation Plan 0.1, HUD Platform 0.1 Existing HUD Implementation Inventory (Story #2)
**Consumed by:** HUD Runtime, HUD Registry / CDN, Visual Composer, HUD Playground, consumer applications
**Defines:** the stable boundary between a HUD Theme and everything that loads, renders, validates, publishes or consumes it

---

## 0. Owner freeze

Contract 1.0 is a **Plan §6 P1 hard gate**. No implementation Story in Epics #20 / #21 / #23 / #24 (Runtime, renderers, packaging, publication, Playground, external consumer) may start until the owner records the freeze here, co-frozen with the manifest JSON Schema (#3).

```
[ ]  HUD Theme Contract 1.0 is FROZEN.
     Owner: ____________________    Date: ____________
     Co-frozen with: registry/schemas/manifest.schema.json  version ______

     Open-for-owner items (§26) accepted as logged:  [ ] yes   [ ] see notes
     Notes:
```

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

*Note:* "Platform 0.1" is a delivery milestone, not a version of this Contract. This document is called "1.0" because it is the first frozen Contract; the Platform 0.1 scope decisions it bakes in (SVG+CSS only, `9:16` maxi deferred, etc.) are expressed as Contract rules and `knownDeviations`, not as a separate "0.1 profile".

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
- The source layout MAY differ from the published layout (e.g. a source may keep a single `styles/` tree that the build splits per composition); only the **published** layout below is normative for consumers and the Runtime.

### 2.2 Published package layout (normative)

Per Architecture §7, §10 and Vision §7, literally:

```
themes/<id>/<version>/
├── manifest.json            REQUIRED — the authoritative descriptor (§3)
│
├── micro/                   OPTIONAL — present only if "micro" is a declared variant
│   ├── 16x9/
│   └── 9x16/
├── mini/                    REQUIRED
│   ├── 16x9/                REQUIRED
│   └── 9x16/                REQUIRED (mini portrait — owner C)
├── maxi/                    REQUIRED
│   ├── 16x9/                REQUIRED
│   └── 9x16/                OPTIONAL in 1.0 — MAY be declared unsupported (owner D, §8)
│
├── assets/                  OPTIONAL — Theme-local binary/text assets
│   ├── images/
│   ├── video/
│   ├── svg/
│   └── textures/
├── styles/                  OPTIONAL — shared-across-composition CSS
├── scripts/                 OPTIONAL — Theme JavaScript (§17)
├── preview/                 OPTIONAL — static preview images / poster frames
└── sources/                 OPTIONAL — non-runtime authoring sources, excluded from runtime resolution
```

Rules:

1. `manifest.json` MUST exist at the package root [Arch §11].
2. Directories a Theme does not use MAY be omitted [Arch §10]. The `<variant>/<ratio>/` directories that the manifest's `compositions` map references MUST exist and MUST contain the files their `entrypoints` list.
3. Directory names for ratios are `16x9` and `9x16` on the filesystem; the corresponding manifest tokens are `16:9` and `9:16` (§8). The mapping is fixed.
4. `sources/` and any path listed in the build's exclude set MUST NOT be required for runtime rendering and MAY be omitted from the deployed package entirely [Arch §44].
5. All runtime paths in the manifest MUST be **relative to the package root** and MUST NOT use `../` or absolute URLs (external hosts are declared separately, §3.13, §16).

### 2.3 Determinism & caching

A published version directory (`themes/<id>/<version>/…`) is immutable (§4.4) and MUST be safe for aggressive immutable caching [Arch §34]. Mutable discovery metadata (`registry/index.json`) is served with a short cache policy and is not part of a Theme package.

---

## 3. Manifest field enumeration

The manifest (`manifest.json`) is the **authoritative machine-readable description** of the Theme [Arch §11, decision §54.11]. This section is the prose authority; Story #3 encodes it as JSON Schema. Where this section and the schema disagree, **this section wins** until the Contract is revised.

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
| `baseVersion` | string SemVer or SemVer range | REQUIRED | Which platform shared-foundation ("base") version the Theme expects (§11) [Inv H14]. |
| `variants` | array of string enum | REQUIRED | Subset of `["micro","mini","maxi"]`, MUST include `"mini"` and `"maxi"` [Arch §13]. §7. |
| `ratios` | array of string enum | REQUIRED | Subset of `["16:9","9:16"]`, MUST include `"16:9"` [Arch §14]. §8. (`aspectRatios` accepted as a deprecated alias; §3.3.) |
| `compositions` | object | REQUIRED | Map `"<variant>:<ratio>" → composition object` (§3.9). Declares which variant×ratio pairs the Theme provides. |
| `slots` | object `{required:[],optional:[]}` | REQUIRED | Declared semantic slots (§9). `required` MAY be empty; `optional` MAY be empty. |
| `customSlots` | array of custom-slot objects | OPTIONAL | Theme-defined slots beyond the standard vocabulary (§9.4). |
| `capabilities` | object | REQUIRED | Declared capability flags (§3.11, §10, §11). Absent capability = capability not present. |
| `entrypoints` | object | REQUIRED | Ordered load lists per composition (§3.10). |
| `externalResources` | array | OPTIONAL | Hosts the Theme loads from, with kind + timing (§3.13, §16). |
| `animations` | array of string | OPTIONAL | Names of shared `@keyframes` / animation identifiers the Theme consumes (§15.4) [Inv H12]. |
| `isolation` | string enum | REQUIRED | `scoped-root` \| `shadow-dom` \| `shadow-dom-preferred` \| `iframe` (§15) [Inv H11]. |
| `overflowVisible` | boolean | OPTIONAL (default `false`) | `true` = the Theme paints decoration outside its bounding box; the renderer MUST NOT hard-clip the mount (§15.5) [Inv H13]. |
| `knownDeviations` | array of deviation objects | OPTIONAL | Formal declarations of where the Theme does not fully meet this Contract (§22). |
| `preview` | object | OPTIONAL | `{ "<variant>:<ratio>": "preview/<file>" }` static preview images. |
| `metadata` | object | OPTIONAL | Free-form non-normative tags/categories for discovery. Ignored by the Runtime. |

### 3.2 `schemaVersion` vs `contractVersion` vs `version`

These are three orthogonal axes [Arch §30, §31]. Validation MUST check all three are present and well-formed. A Theme MAY, over many `version` releases, keep the same `contractVersion` and `schemaVersion` [Vision §17].

### 3.3 `ratios` / `aspectRatios`

The canonical key is `ratios`. `aspectRatios` (used in Architecture §11's illustrative JSON) is accepted as a **deprecated alias** for one minor-version migration window; if both appear they MUST be equal or validation fails. Story #3 SHOULD warn on `aspectRatios`.

### 3.4 `id`

See §4.1 for the grammar. MUST be unique in the Registry. MUST equal the `<id>` path segment of the package.

### 3.5 `name`

Display only. MAY contain spaces and mixed case. MUST NOT be used by any consumer as a key.

### 3.6 `version`

Strict SemVer 2.0.0 `MAJOR.MINOR.PATCH`, no pre-release or build metadata in 1.0. MUST equal the `<version>` path segment of the package. Immutable (§4.3).

### 3.7 `engine`

Exactly one value (§5). A Theme is single-engine in 1.0; composite/multi-engine Themes are out of scope.

### 3.8 `baseVersion`

The platform provides a **versioned shared foundation** ("base": reset-scoping, tokens, shared `@keyframes`, `.nc-panel-sweep`, `hud-core.js`, `NcHudMini`, `hud_papers.js` where used) that the Runtime injects **once per page** (§11) [Inv H14, Plan §3]. The Theme declares the base version it was authored against as an exact version or a caret range (`^1.2.0`). The Runtime MUST resolve a compatible base or fail with `AssetLoadFailed` (§20). `baseVersion` is REQUIRED even for a nominally self-contained Theme, so the compatibility check is always explicit.

### 3.9 `compositions`

```jsonc
"compositions": {
  "maxi:16:9": { "dir": "maxi/16x9", "supported": true },
  "mini:16:9": { "dir": "mini/16x9", "supported": true },
  "mini:9:16": { "dir": "mini/9x16", "supported": true },
  "maxi:9:16": { "supported": false, "reason": "portrait-maxi-deferred-1.0" }
}
```

- Keys are `"<variant>:<ratio>"` for every combination in `variants` × `ratios`.
- Each value is an object: `dir` (string, package-relative, REQUIRED when `supported` is `true`), `supported` (boolean, REQUIRED), `reason` (string, REQUIRED when `supported` is `false` — SHOULD reference a `knownDeviations` entry or a Contract clause).
- The **REQUIRED** set that MUST be `supported: true` for every 1.0 Theme: `maxi:16:9`, `mini:16:9`, `mini:9:16` (§7, §8, owner C).
- `maxi:9:16` MAY be `supported: false` in 1.0 (owner D). If `supported: false`, requesting it MUST fail with `RatioUnsupported` (§20) — never a rotated/scaled fallback (§8.4).
- If `micro` is in `variants`, `micro:16:9` and `micro:9:16` follow the same rules but are wholly OPTIONAL in 1.0 (§7.3).

### 3.10 `entrypoints`

The **order of loading is significant** [Inv §1.3, §3] — CSS cascade and script dependency order both matter. Therefore `entrypoints` is an **ordered list per composition**, not a set.

```jsonc
"entrypoints": {
  "maxi:16:9": {
    "styles":  ["styles/frame.css", "maxi/16x9/layout.css"],
    "markup":  "maxi/16x9/hud.svg",          // or "…/hud.html" for engine "css"
    "scripts": ["scripts/hud-01.js"]
  }
}
```

- `styles`: ordered array of package-relative CSS files, applied in array order **after** the shared base (§11).
- `markup`: exactly one package-relative entry document. For `engine: "svg"` it is an `.svg` or `.html` that hosts an inline `<svg>` plus an HTML/CSS content layer [Inv §2.1]. For `engine: "css"` it is an `.html` fragment.
- `scripts`: ordered array of package-relative JS files, executed in array order after `markup` is in the DOM and after any base scripts the Theme's `baseVersion` provides. MAY be empty.
- Every path listed MUST resolve inside the package (validation: `EntrypointMissing` at runtime, hard failure at publication, §19).
- A Theme MAY reuse the same file across compositions (e.g. one `scripts/hud-01.js` for both `mini` and `maxi`).

### 3.11 `capabilities`

Object of boolean or object-valued flags. Standard flags for 1.0:

| Capability | Type | Meaning |
|---|---|---|
| `animation` | boolean | Theme runs continuous animation (informational; affects validation's animation-cleanup check). |
| `interactive` | boolean | Theme has user-interactive controls (tabs, toggles). |
| `background` | boolean | Theme is intended as a background layer with content composed over it. |
| `htmlSlot` | boolean | Theme exposes a freeform `content` slot that accepts arbitrary consumer HTML (§9.3) [Inv H7]. |
| `dataSource` | object | Theme fetches its own data from an allowlisted host set (§10) [owner F, Inv H8]. |
| `skyViewer` | boolean | Theme embeds an Aladin Lite sky viewer driven by a coordinate/name input (§10.4) [Inv §1.5]. |
| `mediaEmbed` | object | Theme embeds third-party media iframes (HeyGen / YouTube / Vimeo) (§10.5) [Inv §1.30]. |
| `modes` | object | Theme has more than one composition personality selectable by config (§11 of Inv → §10.3 here, owner E). |
| `multiInstance` | boolean | Theme supports more than one instance per page (§17.5) [Inv H15]. Default/absent = single-instance. |

Absent = not present. An unknown capability key MUST fail validation but SHOULD be ignored by a Runtime that does not implement it.

### 3.12 `animations`

Array of animation identifiers (shared `@keyframes` names such as `hudBreath`, `hudPanelSweep`, `hudRotate`, `hudPulseOuter`) the Theme's CSS references but does not itself define [Inv §3, §2.3.3]. Used by the base-injection / namespacing machinery (§15.6) and by validation to confirm every referenced keyframe is provided by the declared `baseVersion` or by the Theme's own `styles`.

### 3.13 `externalResources`

Array of objects; each:

```jsonc
{
  "host": "aladin.cds.unistra.fr",
  "kind": "script",              // script | style | font | fetch | iframe
  "timing": "lazy",             // page-load | lazy
  "required": false,            // does the Theme fail visibly without it?
  "note": "Aladin Lite v3 sky viewer"
}
```

- `host`: bare hostname (no scheme, no path). MUST be on the platform allowlist (§16.2) OR the Theme MUST carry a `knownDeviations` entry justifying it (a 1.0 Theme MUST NOT silently reach an un-allowlisted host).
- `kind`: `script` (executable), `style` (stylesheet), `font` (font file), `fetch` (XHR/`fetch`/TAP query), `iframe` (embedded document).
- `timing`: `page-load` (loads during mount, before or during first paint) or `lazy` (loads on later interaction).
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
  "variants": ["mini", "maxi"],
  "ratios": ["16:9", "9:16"],
  "compositions": {
    "maxi:16:9": { "dir": "maxi/16x9", "supported": true },
    "mini:16:9": { "dir": "mini/16x9", "supported": true },
    "mini:9:16": { "dir": "mini/9x16", "supported": true },
    "maxi:9:16": { "supported": false, "reason": "portrait-maxi-deferred-1.0" }
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
    "maxi:16:9": { "styles": ["styles/shared.css", "maxi/16x9/hud.css"], "markup": "maxi/16x9/hud.html", "scripts": ["scripts/hud-01.js"] },
    "mini:16:9": { "styles": ["styles/shared.css", "mini/16x9/hud.css"], "markup": "mini/16x9/hud.html", "scripts": ["scripts/hud-01.js"] },
    "mini:9:16": { "styles": ["styles/shared.css", "mini/9x16/hud.css"], "markup": "mini/9x16/hud.html", "scripts": ["scripts/hud-01.js"] }
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
    { "code": "mini-is-transform-scale", "scope": "mini:16:9,mini:9:16", "clause": "7.4", "note": "mini is a transform:scale(0.352) of the maxi DOM (owner C)" },
    { "code": "no-maxi-9x16", "scope": "maxi:9:16", "clause": "8.3", "note": "portrait maxi deferred (owner D)" },
    { "code": "external-io-on-mount", "scope": "all", "clause": "16.3", "note": "Google Fonts + SIMBAD fetch during mount (owner F)" }
  ]
}
```

---

## 4. Theme ID, naming & versioning

### 4.1 Theme ID rules

- Grammar: `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` — lowercase ASCII, digit-and-hyphen separated, MUST start with a letter, no leading/trailing/double hyphen. Length 3–40.
- The baseline set uses the reserved pattern `hud-NN` where `NN` is a zero-padded number (`hud-01` … `hud-10`) [Arch §39, Plan A].
- The ID MUST be stable for the life of the Theme. Renaming a Theme means a new ID and a fresh version history.
- The ID MUST equal the manifest `id` and the `<id>` package path segment.
- IDs are globally unique within the Registry [Arch §28].

### 4.2 Semantic versioning

Theme versions are SemVer 2.0.0 `MAJOR.MINOR.PATCH` [Arch §30, Vision §17]:

- **PATCH** — a fix that changes no composition geometry, no slot vocabulary, no capability, no manifest field meaning (e.g. a colour token correction, a script bug fix).
- **MINOR** — additive, backward-compatible (a new optional slot, a new supported composition, a new capability, a new variant, a new ratio) [Arch §31].
- **MAJOR** — a breaking change to what a consumer sees: a removed/renamed slot, a removed composition, a changed required-slot set, a semantic change to how a slot is presented that a consumer relied on.

### 4.3 Immutability of published versions

- A published `themes/<id>/<version>/` directory MUST be immutable [Arch §2.4, §30, §54.10, Vision §17].
- Any change to any asset, style, script, manifest field or observable behaviour REQUIRES a new `version` [Arch §30].
- The pipeline MUST refuse to overwrite an already-published version [Arch §48, §49].
- Consumers pinning `<id>@<version>` MUST get byte-identical bytes forever (until the version is formally deprecated/removed via §24.4).

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

`video`, `static`, `gadget` are valid enum values so that manifests can be authored ahead of Runtime support and so the Registry can list such Themes [Arch §21, §51]. A 1.0 Runtime that is asked to load a Theme whose `engine` is one of these **MUST** fail with `RendererUnsupported` (§20) and MUST NOT attempt a fallback renderer [Plan d9, Arch §54.16]. Validation MUST NOT block publication of a `video`/`static`/`gadget` Theme purely on engine, but SHOULD warn that no 1.0 Runtime can mount it.

### 5.3 `svg` renderer — normative definition

The `svg` renderer:

1. MUST create the isolation boundary per the Theme's `isolation` value (§15) and mount the Theme's `markup` document inside it.
2. MUST support a `markup` document that contains **both** an inline `<svg>` layer and an HTML/CSS content layer in the same document [Inv §2.1] — it is not an "SVG document only" renderer.
3. MUST honour `overflowVisible: true` by not applying `overflow:hidden`/`clip`/`clip-path` to the mount container or any ancestor it creates (§15.5) [Inv H13].
4. MUST inject semantic data through slots (§9), never by requiring the consumer to know internal `<svg>` element IDs or `nc-ol-*` / `nc-or-*` class names [Arch §18, §15].
5. MUST drive the Theme script lifecycle (§6, §17) and guarantee teardown (§17.3).
6. MUST tolerate a Theme that injects a third-party script into `document.head` and uses `window` globals (Aladin Lite) when `isolation` is `scoped-root` [Inv §1.11, H11].

### 5.4 `css` renderer — normative definition

The `css` renderer:

1. MUST create the isolation boundary per `isolation` and mount the Theme's `markup` HTML fragment inside it.
2. MUST preserve CSS `clip-path` frames and `filter: drop-shadow()` glow that paint outside the panel box when `overflowVisible: true` [Inv §6.7, H13] — its isolation strategy MUST NOT hard-clip.
3. MUST support CSS `float` layout inside the content slot [Inv §1.21, §1.28].
4. MAY use Shadow DOM when `isolation` is `shadow-dom` or `shadow-dom-preferred`, and MUST fall back to `scoped-root` if the Theme's `clip-path` / `drop-shadow` / `float` do not survive the shadow boundary in validation (§15.3) [Plan d8, Inv H11].
5. Same slot, lifecycle and teardown obligations as §5.3 points 4–5.

### 5.5 Consumer opacity

A consumer MUST NOT be able to select a renderer directly, or branch on `engine`, or depend on which renderer a Theme uses [Arch §2.1, §16, §25]. The only consumer-visible selector is the Theme `id` (+ `version`, `variant`, `ratio`).

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
- `context` carries the resolved `{ theme, version, variant, ratio, manifest, baseVersion, assetBaseUrl }` and Runtime-provided services (logger, error sink).
- `mount` MUST be asynchronous and MUST resolve only when the composition's `styles` and `markup` are in the DOM and `scripts` have run their initialisation. Page-load `externalResources` (§3.13) MAY still be in flight (they resolve/settle independently) but the Theme MUST render a sensible pre-data state without them.
- `mount` MUST be called **exactly once** per renderer instance. A second call MUST throw.
- On any failure during `mount`, the renderer MUST reject with a typed error (§20: `EntrypointMissing`, `AssetLoadFailed`, `ThemeMountFailed`) and MUST leave `container` empty (no partial DOM) [Arch §49 "must not be partially published" analogue for mount].

### 6.3 `setData(data)`

- Synchronous. Applies semantic slot values (§9). MAY be called zero or more times, before or after the first paint, in any order.
- MUST be idempotent for equal input: calling `setData` twice with equal data MUST produce the same result as calling it once.
- Unknown slot keys MUST be ignored (not throw) and SHOULD be logged once [Arch §15].
- MUST NOT trigger a network fetch **except** for a Theme that declares `capabilities.dataSource` and only for the allowlisted providers keyed off the declared `input` (§10).
- MUST be safe to call before `mount` resolves is **not** required; the Runtime MUST queue `setData` calls made before `mount` resolves and replay them in order once mounted.

### 6.4 `resize(viewport)`

- Synchronous. `viewport` is `{ width, height }` in CSS pixels of the mount container.
- The renderer MUST re-fit the current composition to the new box. It MUST NOT switch composition, variant or ratio (those are explicit calls).
- MUST be safe to call frequently (e.g. from a `ResizeObserver`); the renderer SHOULD debounce internally if its re-fit is expensive.
- For Themes whose composition is intrinsically fluid (all four baseline Themes below a breakpoint), `resize` MAY be a no-op beyond updating a stored viewport.

### 6.5 `setVariant(variant)`

- Asynchronous. Switches to another declared variant at the **same ratio**, loading that composition's `entrypoints` if not already loaded, then transferring current slot data into the new composition.
- MUST reject with `VariantUnsupported` if `variant` is not in the manifest `variants` **or** the `<variant>:<currentRatio>` composition is `supported: false` (§3.9).
- MUST preserve slot data across the switch (the Runtime re-applies the last `setData`).
- Ratio changes are **not** performed by `setVariant`; a ratio change requires a new `Hud` instance in 1.0 (§14.4).
- If the target variant is already active, `setVariant` MUST resolve without work (idempotent).

### 6.6 `destroy()`

- Synchronous. Tears the Theme down completely (§17.3): remove every event listener the Theme/renderer added, disconnect every observer, cancel every timer/animation frame, abort every in-flight fetch, destroy embedded viewers (Aladin), blank embedded media iframes, and empty `container`.
- MUST be **idempotent**: a second (or later) `destroy()` MUST be a safe no-op [Arch §22, §43].
- MUST NOT throw, even if `mount` never completed or failed.
- After `destroy()`, the instance is dead: any further `setData` / `resize` / `setVariant` MUST throw (or be ignored with a logged warning); `mount` MUST NOT be reusable.
- Cooperative once-per-page head insertions (fonts, Aladin script) MAY remain in `document.head` after `destroy()` (removing a shared `<script>` other instances rely on would be incorrect); the renderer MUST ensure they are inert with respect to the destroyed instance.

### 6.7 Ordering guarantees

1. `mount` happens-before every other call.
2. `destroy` happens-after every other call the Runtime issues; the Runtime MUST NOT issue `setData`/`resize`/`setVariant` after calling `destroy`.
3. `setData` calls are applied in issue order.
4. `setVariant` serialises: the Runtime MUST NOT overlap two `setVariant` calls; a `setData` issued during a pending `setVariant` is applied after it resolves.
5. `resize` MAY interleave with anything except that it is never called before `mount` resolves or after `destroy`.

---

## 7. Standard variants

### 7.1 The variant set

`micro`, `mini`, `maxi` are **semantic density / layout** modes, explicitly **not scale factors** [Arch §13, Vision §11, §54.13].

| Variant | 1.0 requirement | Meaning |
|---|---|---|
| `maxi` | **REQUIRED** | Full interface presentation: primary + secondary data, visualization, controls, extended metadata [Vision §11]. |
| `mini` | **REQUIRED** | Compact panel: identity + a few key values + limited secondary info [Vision §11]. |
| `micro` | **OUT of 1.0** — reserved in the enum | Extremely compact: identity + icon/thumbnail + one primary value [Vision §11]. |

### 7.2 `maxi` is an authored variant

`maxi` MUST be defined as an **authored composition**, not "the default panel with the collapse chrome removed" [Inv H2]. In the baseline lineage `maxi` corresponds to the expanded panel; a `maxi` composition MUST render fully expanded with no collapse toggle and no `is-mini` state.

### 7.3 `micro` reserved

`micro` MAY appear in `variants` and the enum reserves it because the shared `NcHudMini` module already implements a `data-collapse="micro"` state [Inv §3, H4]. A 1.0 Runtime **MUST** accept `micro` in a manifest and **MUST** be able to mount it if compositions are provided, but no 1.0 baseline Theme is required to ship it, and validation MUST NOT require `micro` compositions [Plan Q5, issue #4 AC]. Requesting `micro` on a Theme that does not declare it MUST fail with `VariantUnsupported`.

### 7.4 Variant is semantic density — the 1.0 `mini` exception (owner C)

The hard rule is Architecture §13/§14: a variant MUST NOT be a mechanical scale of another. **1.0 exception, owner C [Plan C, owner 2026-09-09]:** for the `svg`-engine baseline Themes HUD-01 and HUD-02, `mini` **MAY** be implemented as a `transform: scale()` (currently `0.352`) of the `maxi` DOM, **provided**:

1. the Theme declares `knownDeviations` code `mini-is-transform-scale` scoped to its `mini:*` compositions (§22);
2. a **distinct `mini` composition exists in both `16:9` and `9:16`** (the two thumbnail shapes) — this part is **not** waived (§8.2, owner C);
3. pixel-exactness of the scaled `mini` is explicitly not required.

The `css`-engine baseline Themes HUD-03 and HUD-04 already have genuine reduced-density `mini` compositions (`.nc-hp-mini-card`) and **MUST NOT** use the transform-scale exception — they adopt their real `mini` composition [Inv §1.26, §4].

This exception is revisited in Contract 1.1+/Platform 0.2; it does not extend to `maxi`, to `micro`, or to any new Theme authored after freeze.

### 7.5 Requesting a variant directly

The Runtime's `new Hud({variant})` MUST mount the requested variant **directly**, with no "load `mini` then expand" flash [Inv §4 item 4]. The Theme composition for a directly-requested `maxi` MUST start expanded.

---

## 8. Aspect ratios

### 8.1 The ratio set & tokens

Ratios are `16:9` and `9:16` (manifest tokens); package directories are `16x9` and `9x16` [Arch §14, Vision §10]. Each ratio is an **explicit, independently authored composition** [Arch §14, §54.14].

### 8.2 1.0 requirements

| Composition | 1.0 requirement | Basis |
|---|---|---|
| `maxi:16:9` | **REQUIRED** | Arch §14 |
| `mini:16:9` | **REQUIRED** | Arch §14 |
| `mini:9:16` | **REQUIRED** — the vertical thumbnail | owner C [Plan C] |
| `maxi:9:16` | **DEFERRED** — MAY be `supported: false` | owner D [Plan D], Arch §31 |

Every 1.0 Theme MUST include `16:9` in `ratios` and MUST provide `maxi:16:9`, `mini:16:9`, `mini:9:16` as `supported: true` compositions.

### 8.3 `maxi:9:16` deferral (owner D)

A 1.0 Theme **MAY** declare `maxi:9:16` as `{ "supported": false, "reason": "portrait-maxi-deferred-1.0" }` and MUST then carry a `knownDeviations` entry code `no-maxi-9x16` (§22). Adding `maxi:9:16` later is a **MINOR** Theme version bump and a non-breaking additive change [Arch §31]. Validation MUST treat a declared-unsupported `maxi:9:16` as a **known exception**, not a failure (§19.3).

### 8.4 No mechanical portrait

The Runtime **MUST NOT** synthesise a portrait presentation by rotating, cropping or mechanically scaling a landscape composition, or vice versa [Arch §14, §54.14, Vision §10]. If a requested `<variant>:<ratio>` is `supported: false` or absent, the Runtime MUST fail with `RatioUnsupported` (§20) and let the consumer decide (§20.3). `preserveAspectRatio="none"` stretch inside a single authored composition is a Theme-internal fitting choice and is not "mechanical scaling" in this sense [Inv §1.10].

### 8.5 None of the baseline Themes has a `9:16` today

The baseline lineage has no distinct portrait composition [Inv §5]. Under owner C/D, 1.0 Themes MUST author `mini:9:16` (small, low-risk) and MAY defer `maxi:9:16`. HUD-10 (portrait editorial SVG panel, canvas 992×1586) is the starting point for the `css`/editorial family's future portrait `maxi` [Inv §5, §0.4].

---

## 9. Semantic slot vocabulary

### 9.1 The core principle

**The consumer owns data; the Theme owns presentation; the Runtime owns the boundary** [Arch §15, Vision §2, §12]. Consumers set values **only** through slots via `setData` (§6.3) / the declarative slot form (§14.5). Consumers **MUST NOT** target Theme-internal DOM — no `nc-ol-*`, `nc-or-*`, `nc-hp-*`, `nc-hud-10-*` class or `<svg>` id is part of the Contract [Arch §2.1, §15, §53.1, Vision §12].

### 9.2 Standard slot vocabulary (1.0)

Ratified from the inventory's per-HUD slot passes [Inv §1.12, §1.19, §1.29, §1.36, H6]:

| Slot | Kind | Typical content | Baseline mapping |
|---|---|---|---|
| `title` | text | Primary identity line | `nc-ol-title` / `nc-or-title` / `nc-hp-title` / `nc-*-title-maxi`; `nc-*-title-micro` at `micro` density |
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
- `controls` and (in object mode) `visualization` are **Theme-owned**: the consumer supplies at most a small input (an object name for `visualization`), never markup. They appear in the vocabulary so a Theme can declare that it renders them; a consumer cannot inject into them.
- `status` in the baseline is almost entirely Theme-owned (query progress, lock label); a Theme MAY accept a consumer `status` string in `html`/editorial mode.

### 9.3 The `content` slot & `htmlSlot` capability

A Theme that accepts arbitrary consumer HTML MUST declare `capabilities.htmlSlot: true` and list `content` in `slots` [Inv H7]. The `content` slot is the one place a consumer supplies raw markup. The Theme:

- MUST sandbox `content` styling so consumer HTML cannot break the Theme frame (scoped typography rules are acceptable; a universal-descendant reset that mangles consumer markup is discouraged) [Inv §1.11 `.nc-ol-widget *`];
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

- Custom slot names MUST match `^[a-z][a-zA-Z0-9]*$` and MUST NOT collide with a standard slot name.
- A custom slot MUST have a `kind` (`text` \| `html` \| `url` \| `ref` \| `config`) and a human `description`.
- Consumers set custom slots through the same `setData` map. A consumer that does not know a Theme's custom slots still gets a working Theme (custom slots are, by definition, optional or defaulted).
- Custom slots are **not** an escape hatch for Theme-internal DOM: they are still semantic inputs the Theme interprets.

### 9.5 Required vs optional slots

- `slots.required` lists slots the Theme needs a value for to render meaningfully. The Runtime SHOULD warn (not fail) if a required slot is unset at first paint; the Theme MUST still render (with placeholder/empty state) [Arch §46 "required slots declared"].
- `slots.optional` lists slots the Theme will use if given.
- A slot not in either list is unknown to the Theme and MUST be ignored (§6.3).

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

- `providers`: identifiers from the fixed provider set (§10.3).
- `hosts`: MUST be a subset of the fixed allowlist (§10.3, §16.2).
- `input`: the slot/custom-slot name the consumer sets to select what to fetch (e.g. `objectName`). The consumer supplies **only this**; the Theme owns the query, the response parsing and the rendering.
- `timing`: per-provider `page-load` \| `lazy`.

### 10.3 Fixed allowlist for `dataSource` (1.0)

| Provider id | Host(s) | Kind | Notes |
|---|---|---|---|
| `simbad` | `simbad.cds.unistra.fr` | `fetch` (TAP/ADQL) | object identity + basic data |
| `vizier` | `vizier.cds.unistra.fr` | `fetch` (VOTable) | catalog cross-references |
| `ads` | `ui.adsabs.harvard.edu` | `fetch` + link target | publications |
| `aladin` (sky viewer, see §10.4) | `aladin.cds.unistra.fr` | `script` + `style` | Aladin Lite v3 runtime |
| `googleFonts` | `fonts.googleapis.com`, `fonts.gstatic.com` | `style` + `font` | typeface only |

No other host is permitted for `dataSource` in 1.0. Adding a provider is a Contract MINOR change (§24).

### 10.4 `skyViewer` (Aladin) coexistence

`capabilities.skyViewer: true` declares the Aladin Lite embed. It:

- loads the Aladin script/style **lazily and cooperatively once per page** (the baseline lineage already shares one loader across HUD-01/HUD-02 instances via a page global) [Inv blogger `blogger-hud01-template.js`];
- is driven by the same `input` slot as `dataSource`;
- is Theme-owned decoration under the `visualization` slot (§9.2) — the consumer never touches the Aladin DOM;
- under `isolation: scoped-root` only (Aladin injects into `document.head` and uses `window` globals — Shadow DOM is not attempted for these Themes in 1.0, §15.2) [Inv H11, §1.11].

### 10.5 `mediaEmbed` (third-party media iframes)

`capabilities.mediaEmbed` declares embedded media (HeyGen / YouTube / Vimeo) in the `media` slot [Inv §1.30, §1.36]:

```jsonc
"mediaEmbed": { "hosts": ["app.heygen.com", "www.youtube.com", "player.vimeo.com"], "lifecycle": "src-swap" }
```

- `hosts` MUST be a subset of the media allowlist (§16.2).
- `lifecycle: "src-swap"` documents that the Theme parks a hidden iframe at `about:blank` and restores `src` on expand [Inv §1.32–1.34]. The Runtime's `resize`/`setVariant` MUST NOT fight this mutation.
- The renderer's `destroy()` MUST blank every media iframe `src` before removing it (§17.3).

### 10.6 How `dataSource` coexists with slots

- A `dataSource` Theme's **object-mode** content (`primary`, `secondary`, `status`) is **fetched, not injected**; the consumer sets only `input`.
- The same Theme's **non-astronomy** content — `title` (when consumer-overridden), `content` (html mode), `media`, `footer` — is set through slots normally.
- A `dataSource` Theme MUST still render (empty/placeholder state) if the consumer sets no `input` and if the providers are unreachable [Inv §1.8 NGC 1300 fallback].
- This is the resolution of the Vision §12 tension [Inv H8]: domain logic is confined to a **declared, allowlisted, name-in / rendering-out** capability; it is not free rein.

---

## 11. Modes: object-viewer vs HTML-frame (owner E) & shared foundation

### 11.1 One Theme, one `modes` flag (owner E)

HUD-01/HUD-02 have two personalities — **object viewer** (reticle / Aladin / SIMBAD) and **HTML frame** (blog-post body) [Inv §1.8]. Owner E [Plan E, owner 2026-09-09]: this is **one Theme** with a capability/config flag, **not** two Themes.

```jsonc
"capabilities": {
  "modes": { "values": ["object", "html"], "default": "object", "config": "mode" }
}
```

- `config` names the construction option (`new Hud({ config: { mode: "html" } })`, §14.2) and/or the declarative attribute.
- In `object` mode the Theme uses `dataSource` + `skyViewer`; in `html` mode it disables all network init and shows the `content` slot [Inv §1.8 point 2].
- A Theme without `modes` has exactly one composition personality.
- `modes` selects a **personality within a composition**, orthogonal to `variant` and `ratio`. Switching `mode` after mount is **out of scope for 1.0** (construct a new `Hud`); this is a `knownDeviations` candidate if a consumer needs it.

### 11.2 Platform-provided shared foundation ("base") — owner-relevant, [Inv H14]

The four baseline Themes are near-identical at the foundation layer and all load the same shared files in the same order [Inv §3]. **Decision:** the platform provides a **single versioned base**, injected **once per page** by the Runtime; Themes do **not** each vendor a divergent copy [Inv H14 recommendation, Plan §3].

- The base contains: the scoped reset, `--hud-*` / `--nc-*` design tokens, the shared `@keyframes` set (`hudBreath`, `hudPanelSweep`, `hudRotate`, `hudPulseOuter`, `hudPulseInner`, `hudBlinkSoft`, `hudLockBoxPulse`, `hudProgressScan`, `hudTickerScroll`, …), `.nc-panel-sweep`, and the shared JS singletons (`HUDCore`, `NcHudMini`, `HudPapers`).
- The base is **versioned** (`baseVersion`, §3.8) and immutable per version, like a Theme.
- A Theme declares `baseVersion`; the Runtime resolves a compatible base and injects it before the Theme's own `entrypoints`.
- The base is responsible for making its own global identifiers safe: its `@keyframes` and any `*`-scoped rules MUST be namespaced/scoped by the base build so two Theme bundles cannot collide (§15.6) [Inv H12].
- A Theme MAY still be "self-contained" for portability (Arch §8.3) by bundling its own base at build time, but MUST still declare `baseVersion` for the compatibility check.

### 11.3 Asset addressing

- **Self-contained text Themes are preferred** [Plan d5, Arch §8.3]. SVG / CSS / JS / HTML Themes SHOULD carry all their text assets in-package.
- **Heavy media** (raster, video, textures) that a Theme needs MUST be referenced by a **stable, versioned, absolute CDN URL** declared in the manifest (`assets` entries or `externalResources` with a platform-media host), never hot-linked from an arbitrary origin [Plan d5, Arch §8.3, §34].
- Consumer-supplied media (a portrait URL in the `media` slot) is passed at runtime and is not a package asset.
- In-package asset paths MUST be package-relative (§2.2 rule 5); the Runtime resolves them against `context.assetBaseUrl`.

---

## 12. Registry resolution flow

The Runtime resolves a Theme deterministically [Arch §29, §23]:

```
1. Theme id                (consumer input)
2. requested version       (consumer input; explicit SHOULD; "latest" MAY in dev)
3. Registry resolution     id + version -> manifest URL   (via /registry/index.json)
4. manifest fetch          GET themes/<id>/<version>/manifest.json
5. manifest validation     against manifest.schema.json + this Contract's §3 rules
6. Contract-compat check   manifest.contractVersion major implemented by Runtime?
7. renderer selection      manifest.engine -> svg | css  (else RendererUnsupported)
8. base resolution         manifest.baseVersion -> compatible base, inject once/page
9. variant + ratio         requested (variant, ratio) -> compositions["<v>:<r>"]
                           must exist and be supported (else Variant/RatioUnsupported)
10. entrypoint set         compositions -> entrypoints["<v>:<r>"] (styles, markup, scripts)
11. resource loading       base -> styles -> markup -> scripts (order significant)
12. mount                  renderer.mount(container, context)
```

Each step maps to a failure mode in §20. Steps 1–6 are Registry/manifest concerns; 7–12 are Runtime/renderer concerns. Production consumers SHOULD pin the version at step 2 [Arch §29].

---

## 13. (reserved)

*Section intentionally reserved to keep §14 = Consumer API aligned with the numbering readers of Architecture §25 expect. No content.*

---

## 14. Consumer API

### 14.1 Surface (1.0)

The consumer-facing API is **imperative and small** [Arch §25, Plan d10, Vision §14]:

```js
import { Hud } from "@incus/hud-runtime";

const hud = new Hud({
  theme:   "hud-01",     // REQUIRED — Theme id
  version: "1.0.0",      // SHOULD in production; "latest" MAY in dev
  variant: "maxi",       // REQUIRED — "mini" | "maxi" | ("micro")
  ratio:   "16:9",       // REQUIRED — "16:9" | "9:16"
  config:  { mode: "object", objectName: "NGC 1300" }  // OPTIONAL — Theme capability config
});

await hud.mount(containerEl);
hud.setData({ title: "BETELGEUSE", primary: "642 ly", status: "OBSERVING" });
hud.resize();                 // or hud.resize({ width, height })
await hud.setVariant("mini");
hud.destroy();
```

### 14.2 Constructor

- `new Hud(options)` validates options synchronously; an invalid `theme`/`variant`/`ratio` shape throws a `TypeError` (programmer error, not a Theme error).
- `config` carries Theme-capability configuration (`mode`, `objectName`, `vizierLimit`, …). Keys a Theme does not understand are ignored.
- Construction does **no** network I/O; resolution starts at `mount`.

### 14.3 Methods

| Method | Returns | Contract |
|---|---|---|
| `mount(el)` | `Promise<void>` | Runs §12 flow, then renderer `mount`. Once per instance. Rejects with a typed error (§20). |
| `setData(obj)` | `void` | Slot values (§9). Queued if called before `mount` resolves; replayed in order. |
| `resize(viewport?)` | `void` | Re-fit. `viewport` optional; Runtime measures the container if omitted. |
| `setVariant(v)` | `Promise<void>` | Same ratio, different variant (§6.5). Rejects `VariantUnsupported`. |
| `destroy()` | `void` | Full teardown (§6.6, §17.3). Idempotent. |

### 14.4 Ratio changes

Changing `ratio` after construction is **not** in the 1.0 API. To change ratio, `destroy()` the instance and construct a new one [Plan d10]. A `setRatio` is a candidate additive 0.2 extension.

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
| `scoped-root` | Scoped-root only. **Required for `svg`-engine baseline Themes (HUD-01/02, HUD-10).** |
| `shadow-dom-preferred` | Renderer attempts Shadow DOM, falls back to `scoped-root` if validation (§15.3) fails. Allowed for `css`-engine Themes. |
| `shadow-dom` | Shadow DOM required (renderer MUST fail rather than fall back). Not used by any 1.0 baseline Theme. |
| `iframe` | Reserved for exceptional cases [Arch §41]; not used in 1.0. |

### 15.2 Shadow DOM is NOT used for HUD-01/HUD-02

Aladin Lite injects `<script>`/`<link>` into `document.head` and assumes a light-DOM document with `window` globals; Google Fonts `<link>` in a shadow root does not inherit [Inv §1.11, H3, H11]. Therefore `svg`-engine Themes with `skyViewer`/`dataSource` MUST declare `isolation: scoped-root` and the Runtime MUST NOT wrap them in Shadow DOM in 1.0 [Plan d8].

### 15.3 Shadow DOM attempt for the CSS family

For HUD-03/HUD-04 (`css` engine), the renderer MAY attempt Shadow DOM (`shadow-dom-preferred`) and MUST **keep it only if**, in validation, the legacy `clip-path` frame, `filter: drop-shadow()` glow and `float` layout all survive the shadow boundary visually [Plan d8, Inv H11]. Otherwise it MUST fall back to `scoped-root`. The chosen mechanism per version MUST be recorded (validation report / `knownDeviations` if it is a fallback).

### 15.4 Forbidden host-wide selectors

A Theme's shipped CSS MUST NOT contain selectors that escape the Theme boundary [Arch §42, §54 risk 53.2]:

```css
body { ... }      html { ... }      :root { ... }      * { ... }
```

when those rules would apply outside the Theme root. Legacy host-wide rules from the panel lineage (`reset.css` `*`/`html`/`body`, `base.css` `body{}`) MUST be **stripped or rewritten to be root-scoped at packaging** [Inv §1.11, H12, §6.6]. The blogger lineage's `blogger-hud-shared.css` is already free of host-wide `*`/`html`/`body` and is the cleaner starting point [inspection].

### 15.5 `overflow: visible` decoration

A Theme MAY paint decoration outside its bounding box (HUD-01's 4-layer SVG glow runner; HUD-03/04's `drop-shadow` frame) when it declares `overflowVisible: true` [Inv H13, §6.7]. The renderer MUST NOT apply `overflow:hidden` / `clip` / `clip-path` to the mount container or an ancestor it owns for such a Theme. A consumer that needs the HUD strictly clipped can wrap the container itself; that is the consumer's choice, not the Runtime's default.

### 15.6 Shared `@keyframes` and tokens

Shared `@keyframes` names and `--hud-*` / `--nc-*` custom properties are **global identifiers** that collide across Theme bundles [Inv §3, H12]. The platform base (§11.2) is responsible for:

- defining each shared `@keyframes` exactly once per page;
- re-rooting `:root { --hud-* }` tokens onto the Theme container (or a documented single `:where(:root)` layer) so they do not repaint the host;
- namespacing or de-duplicating keyframes if two base versions coexist.

A Theme lists the shared animations it consumes in `manifest.animations` (§3.12) so validation can confirm provenance.

### 15.7 z-index

Themes SHOULD use `--hud-z-*` tokens rather than raw integers; the baseline's raw integers up to ~50 [Inv §1.5] are tolerated in 1.0 but the renderer MUST establish a **stacking context** on the mount container (e.g. `isolation: isolate`) so Theme z-index cannot collide with host stacking [Arch §41].

---

## 16. JavaScript & external-resource policy

### 16.1 Executable Themes come only from the Registry

Theme scripts MUST be loaded **only from the controlled Registry/CDN** [Arch §43, §54.17, Vision §18]. Arbitrary third-party JavaScript Theme URLs are unsupported. The Runtime MUST NOT execute a `scripts` entry that resolves to any origin other than the Registry.

### 16.2 External-resource allowlist (1.0)

Registry-loaded Themes **MAY lazy-load or page-load from this fixed host set without per-Theme manifest allowlisting** [issue #4 AC, owner 2026-09-09, Plan Q4]:

| Purpose | Hosts | Kinds | Typical timing |
|---|---|---|---|
| Typeface | `fonts.googleapis.com`, `fonts.gstatic.com` | `style`, `font` | page-load |
| Sky viewer | `aladin.cds.unistra.fr` | `script`, `style` | lazy |
| Astronomy data | `simbad.cds.unistra.fr`, `vizier.cds.unistra.fr`, `ui.adsabs.harvard.edu` | `fetch`, link target | SIMBAD page-load; VizieR/ADS lazy |
| Media embeds | `app.heygen.com`, `www.youtube.com`, `player.vimeo.com` | `iframe` | page-load |

- The manifest `externalResources[]` field remains available and OPTIONAL; declaring it enables stricter validation and better documentation, and is RECOMMENDED.
- Any host **outside** this set MUST be declared in `externalResources[]` **and** justified by a `knownDeviations` entry; a Runtime with strict policy enabled MAY block it.
- The list is part of the Contract; adding a host is a Contract MINOR change (§24).

### 16.3 Network during mount is permitted (owner F)

A strict "no network on mount" rule would break the baseline: Google Fonts and SIMBAD both fire at page load [Inv §1.4]. 1.0 **permits** page-load external I/O for allowlisted hosts. A Theme that does so MUST carry `knownDeviations` code `external-io-on-mount` and MUST render a coherent pre-response state (§10.6) [Inv §1.4 note].

### 16.4 Lifecycle-bound scripts

Theme scripts MUST operate within the renderer lifecycle (§6) [Arch §43]:

- initialisation runs during `mount`;
- the Theme MUST expose the hooks the renderer needs to drive `setData` / `resize` / `setVariant` / teardown (§17.1);
- scripts MUST NOT assume ownership of global application state [Arch §43, §54.17];
- scripts MUST NOT block the main thread on synchronous network I/O.

### 16.5 Single-instance is the 1.0 floor; multi-instance where declared

**Floor:** a 1.0 Theme is only *required* to support **one instance per page**; this is a documented 1.0 limitation with a defined upgrade path [Inv H15, `audit §8.1`]. The panel lineage (global ids, `NcHud01`, first-match `querySelector`) is single-instance.

**Where a Theme can do better:** the blogger lineage `NcHud01.init(widget, cfg)` is a **factory** with per-widget scoped state, unique Aladin viewer ids, and a cooperative once-per-page Aladin loader [inspection of `blogger-hud01-template.js`]. Such a Theme MAY declare `capabilities.multiInstance: true`.

**Rules:**

- Absent `multiInstance` ⇒ the Runtime MUST assume single-instance and SHOULD warn (not fail) if a second instance of the same Theme id is mounted on one page.
- `multiInstance: true` ⇒ the Theme MUST scope every DOM query, id, and piece of state to its mount container, and MUST cooperatively share (never duplicate) page-load external `<script>`/`<link>` insertions.
- **Path to multi-instance for single-instance Themes (0.2):** an instance-factory pattern (as the blogger lineage already demonstrates) — no Contract break, a Theme MINOR bump flips `multiInstance` to `true`.

### 16.6 `<script>`-stripping context

The baseline Themes are standalone pages / iframe embeds because Blogger strips `<script>` from HTML gadgets [Inv §1.11]. This is **not** a Runtime concern (the Runtime is the trusted loader) but explains why the Theme sources are whole HTML documents that packaging must reduce to `markup` fragments + `scripts`.

---

## 17. Teardown contract

### 17.1 Theme teardown hooks

The inventory found **no teardown exists anywhere** in the baseline [Inv §6.5, H10, §1.6, §1.33]. 1.0 REQUIRES it. A Theme's entry script MUST expose, on a documented handle the renderer can reach (e.g. a return value from an init function, or a known property on the Theme root):

```
init(root, context) -> {
  setData(data)      // optional; renderer may also drive slots directly via DOM the Theme documents
  resize(viewport)   // optional
  setVariant(v)      // optional
  destroy()          // REQUIRED
}
```

- `destroy()` on this handle MUST remove every listener the Theme added, disconnect every `MutationObserver` / `ResizeObserver`, cancel timers and `requestAnimationFrame` loops, `abort()` every `AbortController`, destroy Aladin instances, and blank media iframes [Inv §6.5, §1.32–1.34].
- If a Theme cannot yet expose these hooks, the **renderer** MUST wrap the unchanged Theme code and perform teardown around it (tracking listeners via delegation, observing the container, blanking known iframe selectors the manifest documents). This wrapper obligation is on the renderer implementers (#9/#10), specified here.

### 17.2 Renderer teardown obligations

`renderer.destroy()` (§6.6) MUST, in order:

1. call the Theme handle's `destroy()` if present;
2. remove any renderer-added listeners/observers;
3. cancel any renderer-scheduled work;
4. for `mediaEmbed` Themes, set every embedded iframe `src=""`/`about:blank` then remove it;
5. empty the mount container;
6. mark the instance dead.

### 17.3 Idempotency & failure tolerance

`destroy()` MUST be idempotent and MUST NOT throw even if `mount` failed or never ran (§6.6) [Arch §22, §43].

### 17.4 Validation

Publication validation MUST include a **mount → destroy → assert-clean** check: no leaked listeners on `document`/`window`, no live observers, no pending timers, container empty [Arch §46 "Runtime destroy succeeds", §19].

---

## 18. (compatibility model — see §20.4 & §24)

Compatibility is covered under the error model (§20.4) and evolution rules (§24). Summary [Arch §31]:

- **Theme version** ↔ **`contractVersion`** ↔ **Runtime version** ↔ **Registry-schema version** are four independent axes.
- Runtime↔Theme compatibility is **capability-based**, not release-number-based: the Runtime inspects `engine`, `contractVersion` major, `capabilities`, `variants`, `ratios` and decides if it can mount — it does not compare its own version to the Theme's.
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
id matches ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ and equals the package <id> segment
version is strict SemVer and equals the package <version> segment
contractVersion major is a version this validator/Runtime implements
engine is in the enum; if svg|css it is buildable; if video|static|gadget -> WARN (no 1.0 Runtime)
baseVersion resolves to an available base

variants includes "mini" and "maxi"
ratios includes "16:9"
compositions has an entry for every variant x ratio
compositions["maxi:16:9"].supported == true
compositions["mini:16:9"].supported == true
compositions["mini:9:16"].supported == true
every supported composition's dir exists
every entrypoints[...] styles/markup/scripts path resolves inside the package
markup present for every supported composition
slots.required and slots.optional are known slots or declared customSlots
isolation is in the enum; svg+skyViewer/dataSource => isolation == "scoped-root"
externalResources hosts are on the §16.2 allowlist OR have a knownDeviations entry
animations referenced by CSS are provided by baseVersion or the Theme's own styles

Runtime mount succeeds for every supported composition
Runtime destroy succeeds and leaves no leaked listeners/observers/timers (§17.4)
CSS isolation check: no host-wide body/html/:root/* selectors escape the root (§15.4)
script-policy check: scripts resolve only to the Registry origin (§16.1)
```

### 19.2 Recommended additional checks (SHOULD)

Console-error detection; viewport-overflow check (respecting `overflowVisible`); broken-link detection for `assets`/`externalResources`; preview generation; animation-cleanup check; performance budget (0.2) [Arch §46, Vision §19].

### 19.3 Known exceptions pass deliberately

Every `knownDeviations` entry (§22) whose `code` is in the recognised set MUST cause the corresponding check to **pass as a logged known exception**, not fail [Inv §8 H3/H5, §3 field `knownDeviations`]. Recognised 1.0 codes: `mini-is-transform-scale`, `no-maxi-9x16`, `single-instance`, `external-io-on-mount`, `overflow-visible`, `shadow-dom-fallback`, `shared-base-host-selectors-stripped`. An unrecognised code MUST fail validation (so deviations cannot be invented to dodge checks).

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
| `VariantUnsupported` | requested `variant` not in `variants`, or `<variant>:<ratio>` composition `supported: false` |
| `RatioUnsupported` | requested `ratio` not in `ratios`, or `<variant>:<ratio>` composition `supported: false` / absent |
| `EntrypointMissing` | a `styles`/`markup`/`scripts` path does not resolve in the package |
| `AssetLoadFailed` | a required in-package asset or required base fails to load |
| `ThemeMountFailed` | renderer `mount` throws / rejects |
| `ThemeRuntimeError` | a Theme script throws after a successful mount |

*Note:* when `<variant>:<ratio>` is unsupported, prefer `RatioUnsupported` if the variant is otherwise valid at another ratio, else `VariantUnsupported`; both are acceptable and consumers should handle both.

### 20.2 Structure

Each error MUST carry: `code` (one of the above), `message` (human), `theme`, `version`, and where relevant `variant`/`ratio`/`resource`. Errors from `mount` reject its Promise; errors after mount are delivered to a Runtime error sink/callback the consumer can subscribe to (so a `ThemeRuntimeError` does not become an unhandled rejection).

### 20.3 Local failure

**A failed HUD MUST fail locally and MUST NOT break the host** [Arch §45, §54.18, Vision §18, §23]. The Runtime MUST catch all Theme errors (mount, script, animation loop) at the Theme boundary. The consumer decides what to do — hide the HUD, show fallback content, switch Theme, report diagnostics [Arch §45]. The Runtime MUST NOT: rethrow into host code paths, leave partial DOM in the container on mount failure (§6.2), or leak a broken animation loop (it MUST tear the instance down on an unrecoverable `ThemeRuntimeError`).

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
- Adding a slot, composition, ratio, variant or capability to a Theme is a **MINOR** bump and MUST NOT break existing consumers (§4.2).
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
  {
    "code": "mini-is-transform-scale",   // from the recognised set (§19.3)
    "scope": "mini:16:9,mini:9:16",       // "all" | composition list | capability name
    "clause": "7.4",                       // the Contract clause being deviated from
    "note": "mini is transform:scale(0.352) of the maxi DOM; owner C accepted 2026-09-09",
    "plannedResolution": "Contract 1.1 / Platform 0.2"   // OPTIONAL
  }
]
```

### 22.3 Recognised 1.0 codes

| Code | Deviation | Clause | Basis |
|---|---|---|---|
| `mini-is-transform-scale` | `mini` is a mechanical scale of `maxi` (svg family only) | §7.4 | owner C |
| `no-maxi-9x16` | portrait `maxi` composition not provided | §8.3 | owner D |
| `single-instance` | Theme supports only one instance per page | §16.5 | Inv H15 |
| `external-io-on-mount` | page-load network I/O to an allowlisted host during mount | §16.3 | owner F / Inv §1.4 |
| `overflow-visible` | Theme paints outside its box; renderer must not clip | §15.5 | Inv H13 |
| `shadow-dom-fallback` | CSS Theme fell back from Shadow DOM to scoped-root | §15.3 | Plan d8 |
| `shared-base-host-selectors-stripped` | legacy host-wide reset rules rewritten at packaging | §15.4 | Inv H12 |

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
- tightening a rule such that previously-valid Themes become invalid (e.g. removing the §7.4 `mini` scale exception).

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
| `variants` | `["mini","maxi"]`; `micro` reserved (blogger lineage has `data-collapse="micro"` but out of 1.0) |
| `ratios` | `["16:9","9:16"]` |
| `compositions` | `maxi:16:9` ✓, `mini:16:9` ✓, `mini:9:16` ✓ (to author), `maxi:9:16` = `supported:false` |
| `slots` | required `title`; optional `subtitle`, `media`, `visualization`, `primary`, `secondary`, `status`, `controls`, `content`, `footer` [Inv §1.12] |
| `customSlots` | `objectName` (drives `dataSource` + `skyViewer`) |
| `capabilities` | `animation`, `interactive`, `htmlSlot`, `skyViewer`, `dataSource{simbad,vizier,ads}`, `modes{object,html}`, `multiInstance:true` (blogger factory) |
| `isolation` | `scoped-root` (Aladin head injection — §15.2) |
| `overflowVisible` | `true` (glow runner) |
| `knownDeviations` | `mini-is-transform-scale`, `no-maxi-9x16`, `external-io-on-mount`, `overflow-visible` |
| Teardown | renderer wraps unchanged Theme, destroys Aladin, aborts SIMBAD/VizieR fetches, removes `keydown`/toolbar/panel listeners [Inv §1.6, §17] |

### 25.2 HUD-02 — "Object Report"

| Aspect | Contract expression |
|---|---|
| `id` / `name` | `hud-02` / `Object Report` |
| `engine` | `svg` — two inline `<svg>`s (frame at z-1 + runner overlay at z-40) [Inv §1.14] |
| `variants` / `ratios` | as HUD-01 |
| `compositions` | as HUD-01 (`maxi:9:16` deferred) |
| `slots` | as HUD-01 (`nc-or-*` internals) [Inv §1.19] |
| `capabilities` | as HUD-01, plus uses shared `NcHudMini` for the toggle; `dataSource`, `skyViewer`, `modes{object,html}`, `multiInstance:true` |
| `isolation` | `scoped-root` |
| `overflowVisible` | `true` (separate runner-overlay SVG) |
| `knownDeviations` | `mini-is-transform-scale` (scale `0.352`), `no-maxi-9x16`, `external-io-on-mount`, `overflow-visible` |

### 25.3 HUD-03 — "HUD Post / Character Post"

| Aspect | Contract expression |
|---|---|
| `id` / `name` | `hud-03` / `HUD Post` |
| `engine` | `css` (§5.4) — `clip-path: polygon()` frame on `<div>`s + `filter: drop-shadow()`; near-zero JS [Inv §1.21] |
| `variants` | `["mini","maxi"]` — **genuine** `mini` composition (`.nc-hp-mini-card`), no scale exception (§7.4) [Inv §1.26] |
| `ratios` | `["16:9","9:16"]` |
| `compositions` | `maxi:16:9` ✓, `mini:16:9` ✓ (the mini-card), `mini:9:16` ✓ (to author from the mini-card), `maxi:9:16` = `supported:false` (HUD-10 is the future portrait editorial start point) |
| `slots` | required `title`; optional `subtitle` (`nc-hp-system`), `media` (`nc-hp-float-image`), `content` (`nc-hp-text`), `footer` (`nc-hp-frame-ticker`), `status` [Inv §1.29] |
| `capabilities` | `animation`, `htmlSlot`, `interactive` (toggle only); no `dataSource`; `multiInstance` per blogger factory pattern (`data-hud-init` guard) |
| `isolation` | `shadow-dom-preferred` → kept only if `clip-path`+`drop-shadow`+`float` survive, else `scoped-root` (§15.3); records `shadow-dom-fallback` if it falls back |
| `overflowVisible` | `true` (`drop-shadow` outside the box) |
| `knownDeviations` | `no-maxi-9x16`, `overflow-visible`, possibly `shadow-dom-fallback`, `shared-base-host-selectors-stripped` |

### 25.4 HUD-10 — portrait editorial SVG panel

| Aspect | Contract expression |
|---|---|
| `id` / `name` | `hud-10` / (portrait panel) |
| `engine` | `svg` — portrait SVG panel, canvas 992×1586, `aspect-ratio` CSS + auto-scaling `viewBox` [Inv §0.4, `blogger-hud10-template.css`] |
| `variants` | `["mini","maxi"]` |
| `ratios` | `["9:16","16:9"]` — HUD-10 is the lineage's **only** existing portrait composition; it is the reference for `maxi:9:16` once that deferral is lifted (owner D / Arch §31) |
| `compositions` | `maxi:9:16` ✓ (this is the one Theme that has it), `mini:9:16` ✓, `mini:16:9` ✓ (to author), `maxi:16:9` MAY be `supported:false` and carry `no-maxi-16x9`-style deviation if a landscape maxi is not authored |
| `slots` | `title`, `subtitle`, `media`, `content`, `footer` (editorial, same family as HUD-03) |
| `capabilities` | `animation`; `htmlSlot`; uses `NcHudMini` (`NcHud10.init`, `panelW` default 901) |
| `isolation` | `scoped-root` (SVG family) |
| `overflowVisible` | `true` (`hudBreath` box-shadow) |
| `knownDeviations` | portrait-first: a landscape `maxi:16:9` deferral entry if not authored; `overflow-visible` |
| Value to the Contract | proves `9:16` **is** authorable in the lineage — the owner-D deferral is a scheduling choice, not a capability gap |

*Note:* HUD-04 (media-embed variant of HUD-03) maps identically to HUD-03 plus `capabilities.mediaEmbed{app.heygen.com,…, lifecycle:"src-swap"}`, a `MutationObserver` the renderer must `disconnect()` on `destroy`, and `knownDeviations` unchanged. It is omitted from the four-row table only because it is structurally HUD-03; the Contract covers it via §10.5 and §17.2.4.

### 25.5 Conclusion

All four (five with HUD-04) baseline Themes express fully in manifest + Contract terms with only the **owner-sanctioned** deviations. Nothing in the baseline requires a Contract mechanism that does not exist here; every baseline mechanism is either supported or explicitly scoped out with a `knownDeviations` code [issue #4 AC "every HUD-01..04 mechanism is either supported or explicitly scoped out"].

---

## 26. Open for owner

Items the Contract could not fully resolve without an owner call. None blocks freeze if the owner accepts the stated default.

| # | Question | Contract's working assumption |
|---|---|---|
| O1 | `micro` fully out of 1.0? The enum reserves it and `NcHudMini` implements it; the Contract requires the Runtime to *accept* it but requires no Theme to ship it. Confirm no 1.0 Theme ships `micro`. | Reserved, not shipped (§7.3) [Plan Q5]. |
| O2 | `multiInstance` — the blogger lineage HUD-01/02 factory **exceeds** the inventory's "single-instance is a 1.0 limitation" (H15) recommendation, which was written against the *panel* lineage. Is multi-instance an expected 1.0 deliverable for HUD-01/02/03/04, or is `single-instance` the accepted floor with `multiInstance` opportunistic? | Floor = single-instance; `multiInstance: true` allowed and expected where the factory already exists (HUD-01/02/03/04 blogger lineage) (§16.5). |
| O3 | `maxi:9:16` deferral (owner D) vs HUD-10 which **already is** a portrait maxi. Does HUD-10 ship its `maxi:9:16` in 1.0 (making it the exception to the deferral), or is HUD-10 also deferred? | HUD-10 ships `maxi:9:16` (it exists); other Themes defer it (§8.3, §25.4). |
| O4 | Shared base ownership (§11.2, Inv H14): Contract states **platform-provided versioned base**. Confirm this over per-Theme vendoring, since it also binds #3 (`baseVersion`) and #5 (library structure). | Platform-provided, versioned, `baseVersion` in the manifest (§11.2) [Inv H14 recommendation]. |
| O5 | `mode` switching after mount (§11.1) is out of 1.0 (construct a new `Hud`). Confirm no consumer needs live object↔html switching in 1.0. | Out of 1.0; new instance required (§11.1). |
| O6 | Media-embed host list (§16.2): baseline confirms `app.heygen.com`; `youtube.com`/`vimeo.com` are inferred from the HUD-03 post template's example variants. Confirm the media allowlist. | HeyGen + YouTube + Vimeo (§16.2); trim if the owner disagrees. |

---

## 27. Handoff to #3 (manifest JSON Schema)

The exact field list, types and constraints the schema MUST encode. This is §3 distilled for the schema author; §3 remains the prose authority.

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
| `baseVersion` | string | ✅ | SemVer or `^`/`~` range |
| `variants` | array<string enum> | ✅ | items ∈ `micro`\|`mini`\|`maxi`; MUST contain `mini` and `maxi`; unique |
| `ratios` | array<string enum> | ✅ | items ∈ `16:9`\|`9:16`; MUST contain `16:9`; unique |
| `aspectRatios` | array<string enum> | — | deprecated alias; if present MUST equal `ratios` |
| `compositions` | object | ✅ | keys `^(micro\|mini\|maxi):(16:9\|9:16)$`; one key per `variants`×`ratios`; value = composition object (§27.2); `maxi:16:9`,`mini:16:9`,`mini:9:16` MUST have `supported:true` |
| `slots` | object | ✅ | `{ required: string[], optional: string[] }`; items are known slot names or names present in `customSlots`; arrays unique; no overlap |
| `customSlots` | array<object> | — | §27.3 |
| `capabilities` | object | ✅ | §27.4 |
| `entrypoints` | object | ✅ | keys match supported `compositions` keys; value = entrypoint object (§27.5) |
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
{ "name": string  ^[a-z][a-zA-Z0-9]*$  (not a standard slot name),   // required
  "kind": "text"|"html"|"url"|"ref"|"config",                        // required
  "required": boolean,                                                // default false
  "description": string (len 1–200) }                                 // required
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
| `skyViewer` | boolean | — |
| `dataSource` | object | `{ providers: (simbad\|vizier\|ads\|aladin\|googleFonts)[], hosts: string[] (⊆ §16.2/§10.3 allowlist), input: string, timing?: object }` |
| `mediaEmbed` | object | `{ hosts: string[] (⊆ media allowlist), lifecycle: "src-swap"\|"static" }` |
| `modes` | object | `{ values: string[] (≥1), default: string (∈ values), config: string }` |

### 27.5 Entrypoint object

```
{ "styles":  string[]  (package-relative, ordered, may be empty),   // required (may be [])
  "markup":  string     (package-relative, exactly one),            // required
  "scripts": string[]   (package-relative, ordered, may be empty) } // required (may be [])
```

All paths: `^[^/].*` , no `../`, no scheme, must be inside the package.

### 27.6 External-resource object

```
{ "host": string (bare hostname, ^[a-z0-9.-]+$),   // required
  "kind": "script"|"style"|"font"|"fetch"|"iframe", // required
  "timing": "page-load"|"lazy",                     // required
  "required": boolean,                              // default false
  "note": string }                                  // optional
```

Validation (not pure schema): `host` ∈ §16.2 allowlist OR a matching `knownDeviations` entry exists.

### 27.7 Known-deviation object

```
{ "code": enum(mini-is-transform-scale | no-maxi-9x16 | single-instance |
               external-io-on-mount | overflow-visible | shadow-dom-fallback |
               shared-base-host-selectors-stripped),   // required, closed set
  "scope": string ("all" | comma-list of composition keys | capability name),  // required
  "clause": string (Contract clause, e.g. "7.4"),      // optional
  "note": string,                                       // required
  "plannedResolution": string }                         // optional
```

### 27.8 Cross-field rules the schema (or the validator layered on it) MUST enforce

1. `compositions` has exactly one key per `variants` × `ratios`.
2. `compositions["maxi:16:9"|"mini:16:9"|"mini:9:16"].supported === true`.
3. `entrypoints` keys === the set of `compositions` keys with `supported: true`.
4. `slots.required` ∩ `slots.optional` === ∅; every entry is a known slot or a `customSlots[].name`.
5. `engine ∈ {video,static,gadget}` ⇒ schema valid, but emit a WARNING annotation (no 1.0 Runtime).
6. `engine === "svg"` && (`capabilities.skyViewer` || `capabilities.dataSource`) ⇒ `isolation === "scoped-root"`.
7. every `externalResources[].host` and every `capabilities.dataSource.hosts[]` / `capabilities.mediaEmbed.hosts[]` is on the §16.2 allowlist unless covered by a `knownDeviations` entry.
8. `knownDeviations[].code` ∈ the closed set (§22.3); unknown ⇒ invalid.
9. `aspectRatios`, if present, deep-equals `ratios`.
10. `contractVersion` major must be `1` for a Theme intended for the 1.0 Runtime.

---

## 28. Traceability index

| Contract § | Vision / Architecture / Plan / Owner basis |
|---|---|
| 1 Purpose & status | Vision §25; Arch §12, §55 |
| 2 Package structure | Arch §7, §10; Vision §7; Plan d4 |
| 3 Manifest fields | Arch §11, §54.11; Vision §8; Inv §8 (#3 table) |
| 4 ID & versioning | Arch §17, §30, §54.10; Vision §17 |
| 5 Renderer identifiers | Arch §16, §50, §54.15–16; Plan d9 |
| 6 Lifecycle | Arch §22 |
| 7 Variants | Arch §13, §54.13; Vision §11; Plan Q5; owner C |
| 8 Aspect ratios | Arch §14, §54.14; Vision §10; owner C/D |
| 9 Slots | Arch §15, §53.1; Vision §12; Inv §1.12/§1.19/§1.29/§1.36, H6 |
| 10 `dataSource` | owner F; Inv §1.4, §1.8, H8/H9 |
| 11 Modes & base | owner E; Inv H14; Plan §3 |
| 12 Resolution flow | Arch §29, §23 |
| 13 (reserved) | — |
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
| 26 Open for owner | Plan §7; Inv §10 |
| 27 Handoff to #3 | Inv §8 (#3 table); Arch §11 |

---

## 29. Resolution of the inventory §8 handoff (H1–H15)

| # | Handoff decision | Resolution in this Contract |
|---|---|---|
| **H1** | Source lineage | **Blogger-template lineage** [owner A / Plan A]. §2, §11, §25 authored against `widgets/sandbox/blogger-hud01-02-wip/`, `releases/blogger-pilot-hud03/`, `panels/hud-10/`, `shared/`. |
| **H2** | `maxi` = expanded panel, as an authored variant | §7.2 — `maxi` MUST be an authored composition, fully expanded, no toggle, no `is-mini`. |
| **H3** | `mini` for HUD-01/02: scale crop vs authored | §7.4 — `transform: scale()` crop **accepted for the `svg` family** with `knownDeviations: mini-is-transform-scale` (owner C); a `mini` composition MUST still exist in both `16:9` and `9:16`. HUD-03/04 use their real `.nc-hp-mini-card` and MUST NOT use the exception. |
| **H4** | `micro` out of 1.0 but reserved | §7.1, §7.3 — reserved in the enum; Runtime MUST accept it; no Theme required to ship it; validation MUST NOT require it. |
| **H5** | `9:16` compositions do not exist | §8.2–8.5 — `mini:9:16` **REQUIRED** (authored, owner C); `maxi:9:16` **DEFERRED**, MAY be `supported:false` + `knownDeviations: no-maxi-9x16` (owner D). No mechanical portrait (§8.4). HUD-10 is the portrait reference (§25.4). |
| **H6** | Semantic slot vocabulary; `system`/`ticker` fate | §9.2 — standard vocabulary ratified; `system` → `subtitle`, `ticker` → `footer` (no dedicated slots); `controls`/`visualization` are Theme-owned. |
| **H7** | HUD-01/02 dual personality | §11.1 — **one Theme** with `capabilities.modes {object, html}` (owner E); not two Themes. |
| **H8** | Fetched-not-injected content policy | §10 — `capabilities.dataSource` with a fixed provider/host allowlist and a `name-in / rendering-out` model (owner F); Vision §12 tension resolved by confinement, not free rein. |
| **H9** | External-resource allowlist, page-load vs lazy, kind taxonomy | §3.13, §16.2 — allowlist fixed in the Contract; `externalResources[]` optional for allowlisted hosts (owner 2026-09-09); `kind` ∈ {script,style,font,fetch,iframe}; `timing` ∈ {page-load,lazy}. |
| **H10** | JS lifecycle / teardown hook signature | §17.1 — `init(root, context) → { setData?, resize?, setVariant?, destroy! }`; where a Theme can't expose hooks yet, the **renderer** wraps unchanged Theme code and owns teardown (§17.2). |
| **H11** | Isolation mechanism per family | §15 — `scoped-root` baseline for all; `shadow-dom-preferred` (attempt + validate + fall back) for the `css` family; **Shadow DOM NOT attempted for HUD-01/02** (`isolation` MUST be `scoped-root` when `svg` + `skyViewer`/`dataSource`). |
| **H12** | Shared-foundation CSS policy | §15.4, §15.6, §11.2 — host-wide `*`/`html`/`body` rules stripped/root-scoped at packaging (`knownDeviations: shared-base-host-selectors-stripped`); shared `@keyframes` owned & de-duplicated by the platform base; Theme declares `animations`. |
| **H13** | `overflow: visible` glow | §15.5, §3.1 `overflowVisible` — a Theme MAY paint outside its box; renderer MUST NOT hard-clip such a mount; `knownDeviations: overflow-visible`. |
| **H14** | Shared-foundation ownership | §11.2 — **platform-provided versioned base**, injected once per page; Theme declares `baseVersion` (REQUIRED). Confirmed as O4 for the owner. |
| **H15** | Single-instance constraint | §16.5 — single-instance is the **1.0 floor** and a documented limitation (`knownDeviations: single-instance`); `capabilities.multiInstance: true` allowed and expected where a factory pattern exists (blogger lineage HUD-01/02/03/04); defined 0.2 path via instance factory. Flagged as O2. |

---

## 30. Resolution of Plan §7 owner decisions A–F

| Owner decision | Baked into the Contract |
|---|---|
| **A — Source lineage = blogger-template** | §2, §11.2, §25 authored against that lineage; §29 H1. |
| **B — Migration input under version control** | Not a Contract clause (already done, commit `aa13591`); §25 relies on it. |
| **C — HUD-01/02 `mini` = `transform: scale()` for 1.0; `mini` MUST exist in 16:9 **and** 9:16** | §7.4, §8.2 — the scale exception (`knownDeviations: mini-is-transform-scale`) plus the non-waived dual-ratio `mini` requirement. |
| **D — `maxi:9:16` deferred** | §8.3 — `compositions["maxi:9:16"].supported` MAY be `false` + `knownDeviations: no-maxi-9x16`; additive re-add later (Arch §31). |
| **E — object-viewer vs html-frame = one Theme + flag** | §11.1 — `capabilities.modes {object, html}`. |
| **F — astronomy data stays a Theme concern** | §10 — `capabilities.dataSource` + allowlist; §16.3 permits page-load I/O (`knownDeviations: external-io-on-mount`). |

---

## 31. Architecture §55 coverage checklist

Every item Architecture §55 requires the Contract to define:

| §55 item | Contract § |
|---|---|
| canonical Theme package structure | §2 |
| manifest fields (schema is #3; prose authority here) | §3, §27 |
| Theme ID and naming rules | §4.1 |
| semantic versioning | §4.2–4.4 |
| renderer identifiers | §5 |
| renderer lifecycle | §6 |
| variant requirements | §7 |
| aspect-ratio requirements | §8 |
| standard slot vocabulary | §9.2 |
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
