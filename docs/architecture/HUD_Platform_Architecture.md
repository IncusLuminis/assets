# HUD Platform Architecture

**Status:** Draft  
**Version:** 0.3  
**Depends on:** HUD Platform Vision 0.3  
**Platform:** Incus Luminis / Nebulacast  
**Architecture type:** Shared Asset Platform + HUD Runtime + Registry + Authoring + Validation

---

## 1. Purpose

This document defines the technical architecture of the HUD Platform described in **HUD Platform Vision 0.3**.

The architecture establishes:

- system boundaries;
- repository ownership;
- HUD Theme packaging;
- Theme manifest structure;
- HUD Runtime responsibilities;
- renderer boundaries;
- semantic data exchange;
- Registry structure;
- asset-library structure;
- Cloudflare publication;
- Visual Composer integration;
- HUD Playground integration;
- isolation and security requirements;
- validation requirements;
- compatibility and versioning rules;
- migration of existing HUD-01 through HUD-04 implementations;
- implementation phases.

The principal architectural objective is to make HUD implementations reusable across Incus Luminis products without coupling consuming applications to HUD-specific HTML, CSS, SVG, JavaScript, video, image, or gadget internals.

---

## 2. Architecture Principles

The architecture is governed by the following rules.

### 2.1 Consumer Independence

A consuming application MUST NOT know the internal implementation technology of a Theme.

It must not need to know:

- Theme-specific DOM structures;
- CSS class names;
- SVG element IDs;
- JavaScript functions;
- filenames;
- animation implementation;
- whether the HUD is implemented using HTML/CSS, SVG, WebM, static graphics, or a composite gadget.

### 2.2 Contract First

The common boundary is the **HUD Theme Contract**.

Runtime, Visual Composer, Playground, Registry tooling, and consumer integrations must implement this contract rather than inventing private assumptions.

### 2.3 Repository as Source of Truth

The repository is authoritative.

Published CDN content is generated output.

No production Theme should exist only as manually edited CDN content.

### 2.4 Versioned Publication

Published Theme versions are immutable.

A change produces a new version.

### 2.5 Additive Evolution

The platform should evolve additively wherever practical.

Existing HUDs and consumer applications should be migrated incrementally rather than rewritten wholesale.

### 2.6 Existing HUDs as Proof

HUD-01 through HUD-04 are the initial compatibility baseline.

The architecture is considered proven only when these materially different implementations can be consumed through the same Runtime contract.

---

## 3. Authoritative Physical Topology

The HUD Platform MUST use the existing Incus Luminis repository organization.

The following locations are authoritative:

| Responsibility | Location |
|---|---|
| Shared HUD/asset repository | `IncusLuminis/shared/assets` |
| Product/runtime source | `IncusLuminis/shared/assets/src` |
| Infrastructure, deployment, maintenance | `IncusLuminis/shared/assets/scripts` |
| HUD Playground | `IncusLuminis/products/visualization-studio/visualization-studio-tools/hud-playground` |
| Existing HUD-01 through HUD-04 examples | `IncusLuminis/products/visualization-studio/visualization-studio-tools/hud-playground/widgets/releases` |
| Visual Composer | `IncusLuminis/products/visualization-studio/visualization-studio-tools/visual-composer` |
| Published Registry / Asset CDN | `https://assets.nebulacast.app` |

Conceptually:

```text
IncusLuminis/
│
├── shared/
│   └── assets/
│       ├── src/
│       ├── <asset library>
│       └── scripts/
│
└── products/
    └── visualization-studio/
        └── visualization-studio-tools/
            ├── visual-composer/
            └── hud-playground/
                └── widgets/
                    └── releases/
```

No parallel repository should be introduced for responsibilities already assigned here.

All later references in this document use the logical names:

- **Shared Asset Repository**
- **HUD Playground**
- **Visual Composer**
- **HUD Registry/CDN**

rather than repeating the full physical paths.

---

## 4. System Context

The platform contains five logical subsystems:

