# HUD Platform Vision

**Status:** Draft  
**Version:** 0.3  
**Platform:** Incus Luminis / Nebulacast  
**Primary components:** HUD Asset Registry, HUD Runtime, Visual Composer, HUD Playground

---

## 1. Purpose

The HUD Platform provides a common visual interface system for applications and websites developed within the Incus Luminis ecosystem.

Its purpose is to replace project-specific HUD implementations with a reusable library of visual components, complete HUD themes, authoring tools, and a common runtime.

Initial consumers include:

- Stellar Attractor
- Local Bubble
- Nebulacast.app
- Nebulacast.com

The platform must allow the same HUD theme to be created once, published centrally, and incorporated into multiple applications without copying its implementation into each project.

The platform is not merely a collection of graphical assets. It is a shared presentation subsystem that defines how HUDs are authored, packaged, published, discovered, loaded, rendered, tested, versioned, and reused.

---

## 2. Vision

HUDs become reusable application assets rather than project-specific graphics.

A HUD is not simply an SVG, image, video, or collection of CSS rules.

A published HUD is a **HUD Theme**: a versioned, self-contained visual interface package implementing a common contract.

Applications consume HUD Themes through a shared runtime and provide application-specific content through defined data areas or slots.

The application owns the information.

The HUD Theme owns its presentation.

The HUD Runtime connects the two.

Conceptually:

```text
Application Data
       │
       ▼
   HUD Runtime
       │
       ▼
    HUD Theme
       │
       ▼
Rendered Interface
```

This separation allows a HUD to be redesigned, replaced, upgraded, or reused without changing the application's domain logic.

---

## 3. Strategic Goals

The platform has six primary goals.

### 3.1 Reuse

HUD components and complete HUD designs must be reusable between projects.

A visual element created for Stellar Attractor may later be reused in Local Bubble, Nebulacast, or another Incus Luminis application.

### 3.2 Consistency

Applications should share a recognizable visual language without being forced to use identical interfaces.

Reusable primitives, typography, animation patterns, indicators, frames, grids, reticles, and other components provide visual consistency.

### 3.3 Technology Independence

Applications consuming a HUD should not need to know how it is implemented.

A HUD Theme may internally use:

- HTML/CSS/JavaScript
- SVG
- animated SVG
- WebM
- static raster or vector graphics
- composite interactive gadget implementations

These differences are hidden behind the HUD Theme Contract and HUD Runtime.

### 3.4 Centralized Asset Management

Reusable components and finished Themes are maintained in a common source repository and published to a central asset service.

The published service acts as both:

- HUD Asset Library
- HUD Theme Registry
- delivery endpoint for runtime assets

### 3.5 Visual Authoring

Visual Composer becomes the primary authoring environment for HUD components and complete HUD Themes.

It should eventually support the complete lifecycle:

```text
Library
   ↓
Composition
   ↓
Preview
   ↓
Validation
   ↓
Packaging
   ↓
Publishing
```

### 3.6 Portable Integration

A published HUD Theme must be usable by any compatible web application through a small, stable integration API.

---

## 4. Core Platform Concept

The platform consists of five major parts.

```text
                   HUD PLATFORM

        ┌────────────────────────────┐
        │       Visual Composer      │
        │       HUD Authoring        │
        └─────────────┬──────────────┘
                      │ publish
                      ▼
        ┌────────────────────────────┐
        │        HUD Registry        │
        │   assets.nebulacast.app    │
        └─────────────┬──────────────┘
                      │
                load / resolve
                      │
             ┌────────▼────────┐
             │   HUD Runtime   │
             └────────┬────────┘
                      │
          ┌───────────┼────────────┐
          ▼           ▼            ▼
       Stellar      Local      Nebulacast
      Attractor     Bubble       ecosystem

                      ▲
                      │
             ┌────────┴────────┐
             │ HUD Playground  │
             │ test/validation │
             └─────────────────┘
```

The responsibilities are deliberately separated:

- **Visual Composer** creates and edits HUDs.
- **Asset Library / Registry** stores and distributes reusable components and published Themes.
- **HUD Runtime** integrates Themes into consumer applications.
- **HUD Playground** provides reference execution, preview, testing, and validation.
- **Consumers** provide application data and use HUDs without depending on their internal implementation.

---

## 5. Physical Project Topology

The conceptual platform maps onto the existing Incus Luminis repository structure.

These paths are authoritative.

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

The responsibilities are:

| Role | Authoritative location |
|---|---|
| HUD Platform / shared asset repository | `IncusLuminis/shared/assets` |
| Product code | `IncusLuminis/shared/assets/src` |
| Infrastructure, deployment and maintenance scripts | `IncusLuminis/shared/assets/scripts` |
| HUD Playground | `IncusLuminis/products/visualization-studio/visualization-studio-tools/hud-playground` |
| Existing HUD-01 through HUD-04 examples | `IncusLuminis/products/visualization-studio/visualization-studio-tools/hud-playground/widgets/releases` |
| Visual Composer | `IncusLuminis/products/visualization-studio/visualization-studio-tools/visual-composer` |
| Published asset library / Registry / CDN | `assets.nebulacast.app` |

The reusable asset library itself resides inside the shared asset repository.

Publication follows one direction:

```text
shared/assets
     │
     ├── source code
     ├── asset library
     └── scripts
            │
            │ dedicated Wrangler deployment
            ▼
   assets.nebulacast.app
```

The repository is the source of truth.

The Cloudflare CDN is the published representation of that repository's validated asset output.

Infrastructure, deployment, and maintenance logic belongs to the repository and is not maintained manually on the CDN.

Existing HUD-01 through HUD-04 implementations in HUD Playground are the initial migration references and should be adapted to the platform rather than replaced without need.

No new parallel repository should be introduced for responsibilities already assigned above.

---

## 6. HUD Theme

The primary distributable unit of the platform is the **HUD Theme**.

A Theme contains everything necessary to render a specific HUD design.

It may contain:

- layout definitions
- SVG
- HTML
- CSS
- JavaScript
- WebM
- PNG/WebP
- textures
- font declarations
- animation definitions
- reusable components
- metadata
- previews
- variant definitions

Every Theme contains a manifest describing its capabilities and resources.

The Theme is therefore both a visual asset and a deployable interface package.

A Theme is not tied to one consumer application. The same Theme should be capable of receiving different semantic data from different products.

---

## 7. HUD Theme Package

A Theme should have a predictable, self-contained package structure.

A representative logical structure is:

```text
theme/
├── manifest.json
├── preview/
├── micro/
├── mini/
├── maxi/
├── assets/
├── styles/
├── scripts/
└── sources/
```

Variant directories may contain separate compositions for supported aspect ratios.

For example:

```text
mini/
├── 16x9/
└── 9x16/

maxi/
├── 16x9/
└── 9x16/
```

The precise package structure is defined by the HUD Theme Contract rather than by Visual Composer.

---

## 8. HUD Theme Manifest

Every Theme contains a machine-readable manifest.

The manifest describes the Theme rather than forcing consumers to infer its capabilities from files.

Conceptually:

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

  "slots": [
    "title",
    "subtitle",
    "primary",
    "secondary",
    "status",
    "footer"
  ],

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

The exact schema will be defined separately and must become a stable contract shared by the Runtime, Playground, Registry, and Visual Composer.

---

## 9. HUD Rendering Types

The first generation of the platform must support five implementation families.

These are different rendering technologies behind the same Theme abstraction, not five unrelated kinds of product asset.

### 9.1 CSS HUD

HUD composed primarily from HTML, CSS and optional JavaScript.

Existing HUD-03/HUD-04-style implementations are representative of this family.

### 9.2 SVG HUD

HUD constructed primarily using SVG.

Animations may be implemented using SVG, CSS, SMIL where appropriate, or JavaScript.