```text
                 ┌─────────────────────────┐
                 │     Visual Composer     │
                 │       Authoring         │
                 └────────────┬────────────┘
                              │
                       build / publish
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Shared Asset Repository │
                 │ source + assets + tools │
                 └────────────┬────────────┘
                              │
                       Wrangler deploy
                              │
                              ▼
                 ┌─────────────────────────┐
                 │    HUD Registry/CDN     │
                 │ assets.nebulacast.app   │
                 └────────────┬────────────┘
                              │
                        resolve / load
                              │
                              ▼
                 ┌─────────────────────────┐
                 │       HUD Runtime       │
                 └────────────┬────────────┘
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
       Stellar Attractor   Local Bubble    Nebulacast
                                                │
                                                ▼
                                         nebulacast.com

                 ┌─────────────────────────┐
                 │     HUD Playground      │
                 │ Reference Consumer/Test │
                 └─────────────────────────┘
```

HUD Playground MUST consume the same public Theme Contract and Runtime used by production consumers.

---

## 5. Architectural Layers

The platform is divided into the following layers:

```text
┌──────────────────────────────────────────────┐
│ Consumer Applications                        │
├──────────────────────────────────────────────┤
│ HUD Runtime                                   │
├──────────────────────────────────────────────┤
│ HUD Theme Contract                            │
├──────────────────────────────────────────────┤
│ Published Themes + Registry                   │
├──────────────────────────────────────────────┤
│ Shared Asset Source + Build/Deployment Tools  │
├──────────────────────────────────────────────┤
│ Visual Composer Authoring                     │
└──────────────────────────────────────────────┘
```

Dependencies should remain one-directional:

```text
Consumer
   ↓
Runtime
   ↓
Theme Contract
   ↓
Theme Package
```

Visual Composer produces Theme Packages conforming to the Contract.

It does not sit in the runtime dependency chain.

---

## 6. Shared Asset Repository Responsibilities

The Shared Asset Repository owns:

- HUD Runtime source;
- Theme Contract types and schemas;
- reusable HUD components;
- complete HUD Theme sources/packages;
- shared media;
- Registry metadata;
- build tooling;
- validation tooling;
- Wrangler deployment tooling;
- maintenance tooling;
- generated publication output.

It is the authoritative source for everything deployed to the HUD Registry/CDN.

---

## 7. Recommended Shared Asset Repository Layout

The exact physical structure should respect existing repository conventions, but the following logical organization is recommended:

```text
shared/assets/
├── src/
│   ├── runtime/
│   │   ├── core/
│   │   ├── renderers/
│   │   ├── registry/
│   │   ├── contract/
│   │   └── adapters/
│   │
│   └── tooling/
│
├── library/
│   ├── themes/
│   ├── components/
│   └── media/
│
├── registry/
│   ├── index.json
│   └── schemas/
│
├── scripts/
│   ├── build/
│   ├── validate/
│   ├── deploy/
│   └── maintenance/
│
└── dist/
```

`dist/` is generated output and MUST NOT become the source of truth.

---

## 8. Asset Library Model

The library contains three resource classes.

### 8.1 Themes

Complete runtime-consumable HUD packages.

```text
library/themes/
```

Themes implement the HUD Theme Contract.

### 8.2 Components

Reusable authoring primitives.

```text
library/components/
```

Examples:

- frames;
- corners;
- brackets;
- grids;
- reticles;
- indicators;
- labels;
- typography;
- scanlines;
- noise;
- screen fragments;
- decorative geometry;
- animation fragments.

Components are primarily consumed by Visual Composer.

They are not required to be independently runtime-mountable.

### 8.3 Media

Shared binary resources.

```text
library/media/
```

Examples:

- textures;
- backgrounds;
- WebM loops;
- common icons;
- static overlays;
- reusable image resources.

A Theme may reference shared media if the Contract allows it.

Self-contained Themes remain preferable where practical because they simplify portability and version reproducibility.

---

## 9. HUD Theme

The fundamental runtime unit is the **HUD Theme**.

A Theme is:

- versioned;
- self-contained or deterministically resolvable;
- manifest-driven;
- renderer-independent from the consumer's perspective;
- capable of supporting multiple semantic variants;
- capable of supporting multiple aspect ratios;
- externally loadable;
- validated before publication.

A Theme is a visual family rather than a single file.

---

## 10. Theme Package Layout

A representative Theme package:

```text
themes/
└── hud-07/
    └── 1.0.0/
        ├── manifest.json
        │
        ├── micro/
        │   ├── 16x9/
        │   └── 9x16/
        │
        ├── mini/
        │   ├── 16x9/
        │   └── 9x16/
        │
        ├── maxi/
        │   ├── 16x9/
        │   └── 9x16/
        │
        ├── assets/
        │   ├── images/
        │   ├── video/
        │   ├── svg/
        │   └── textures/
        │
        ├── styles/
        ├── scripts/
        └── preview/
```

Directories that are unused by a Theme may be omitted.

The published package structure must be deterministic even if the source structure differs.

---

## 11. Theme Manifest

Every Theme MUST contain:

```text
manifest.json
```

The manifest is the authoritative machine-readable description of the Theme.

Example:

```json
{
  "schemaVersion": "1.0",
  "id": "hud-07",
  "name": "Orbital Scanner",
  "version": "1.0.0",

  "engine": "svg",

  "variants": [
    "mini",
    "maxi"
  ],

  "aspectRatios": [
    "16:9",
    "9:16"
  ],

  "slots": {
    "required": [
      "title",
      "primary"
    ],
    "optional": [
      "subtitle",
      "secondary",
      "status",
      "footer",
      "content"
    ]
  },

  "capabilities": {
    "animation": true,
    "interactive": false,
    "background": false
  },

  "entrypoints": {
    "mini:16:9": "mini/16x9/hud.svg",
    "mini:9:16": "mini/9x16/hud.svg",
    "maxi:16:9": "maxi/16x9/hud.svg",
    "maxi:9:16": "maxi/9x16/hud.svg"
  }
}
```

The manifest format MUST be backed by a formal JSON Schema.

---

## 12. Theme Contract

The Theme Contract defines the stable boundary between:

```text
Theme
Runtime
Registry
Visual Composer
HUD Playground
Consumer
```

The Contract must define:

- package structure;
- manifest fields;
- Theme IDs;
- version rules;
- supported renderers;
- standard variants;
- aspect ratios;
- slots;
- custom slots;
- asset addressing;
- lifecycle;
- isolation;
- script policy;
- Registry resolution;
- compatibility;
- failure behavior;
- validation.

The Theme Contract MUST be independently versioned.

---

## 13. Standard HUD Variants

The standard variants are:

```text
micro
mini
maxi
```

Requirements:

```text
micro  OPTIONAL
mini   REQUIRED
maxi   REQUIRED
```

Variants represent information density and layout semantics, not scale.

A Theme may use different geometry, typography, animation, and controls for each variant.

---

## 14. Aspect Ratio Model

The initial standard aspect ratios are:

```text
16:9
9:16
```

A complete Theme MUST provide:

```text
mini × 16:9
mini × 9:16
maxi × 16:9
maxi × 9:16
```

If `micro` is declared, it SHOULD support both ratios as well.

Each ratio is an explicit composition.

The Runtime MUST NOT infer portrait presentation by rotating or mechanically scaling landscape presentation.

---

## 15. Semantic Content Model

The consumer owns data.

The Theme owns presentation.

The Runtime owns the integration boundary.

Themes expose semantic fields or slots such as:

```text
title
subtitle
primary
secondary
status
footer
content
visualization
controls
```

The exact standard vocabulary belongs to the Theme Contract.

Themes may define custom slots according to Contract rules.

Consumers MUST NOT target Theme-internal DOM elements to set values.

---

## 16. Rendering Engine Model

The Runtime exposes one HUD abstraction and dispatches internally to renderer implementations.

```text
HUD Runtime
    │
    └── Renderer Interface
          ├── CSS Renderer
          ├── SVG Renderer
          ├── Video Renderer
          ├── Static Renderer
          └── Gadget Renderer
```

The consumer never selects implementation-specific code paths beyond selecting a Theme.

---

## 17. CSS Renderer

Used for HUDs implemented primarily with:

- HTML;
- CSS;
- optional JavaScript.

HUD-03 and HUD-04 are expected initial candidates.

The renderer must:

- create an isolated Theme root;
- load required styles;
- load optional scripts according to policy;
- bind semantic data;
- support lifecycle cleanup.