Existing HUD-01/HUD-02-style implementations are representative of this family.

### 9.3 Video HUD

HUD using WebM or similar browser-compatible media as a visual or animated layer.

This is particularly suitable for exhibit-style compositions and complex effects that are inexpensive to render as pre-generated animation but expensive or unnecessary to reproduce dynamically.

### 9.4 Static HUD

HUD based primarily on a static PNG, WebP, or SVG composition.

This provides the simplest implementation and may be appropriate for decorative frames or interfaces requiring no dynamic graphical behavior.

### 9.5 Gadget HUD

A composite interface visually resembling a physical device or instrument.

A Gadget may combine:

- static body graphics
- screens
- controls
- indicators
- animations
- interactive areas
- dynamic application content

Gadget support is expected to evolve beyond the capabilities of the initial platform.

The architecture should reserve the concept now without turning the initial HUD Platform into a general-purpose UI engine.

---

## 10. HUD Form Factors

Every complete HUD Theme must explicitly declare supported form factors.

The primary aspect ratios are:

```text
16:9
9:16
```

These correspond broadly to landscape and portrait interfaces.

A portrait HUD is not assumed to be a rotated, cropped, or mechanically scaled landscape HUD.

Each form factor may define its own composition while preserving the visual identity of the Theme.

A Theme therefore represents a visual family, not a single fixed canvas.

---

## 11. HUD Variants

Themes support semantic size variants.

The standard variants are:

```text
micro   optional
mini    required
maxi    required
```

These are not merely scaling levels.

They represent different information densities and potentially different layouts.

### Micro

Extremely compact representation.

Typical content:

- identity
- icon
- status
- one primary value

### Mini

Compact information panel.

Typical content:

- title
- status
- several important values
- limited secondary information

### Maxi

Full interface presentation.

Typical content may include:

- primary information
- secondary information
- graphs
- visualization areas
- controls
- extended metadata
- status information

A Theme should preserve its visual identity across all supported variants.

The Runtime and consumers must treat `micro`, `mini`, and `maxi` as semantic presentation modes rather than numeric scale factors.

---

## 12. Content Separation and Render Contract

The central integration principle is:

> The HUD is a presentation frame into which the consumer application supplies its own information.

HUD Themes must not contain application-specific domain logic.

Instead, they expose standardized semantic content areas.

Examples may include:

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

The exact slot vocabulary will be defined by the HUD Theme Contract.

An application supplies data or content.

The Theme decides how that content is presented.

For example, a consumer should conceptually be able to write:

```javascript
hud.set("title", "BETELGEUSE");
hud.set("primary", "642 ly");
hud.set("status", "OBSERVING");
```

or use a declarative integration:

```html
<nebula-hud theme="hud-07" variant="mini" ratio="16:9">
  <span slot="title">BETELGEUSE</span>
  <span slot="primary">642 ly</span>
</nebula-hud>
```

The consumer should not need Theme-specific code such as:

```html
<div class="hud03-left-caption">
```

This separation allows the same Theme to display:

- astronomical objects
- spacecraft telemetry
- personnel information
- mission data
- Local Bubble objects
- Nebulacast exhibits
- other future content

without modifying the Theme itself.

---

## 13. HUD Asset Library and Registry

The central asset platform contains two conceptually different classes of resources.

### 13.1 Components

Reusable authoring primitives.

Examples:

- frames
- corners
- brackets
- grids
- reticles
- indicators
- labels
- typography
- scanlines
- noise
- textures
- decorative elements
- animation fragments
- screen elements

Components are primarily authoring resources.

### 13.2 Themes

Complete HUD implementations ready for application use.

Themes are runtime resources.

This distinction must remain explicit throughout the platform:

```text
COMPONENTS
    reusable building blocks
    consumed mainly by authoring tools

THEMES
    complete HUD packages
    consumed by applications through HUD Runtime
```

The published Registry may conceptually expose structures such as:

```text
/themes/hud-01/1.2.0/
/themes/hud-01/latest/

/components/brackets/
/components/grids/
/components/reticles/
/components/indicators/
/components/labels/
/components/screens/
/components/noise/
/components/scanlines/
/components/corners/
/components/typography/

/media/textures/
/media/backgrounds/
/media/webm/
```

The Registry should also expose machine-readable discovery metadata so tools can enumerate available Themes, versions, capabilities, previews, and components.

Thus `assets.nebulacast.app` is not merely a directory of files. It is the published HUD Registry and Asset CDN.

---

## 14. HUD Runtime

HUD Runtime is the common integration layer between applications and HUD Themes.

It should be deliberately small and framework-independent at its core.

Responsibilities include:

- resolving Themes
- resolving Theme versions
- loading manifests
- checking compatibility
- selecting form factor
- selecting variant
- selecting the appropriate renderer
- loading Theme resources
- mounting the HUD
- supplying semantic data
- resizing
- lifecycle management
- error handling
- isolation between Theme and host application

The Runtime must hide implementation details from consumers.

Applications should not need separate integration logic for CSS, SVG, WebM, static, or gadget HUDs.

Conceptually:

```javascript
import { Hud } from "@incus/hud-runtime";

const hud = new Hud({
  theme: "hud-07",
  version: "1.0.0",
  variant: "maxi",
  ratio: "16:9"
});

await hud.mount(element);

hud.setData({
  title: "Betelgeuse",
  distance: "642 ly",
  magnitude: "0.42"
});
```

The exact API remains subject to the HUD Theme Contract and Runtime specification.

A declarative Web Component adapter should also be considered, especially for lightweight consumers such as Blogger-based pages.

---

## 15. Visual Composer

Visual Composer becomes the HUD Platform authoring environment.

It must eventually provide:

- access to the central Component Library
- access to existing HUD Themes
- loading of semi-finished reusable components
- editing of existing Themes
- 16:9 and 9:16 canvases
- micro/mini/maxi variant editing
- support for multiple HUD rendering technologies
- reusable component composition
- semantic slot definition
- preview
- Theme metadata editing
- Theme validation
- packaging
- publication to the central Registry

A conceptual workspace is:

```text
HUD Composer
│
├── Library
│   ├── Components
│   └── Themes
│
├── Canvas
│   ├── 16:9
│   └── 9:16
│
├── Variant
│   ├── micro
│   ├── mini
│   └── maxi
│
└── Engine
    ├── CSS
    ├── SVG
    ├── Video
    ├── Static
    └── Gadget
```

The publishing flow should become:

```text
Publish Theme
      ↓
validation
      ↓
package build
      ↓
preview generation
      ↓
repository output
      ↓
Wrangler deployment
      ↓
assets.nebulacast.app
```

Visual Composer should not define the HUD Theme format.

It implements the format defined independently by the HUD Platform contract.

This prevents the Runtime architecture from becoming dependent on a specific editor or on Visual Composer's internal document model.

---

## 16. HUD Playground

HUD Playground serves three primary roles.

### 16.1 Development Environment

Developers can load any registered HUD and populate it with test data.

### 16.2 Reference Runtime Consumer

Playground provides a canonical example of how applications consume HUD Themes.

It should use the same Runtime and Registry paths as production consumers.

### 16.3 Validation Target

A Theme that passes Playground validation should behave consistently in compatible applications.

Playground should therefore test:

- Theme discovery
- Theme loading
- manifest validity
- renderer selection
- form factors
- variants
- semantic content slots
- animations
- resource loading
- isolation
- runtime compatibility
- mounting and destruction
- responsive behavior

Existing HUD-01 through HUD-04 implementations are the first migration baseline.

The immediate objective is not to redesign them. It is to place their existing behavior behind the common Theme Contract and prove that the Runtime can consume materially different HUD technologies through one interface.

HUD Playground should therefore evolve from a collection of HUD examples into the reference implementation and compatibility laboratory for the entire HUD Platform.

---

## 17. Publishing and Versioning Model