---

## 18. SVG Renderer

Used for:

- static SVG;
- animated SVG;
- SVG with CSS;
- SVG with controlled JavaScript.

HUD-01 and HUD-02 are expected initial candidates.

The renderer must support semantic data injection without forcing consumers to depend on internal SVG IDs.

---

## 19. Video Renderer

Used for HUDs where visual motion is primarily encoded in WebM or equivalent browser-compatible video.

Typical use:

- animated backgrounds;
- exhibit-style visual interfaces;
- effects that do not require procedural real-time rendering.

Application data may be layered above or around the video through Theme-defined slots.

---

## 20. Static Renderer

Used for Themes based primarily on:

- PNG;
- WebP;
- static SVG;
- other non-executable visual backing.

Dynamic application information is placed in Theme-defined overlay areas.

This renderer provides a low-complexity implementation path.

---

## 21. Gadget Renderer

Used for more strongly interactive or device-like compositions.

A Gadget may combine:

- static physical body graphics;
- multiple screens;
- indicators;
- controls;
- animations;
- interactive areas;
- application content.

Gadget support should be reserved architecturally but is not required for Platform 0.1.

The platform must avoid prematurely becoming a generic application UI framework.

---

## 22. Renderer Interface

All renderers implement a common lifecycle.

Conceptually:

```text
mount
setData
resize
setVariant
destroy
```

Illustrative internal TypeScript interface:

```typescript
interface HudRenderer {
  mount(
    container: HTMLElement,
    context: HudRenderContext
  ): Promise<void>;

  setData(data: HudData): void;

  resize(viewport: HudViewport): void;

  setVariant(variant: HudVariant): Promise<void>;

  destroy(): void;
}
```

This is an architectural target, not the final normative API.

---

## 23. HUD Runtime Responsibilities

The Runtime is responsible for:

1. resolving Theme ID;
2. resolving requested Theme version;
3. loading the manifest;
4. validating Contract compatibility;
5. selecting variant;
6. selecting aspect ratio;
7. selecting renderer;
8. resolving Theme assets;
9. creating the isolation boundary;
10. mounting the Theme;
11. supplying semantic data;
12. resizing;
13. switching variants where supported;
14. propagating controlled Theme events where allowed;
15. destroying Theme resources cleanly;
16. containing failures.

The Runtime MUST remain free of application-specific business logic.

---

## 24. HUD Runtime Internal Structure

Recommended logical structure:

```text
src/runtime/
├── core/
│   ├── Hud.ts
│   ├── ThemeLoader.ts
│   ├── ThemeResolver.ts
│   └── Lifecycle.ts
│
├── renderers/
│   ├── CssRenderer.ts
│   ├── SvgRenderer.ts
│   ├── VideoRenderer.ts
│   ├── StaticRenderer.ts
│   └── GadgetRenderer.ts
│
├── registry/
│   └── RegistryClient.ts
│
├── contract/
│   ├── manifest.ts
│   ├── slots.ts
│   ├── variants.ts
│   └── types.ts
│
└── adapters/
    └── web-component/
```

The actual directory structure may be adjusted to match existing repository conventions.

---

## 25. Runtime Consumer API

The target imperative API should remain small.

Conceptually:

```javascript
import { Hud } from "@incus/hud-runtime";

const hud = new Hud({
  theme: "hud-07",
  version: "1.0.0",
  variant: "maxi",
  ratio: "16:9"
});

await hud.mount(container);

hud.setData({
  title: "Betelgeuse",
  primary: "642 ly",
  secondary: "M1–M2 Ia–ab",
  status: "OBSERVING"
});
```

The consumer should not:

- import Theme CSS;
- fetch SVG manually;
- insert Theme HTML manually;
- call Theme-specific functions;
- know renderer internals.

---

## 26. Declarative Integration

A Web Component adapter should be supported for lightweight integration.

Target form:

```html
<nebula-hud
  theme="hud-07"
  version="1.0.0"
  variant="mini"
  ratio="16:9">
</nebula-hud>
```

A slot-based form may also be supported:

```html
<nebula-hud
  theme="hud-07"
  version="1.0.0"
  variant="mini"
  ratio="16:9">

  <span slot="title">BETELGEUSE</span>
  <span slot="primary">642 ly</span>

</nebula-hud>
```

The Web Component is an adapter over the Runtime, not a parallel implementation.

This is particularly useful for consumers with restricted integration environments such as Blogger pages.

---

## 27. HUD Registry

The public Registry is delivered through:

```text
https://assets.nebulacast.app
```

Recommended published structure:

```text
/
├── themes/
│   ├── hud-01/
│   ├── hud-02/
│   ├── hud-03/
│   └── ...
│
├── components/
│   ├── frames/
│   ├── corners/
│   ├── brackets/
│   ├── grids/
│   ├── reticles/
│   ├── indicators/
│   ├── labels/
│   ├── effects/
│   └── typography/
│
├── media/
│   ├── textures/
│   ├── backgrounds/
│   └── video/
│
└── registry/
    ├── index.json
    └── schemas/
```

The Registry is both:

- a distribution mechanism;
- a discovery mechanism.

It is not just static file storage.

---

## 28. Registry Index

The Registry MUST expose machine-readable Theme discovery metadata.

Recommended endpoint:

```text
/registry/index.json
```

Example:

```json
{
  "schemaVersion": "1.0",
  "themes": [
    {
      "id": "hud-01",
      "latest": "1.2.0",
      "versions": [
        "1.0.0",
        "1.1.0",
        "1.2.0"
      ],
      "manifest": "/themes/hud-01/1.2.0/manifest.json"
    }
  ]
}
```

The Registry index may later expose:

- renderer type;
- supported variants;
- supported ratios;
- capabilities;
- preview URLs;
- categories;
- tags;
- compatibility metadata.

Visual Composer and HUD Playground should use Registry discovery rather than hard-coded Theme lists.

---

## 29. Theme Resolution

Theme loading should be deterministic.

```text
Theme ID
   ↓
requested version
   ↓
Registry resolution
   ↓
manifest URL
   ↓
manifest validation
   ↓
Contract compatibility
   ↓
renderer selection
   ↓
variant + ratio entrypoint
   ↓
resource loading
   ↓
mount
```

Production consumers SHOULD pin explicit versions.

Development tooling MAY offer `latest`.

---

## 30. Versioning

HUD Themes use semantic versions:

```text
MAJOR.MINOR.PATCH
```

Example:

```text
/themes/hud-07/1.0.0/
/themes/hud-07/1.1.0/
/themes/hud-07/2.0.0/
```

A published version MUST be immutable.

A changed asset, layout, script, manifest, or behavior requires a new Theme version.

Theme version is distinct from:

- Theme Contract version;
- Runtime version;
- Registry schema version.

---

## 31. Compatibility Model

The platform may simultaneously contain:

```text
Theme version
Theme Contract/schema version
HUD Runtime version
Registry schema version
```

For example:

```text
Theme:            2.4.1
Theme Contract:   1.0
HUD Runtime:      0.3.0
Registry Schema:  1.0
```

Runtime compatibility is based on Contract capabilities, not Theme release number alone.

Breaking Contract changes require a new major Contract/schema version.

---

## 32. Build and Publication Pipeline

Publication follows one controlled direction:

```text
Theme / Component source
        ↓
build
        ↓
validation
        ↓
Registry generation
        ↓
dist generation
        ↓
Wrangler deployment
        ↓
Cloudflare
        ↓
assets.nebulacast.app
```

Only validated generated output should be deployed.

The CDN must never become the primary editing environment.

---

## 33. Wrangler Deployment

Deployment MUST be performed through dedicated Wrangler-based tooling maintained in the Shared Asset Repository infrastructure scripts.

The exact Cloudflare implementation may use the most appropriate supported mechanism, such as:

- Workers static assets;
- Pages;
- R2-backed delivery;
- another Wrangler-compatible Cloudflare deployment model.

The architecture requires:

- reproducible deployment from repository state;
- publication under `assets.nebulacast.app`;
- immutable versioned Theme URLs;
- controlled Registry updates;
- post-deployment verification.

The exact Cloudflare product is an implementation decision, not a Theme Contract concern.

---

## 34. Build Output and Caching

Generated output should conceptually contain:

```text
dist/
├── themes/
├── components/
├── media/
└── registry/
```

Versioned Theme resources should support aggressive immutable caching.

For example:

```text
/themes/hud-07/1.2.0/...
```

Mutable discovery metadata such as:

```text
/registry/index.json
```

requires a shorter cache policy or explicit invalidation.

The platform therefore distinguishes:

```text
immutable versioned assets
mutable discovery metadata
```

---

## 35. Visual Composer Integration

Visual Composer is the primary HUD authoring environment.

It consumes:

- Component Library;
- Theme Registry;
- Theme Contract;
- validation rules.

It produces:

- Theme source;
- Theme manifests;
- variant layouts;
- asset references;
- buildable Theme packages.

Visual Composer MUST NOT define a private runtime format.

---

## 36. Visual Composer Authoring Model

Target authoring flow:

```text
Create / Open Theme
        ↓
select engine
        ↓
select variant
        ↓
select 16:9 / 9:16
        ↓
compose reusable components
        ↓
define semantic slots
        ↓
configure animation / behavior
        ↓
preview
        ↓
validate
        ↓
package
        ↓
publish
```

The authoring model must support separate compositions for:

```text
micro
mini
maxi
```

and:

```text
16:9
9:16
```

without assuming automatic scaling between them.

---

## 37. Visual Composer Registry Client

Visual Composer will require Registry and library access.

Conceptual operations:

```text
listComponents()
getComponent()

listThemes()
getTheme()
getThemeVersion()

validateTheme()
publishTheme()
```

Direct publication from Visual Composer is not required initially.

The first implementation may produce repository-ready Theme output and leave publication to standard repository tooling.

This is preferable until versioning, validation, and repository history are fully controlled.

---

## 38. HUD Playground Role

HUD Playground is the reference consumer and compatibility laboratory.

It must support:

- Registry discovery;
- Theme loading through Runtime;
- variant selection;
- ratio selection;
- test datasets;
- viewport testing;
- runtime diagnostics;
- validation.

The intended execution path is:

```text
HUD Registry/CDN
      ↓
HUD Runtime
      ↓
HUD Playground
```

HUD Playground MUST NOT bypass the Runtime for migrated Themes.

---

## 39. Existing HUD Migration Baseline

Existing HUD examples must be inventoried before the Contract is finalized.

Initial expected mapping:

```text
HUD-01
HUD-02
    → SVG Renderer family

HUD-03
HUD-04
    → CSS/HTML/JavaScript Renderer family
```

This mapping remains provisional until actual implementation inspection.

The migration objective is initially architectural compatibility, not redesign.

Existing output should be preserved wherever practical.

---

## 40. Migration Strategy

Migration should proceed in five stages.

### Stage 1 — Inventory

For HUD-01 through HUD-04, document:

- files;
- dependencies;
- renderer technology;
- HTML structure;
- CSS structure;
- SVG structure;
- JavaScript dependencies;
- animation mechanisms;
- data injection;
- current mini/maxi behavior;
- current form-factor behavior;
- global assumptions.

### Stage 2 — Contract Mapping

Map each HUD onto:

- Theme manifest;
- engine;
- semantic slots;
- variants;
- ratios;
- entrypoints;
- capabilities.

### Stage 3 — Package Without Redesign

Create Theme packages while preserving existing rendering as much as possible.

### Stage 4 — Runtime Integration

Replace direct HUD-specific Playground loading with Runtime loading.

### Stage 5 — External Consumer Test

Integrate at least one Theme into a real external consumer using the published Registry/CDN.

Only after these stages should deeper HUD redesign begin.

---

## 41. Isolation Architecture

A reusable Theme must not contaminate its host application.

Risks include:

- global CSS;
- global selectors;
- global JavaScript state;
- event-listener leaks;
- z-index collisions;
- font overrides;
- DOM mutations;
- unbounded animation loops.

Preferred isolation order:

```text
1. Shadow DOM
2. scoped Theme root
3. iframe isolation for exceptional cases
```

Shadow DOM should be the preferred default where compatible with legacy HUD behavior.