HUD Themes are versioned assets.

Conceptually:

```text
hud-01
├── 1.0.0
├── 1.1.0
├── 1.2.0
└── latest
```

Production applications should be able to pin a specific Theme version.

Development environments may optionally use `latest`.

Published versioned Theme packages should be treated as immutable.

A changed Theme is published as a new version rather than silently replacing the files used by existing applications.

This provides:

- reproducible application rendering
- safe CDN caching
- controlled upgrades
- rollback capability
- compatibility testing

Theme versioning is separate from HUD Theme Contract/schema versioning.

A Theme may evolve through many releases while remaining compatible with the same Contract version.

---

## 18. Isolation, Security, and Failure Boundaries

Because HUD Themes may contain CSS and JavaScript, they form an integration boundary with the host application.

A Theme must not accidentally modify unrelated application UI or state.

The platform must account for:

- global CSS leakage
- global selectors
- global JavaScript state
- event-listener cleanup
- resource collisions
- z-index collisions
- font overrides
- executable remote code

Possible isolation mechanisms include:

- Shadow DOM
- scoped styles
- isolated Theme roots
- iframe isolation for advanced cases

The initial platform should prefer the simplest isolation mechanism compatible with existing HUD implementations.

Executable Themes should initially be loaded only from the controlled HUD Registry.

Arbitrary third-party JavaScript Themes are outside the initial scope.

A failed HUD must fail locally and must not break the host application.

---

## 19. Validation

Before publication, a Theme should pass automated validation.

Minimum validation should cover:

```text
manifest valid
Theme ID valid
version valid

mini/16:9 exists
mini/9:16 exists
maxi/16:9 exists
maxi/9:16 exists

micro combinations valid if micro is declared

entrypoints resolve
assets resolve
required slots declared
renderer supported

no forbidden global CSS behavior
script policy valid
runtime mounting succeeds
runtime destruction succeeds
responsive behavior acceptable
```

Additional validation can later include:

- preview generation
- console-error detection
- performance budgets
- viewport overflow detection
- visual regression testing
- broken-resource checks

Validation belongs to the platform contract, not to a single consumer application.

---

## 20. Initial Scope — HUD Platform 0.1

The first platform milestone should not attempt to implement full HUD authoring.

HUD Platform 0.1 should establish and prove the contract.

Recommended sequence:

1. Inspect the existing HUD-01 through HUD-04 implementations.
2. Document their current rendering technologies, dependencies, variants, form factors, and data injection mechanisms.
3. Define HUD Theme Contract 1.0.
4. Define the Theme manifest and JSON Schema.
5. Define the asset-library and Registry structure.
6. Establish the shared asset build process.
7. Establish dedicated Wrangler deployment to the Cloudflare CDN.
8. Implement a minimal HUD Runtime.
9. Implement the SVG renderer required by HUD-01/HUD-02.
10. Implement the CSS renderer required by HUD-03/HUD-04.
11. Package HUD-01 as a Theme.
12. Package HUD-02 as a Theme.
13. Package HUD-03 as a Theme.
14. Package HUD-04 as a Theme.
15. Make HUD Playground load these Themes through the Runtime.
16. Make HUD Playground load published Themes from the Registry/CDN.
17. Validate mini/maxi behavior.
18. Validate 16:9/9:16 behavior.
19. Test at least one external consumer integration.

The first milestone is successful when materially different existing HUD implementations can be loaded through the same Runtime contract without the consumer knowing their implementation technology.

---

## 21. Subsequent Platform Evolution

After Platform 0.1 proves the core contract, development can proceed incrementally.

### Platform 0.2

Likely additions:

- Static Renderer
- Video Renderer
- Component Registry
- Theme preview generation
- declarative Web Component adapter
- stronger automated validation
- stronger isolation
- richer Registry discovery

### Visual Composer HUD Authoring 1.0

Only after the Runtime and Theme Contract survive real migration should Visual Composer become capable of producing complete HUD Themes.