Compatibility wrappers may be used during migration.

---

## 42. CSS Policy

Themes MUST avoid host-wide selectors such as:

```css
body { ... }
html { ... }
* { ... }
```

when those rules can escape the Theme boundary.

Themes should render under an isolated root.

Legacy styles may be transformed or scoped during packaging where necessary.

The long-term requirement is native isolation.

---

## 43. JavaScript Policy

Executable Themes represent a security boundary.

Initial policy:

- executable Themes may only be loaded from the controlled Registry;
- arbitrary third-party JavaScript Theme URLs are unsupported;
- Theme scripts must operate within Runtime lifecycle boundaries;
- cleanup is mandatory;
- Theme scripts must not assume ownership of global application state.

More restrictive sandboxing can be added if future requirements justify it.

---

## 44. Asset Security

Deployment should use an allowlist-oriented build process.

The publication pipeline must prevent accidental deployment of:

- credentials;
- secrets;
- source-only files;
- local development artifacts;
- temporary files;
- unrelated repository contents.

The repository may contain more than the CDN.

The CDN should contain only deliberate build output.

---

## 45. Runtime Failure Isolation

A HUD failure MUST NOT break the host application.

Expected errors include:

```text
ThemeNotFound
VersionNotFound
RegistryUnavailable
ManifestInvalid
ContractUnsupported
RendererUnsupported
VariantUnsupported
RatioUnsupported
EntrypointMissing
AssetLoadFailed
ThemeMountFailed
ThemeRuntimeError
```

Consumers decide whether to:

- hide the HUD;
- display fallback content;
- switch Theme;
- report diagnostics.

---

## 46. Validation Architecture

Before publication, each Theme should pass automated validation.

Minimum checks:

```text
manifest exists
manifest schema valid
Theme ID valid
version valid

mini:16:9 exists
mini:9:16 exists
maxi:16:9 exists
maxi:9:16 exists

micro combinations valid if declared

entrypoints resolve
referenced assets resolve
required slots declared
renderer supported

CSS isolation checks pass
script policy checks pass

Runtime mount succeeds
Runtime destroy succeeds
```

Additional validation may include:

- console-error detection;
- preview generation;
- viewport overflow checks;
- visual regression;
- performance budgets;
- broken-link detection;
- animation cleanup checks.

---

## 47. HUD Playground Validation Modes

HUD Playground should eventually expose:

```text
Interactive Preview
Automated Validation
Responsive Preview
Compatibility Preview
Test Dataset Preview
```

Suggested controls:

```text
Theme
Version
Variant
Ratio
Viewport
Test Dataset
Runtime Version
```

It should become the reference environment for deciding whether a Theme is platform-compatible.

---

## 48. Maintenance Architecture

Maintenance tooling should support repeated safe execution.

Expected tasks include:

- validate all manifests;
- regenerate Registry metadata;
- verify published CDN paths;
- detect missing assets;
- detect orphaned versions;
- compare generated output with CDN state;
- report broken Theme references;
- generate library inventory.

Maintenance tooling must not silently rewrite published immutable versions.

---

## 49. Deployment Safety

Deployment should follow:

```text
build
  ↓
validate
  ↓
stage
  ↓
deploy
  ↓
verify
```

A Theme failing validation MUST NOT be partially published.

Where possible, publication should appear atomic to consumers.

Registry metadata should be updated only after required Theme assets are available.

---

## 50. Platform 0.1 Scope

Platform 0.1 proves the architecture.

Required deliverables:

1. inventory HUD-01 through HUD-04;
2. define HUD Theme Contract 1.0;
3. define manifest JSON Schema;
4. establish asset-library structure;
5. establish Registry generation;
6. establish Wrangler deployment;
7. publish working `assets.nebulacast.app`;
8. implement minimal HUD Runtime;
9. implement SVG Renderer;
10. implement CSS Renderer;
11. package HUD-01;
12. package HUD-02;
13. package HUD-03;
14. package HUD-04;
15. migrate Playground to Runtime loading;
16. load Themes from the external Registry/CDN;
17. validate mini/maxi;
18. validate 16:9/9:16;
19. integrate one external consumer.

Success criterion:

> HUD-01 through HUD-04 can be loaded through a common Runtime interface without the consumer knowing how each HUD is implemented.

---

## 51. Platform 0.2 Scope

After Platform 0.1 stabilizes:

- Static Renderer;
- Video Renderer;
- Component Registry;
- preview generation;
- Web Component adapter;
- stronger isolation;
- automated validation;
- CDN verification;
- richer discovery metadata;
- Theme browser UI.

---

## 52. Visual Composer HUD Authoring 1.0

Full Theme authoring begins only after the Contract survives migration of existing HUDs.

Dependency order:

```text
HUD inventory
     ↓
Theme Contract
     ↓
Runtime
     ↓
HUD-01..04 migration
     ↓
Playground validation
     ↓
Registry/CDN integration
     ↓
Visual Composer HUD Authoring
```

This ordering prevents Visual Composer's internal document model from becoming the de facto platform contract.

---

## 53. Architectural Risks

### 53.1 Theme-Specific Consumer Coupling

Risk:

Consumers access Theme internals.

Mitigation:

semantic Render Contract + Runtime.

### 53.2 Global CSS Leakage

Risk:

Theme modifies host UI.

Mitigation:

isolation, scoping, validation.

### 53.3 Uncontrolled JavaScript

Risk:

remote Theme code gains excessive host access.

Mitigation:

trusted Registry, lifecycle limits, script policy.

### 53.4 Registry/CDN Divergence

Risk:

published assets do not correspond to repository state.

Mitigation:

deterministic repository-driven build and Wrangler deployment.

### 53.5 Visual Composer Lock-In

Risk:

platform format becomes Visual Composer's private format.

Mitigation:

independent Theme Contract.

### 53.6 Premature Generalization

Risk:

building a universal UI engine before existing HUDs work.

Mitigation:

Platform 0.1 is driven by HUD-01 through HUD-04.

### 53.7 Breaking Published Consumers

Risk:

a Theme changes in place.

Mitigation:

immutable semantic-versioned packages.

### 53.8 Variant Explosion

Risk:

every Theme invents unrelated combinations of size and aspect ratio.

Mitigation:

standard `micro/mini/maxi` and `16:9/9:16` model.

---

## 54. Architectural Decision Summary

The following decisions are normative unless explicitly superseded:

1. The existing Incus Luminis repository topology is authoritative.
2. The Shared Asset Repository is the source of truth.
3. The asset library lives inside that repository.
4. The Registry/CDN is a generated deployment target.
5. Wrangler is the deployment interface.
6. HUD Runtime source belongs to the Shared Asset Repository.
7. HUD Playground is the reference consumer and validation environment.
8. Existing HUD-01 through HUD-04 are the first migration baseline.
9. Visual Composer is the authoring tool, not the definition of the Theme format.
10. Themes are versioned and immutable after publication.
11. The Theme manifest is the authoritative Theme descriptor.
12. Consumers use semantic data, not Theme internals.
13. `micro`, `mini`, and `maxi` are semantic variants.
14. `16:9` and `9:16` are independent compositions.
15. CSS and SVG are the first required renderer families.
16. Video, Static, and Gadget renderers are additive later capabilities.
17. Executable Themes initially come only from the controlled Registry.
18. Runtime failures must remain local to the HUD.
19. Platform evolution should be additive and non-breaking wherever practical.
20. Existing HUD behavior should be migrated before being redesigned.

---

## 55. Next Normative Document

The next document should be:

```text
HUD_Theme_Contract_1.0.md
```

It should define precisely:

- canonical Theme package structure;
- manifest JSON Schema;
- Theme ID and naming rules;
- semantic versioning;
- renderer identifiers;
- renderer lifecycle;
- variant requirements;
- aspect-ratio requirements;
- standard slot vocabulary;
- custom-slot rules;
- asset addressing;
- Registry resolution;
- Runtime behavior;
- CSS isolation rules;
- JavaScript policy;
- error model;
- compatibility rules;
- validation rules;
- publication rules;
- backward compatibility.

Once this Contract exists, implementation can proceed independently in:

```text
Shared Asset Repository
HUD Playground
Visual Composer
```

without allowing those codebases to establish incompatible local conventions.