The intended dependency order is:

```text
Contract
   ↓
Runtime
   ↓
existing HUD migration
   ↓
Playground validation
   ↓
Registry/CDN validation
   ↓
Visual Composer HUD Authoring
```

The editor must implement an existing platform format rather than implicitly inventing that format through its internal data model.

### Later Evolution

Future work may include:

- Gadget Renderer
- richer interactive HUDs
- Theme inheritance or families
- reusable animation systems
- visual Theme composition
- automated Theme optimization
- additional form factors where real consumers require them

These capabilities should be added only when concrete product requirements justify them.

---

## 22. Long-Term Direction

The HUD Platform should become the reusable visual interface layer of the Incus Luminis ecosystem.

Over time, the asset library will accumulate:

```text
visual primitives
        ↓
reusable components
        ↓
HUD families
        ↓
complete themes
        ↓
application interfaces
```

The creation of each new application should therefore increase the visual capabilities available to subsequent applications rather than producing another isolated implementation.

Stellar Attractor, Local Bubble, Nebulacast, and future products should be able to share visual language and implementation assets without becoming tightly coupled to one another.

The intended result is a growing visual system backed by reusable technical infrastructure.

---

## 23. Architectural Risks and Boundaries

The Vision deliberately constrains several risks.

### Theme-Specific DOM Leakage

If consumers know Theme-specific DOM structures, the platform degenerates into a shared file directory.

The semantic Render Contract prevents this.

### Global CSS Contamination

A reusable Theme cannot assume ownership of the host page.

Isolation is therefore a platform requirement.

### Arbitrary JavaScript Execution

Executable Themes create a security boundary.

Initial Themes should therefore come from the controlled Registry.

### Theme Fragmentation

Without a manifest, standard variants, ratios, and lifecycle, every HUD becomes a special case.

The Theme Contract exists to prevent this.

### Visual Composer Lock-In

The platform format cannot be equivalent to Visual Composer's internal file format.

The Contract remains independent.

### Premature Generalization

The platform should not become a universal UI framework before the existing four HUDs work through it.

Existing HUD-01 through HUD-04 are the proving ground.

### Breaking Deployed Consumers

Published Theme versions should be immutable and consumers should be able to pin versions.

---

## 24. Guiding Principles

The following principles define the platform.

### 24.1 Theme Principle

> A HUD Theme is a versioned, self-contained presentation package that can be loaded through a common runtime without requiring the consuming application to know its internal implementation technology.

### 24.2 Content Principle

> The consumer owns information and application behavior; the Theme owns presentation; the Runtime owns the integration boundary.

### 24.3 Authoring Principle

> Visual Composer produces HUD Themes according to the platform contract; it does not define the contract.

### 24.4 Registry Principle

> The Asset Registry is both a reusable component library and the distribution mechanism for complete runtime Themes.

### 24.5 Repository Principle

> The shared asset repository is the source of truth; the CDN is a generated and deployed representation of validated repository content.

### 24.6 Compatibility Principle

> New platform capabilities should be introduced additively wherever practical, preserving existing consumers and published Themes.

### 24.7 Migration Principle

> Existing HUD implementations should first be wrapped and migrated with minimal visual change; redesign comes after the common contract has been proven.

---

## 25. Next Specification

The next normative document should be:

```text
HUD_Theme_Contract_1.0.md
```

It should formalize:

- canonical Theme package structure
- `manifest.json`
- manifest JSON Schema
- Theme naming and IDs
- renderer contract
- Theme lifecycle
- variants
- aspect ratios
- semantic slots
- custom slots
- asset addressing
- Registry discovery
- Runtime behavior
- CSS isolation
- JavaScript policy
- versioning
- compatibility
- error handling
- validation rules
- publication rules
- backward compatibility

That Contract becomes the authoritative specification shared by:

```text
HUD Runtime
Visual Composer
HUD Playground
Asset Registry
Consumer applications
```

Only after that boundary is explicit should implementation work begin in parallel.
