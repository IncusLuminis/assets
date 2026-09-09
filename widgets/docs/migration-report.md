# HUD Widgets — Migration Audit Report

**Date:** 2026-05-22
**Branch:** feat/hud-infrastructure
**Scope:** Controlled migration of 7 legacy Blogger HUD panels into the production widget architecture.

---

## Scope

Source: `widgets/legacy/panels/HUD-{1..7}.html` (each a monolithic self-contained HTML file with inline `<style>` and `<script>`).

Target: `widgets/panels/hud-{01..07}/` — one directory per panel, each with:
- `index.html` — standalone page (loads shared layer + local CSS/JS)
- `hud-{nn}.css` — component styles only
- `hud-{nn}.js` — component behaviour only
- `README.md` — architecture notes, shared-layer usage table, cleanup candidates

Constraint: 1:1 visual fidelity. No redesign, no feature changes, no cross-panel coupling.

---

## Current Architecture

```
widgets/
├── index.html                  Gallery (links to all panels)
├── playground/
│   └── index.html              Live iframe preview of all panels
├── shared/
│   ├── css/
│   │   ├── reset.css           Meyer reset
│   │   ├── tokens.css          CSS custom properties (design tokens)
│   │   ├── base.css            html/body baseline
│   │   ├── animations.css      @keyframes + utility classes
│   │   ├── typography.css      .nc-heading-*, .nc-label, etc.
│   │   ├── layout.css          .nc-row, .nc-col-*, etc.
│   │   └── effects.css         .nc-panel-sweep, .nc-fx-cut-*
│   └── js/
│       ├── hud-core.js         DOM-ready helper, logging
│       └── hud-loader.js       iframe lazy-load util
├── panels/
│   ├── hud-01/ … hud-07/       Migrated legacy panels
│   ├── asymmetric-panel/       Original scaffold panel
│   ├── targeting-reticle/      Original scaffold panel
│   └── status-card/            Original scaffold panel
└── docs/
    └── migration-report.md     This file
```

Shared CSS load order (every panel): `reset → tokens → base → animations → typography → layout → effects → [widget].css`

---

## Migrated Panels

| Panel | Source | Path | CSS namespace | JS role | Shared keyframes used | Cleanup candidates |
|---|---|---|---|---|---|---|
| HUD-01 | HUD-1.html | `panels/hud-01/` | `nc-ol-*` | Passive stub | `hudBreath`, `hudRotate`, `hudPulseOuter`, `hudPulseInner`, `hudBlinkSoft`, `hudLockBoxPulse` | — |
| HUD-02 | HUD-2.html | `panels/hud-02/` | `nc-or-*` | Passive stub | `hudPulseOuter`, `hudPulseInner`, `hudBlinkSoft`, `hudLockBoxPulse` | — |
| HUD-03 | HUD-3.html | `panels/hud-03/` | `nc-hp-*` | Passive stub | `hudPanelSweep`, `hudTickerScroll` | Frame CSS duplicated in HUD-04 |
| HUD-04 | HUD-4.html | `panels/hud-04/` | `nc-hp-*` | Passive stub | `hudPanelSweep`, `hudTickerScroll` | Frame CSS duplicated from HUD-03 |
| HUD-05 | HUD-5.html | `panels/hud-05/` | `nc-vv-*` | SVG frame renderer + resize | `hudPanelSweep`, `hudTickerScroll` | 16-segment loader animation |
| HUD-06 | HUD-6.html | `panels/hud-06/` | `nc-vs-*` | SVG frame renderer + resize | `hudPanelSweep`, `hudTickerScroll` | 9-segment loader animation |
| HUD-07 | HUD-7.html | `panels/hud-07/` | `sa-*` | Accordion toggle | None | `max-height: 800px` ceiling |

---

## Shared Primitives Promoted

Keyframes and utility classes extracted from inline panel styles and added to `shared/css/animations.css`:

| Name | Source panel | Type | Utility class |
|---|---|---|---|
| `hudBreath` | HUD-01 | keyframe | — |
| `hudRotate` | HUD-01 | keyframe | — |
| `hudPulseOuter` | HUD-01 | keyframe | `.nc-anim-pulse-outer` |
| `hudPulseInner` | HUD-01 | keyframe | `.nc-anim-pulse-inner` |
| `hudBlinkSoft` | HUD-01 | keyframe | `.nc-anim-blink-soft` |
| `hudLockBoxPulse` | HUD-01 | keyframe | `.nc-anim-lockbox` |
| `hudTickerScroll` | HUD-03 | keyframe | `.nc-anim-ticker` |

Pre-existing shared primitives (from scaffold, unchanged):

| Name | File | Notes |
|---|---|---|
| `hudPanelSweep` | `effects.css` via `.nc-panel-sweep` | Sweep beam geometry + animation |
| `hudFlicker`, `hudBlink` | `animations.css` | Used by gallery/playground UI |
| Design tokens | `tokens.css` | Colors, spacing, radius, transition |

---

## Local-Only Decisions

These keyframes were **not** promoted to shared because they are structurally panel-specific:

| Keyframe | Panel | Reason kept local |
|---|---|---|
| `ncOlOpenHud` | HUD-01 | Panel-expand animation tied to `nc-ol-*` geometry |
| `ncOlTopSvgSlider` | HUD-01 | SVG tab slide-in specific to HUD-01 layout |
| `ncHpLoader1-8` | HUD-03/04 | 8-segment sequential loader, `nc-hp-*` only |
| `ncVvSeg1-16` | HUD-05 | 16-segment loader, `nc-vv-*` only |
| `ncVsSeg1-9` | HUD-06 | 9-segment loader, `nc-vs-*` only |

SVG frame renderers (`hud-05.js`, `hud-06.js`) were **not** combined into a shared renderer despite structural similarity — each panel has distinct polygon geometry, corner bracket positions, and positioned child elements. Premature extraction would couple panels.

---

## Known Cleanup Candidates

| ID | Panel(s) | Issue | Risk |
|---|---|---|---|
| C-01 | HUD-03, HUD-04 | Frame CSS (`.nc-hp-frame`, sweep, loader, ticker) is duplicated between the two files | Low — both panels are standalone; coupling them via import would violate the standalone constraint |
| C-02 | HUD-05, HUD-06 | SVG renderer functions share the same structural pattern (polygon + brackets + positioned children) | Medium — extracting a shared renderer requires a stable API contract; defer until a third similar panel appears |
| C-03 | HUD-07 | `max-height: 800px` on `.sa-panel` clips content taller than 800px | Low — set `max-height` to `scrollHeight` in JS for robustness |
| C-04 | HUD-07 | `.sa-expert` amber accent is hardcoded; additional variants (`.sa-warning`, `.sa-critical`) would benefit from a CSS custom property per-accordion | Low |
| C-05 | HUD-05, HUD-06 | Multiple instances of `<filter id="ncVvGlow">` / `<filter id="ncVsGlow">` on a single page would conflict (IDs must be unique per document) | Medium — not an issue in standalone view; becomes an issue if panels are embedded multiple times in one document |
| C-06 | HUD-07 | `clip-path` on `.sa-toggle` reduces the effective touch target at clipped corners | Low — cosmetic concern for mobile |

---

## Verification Checklist

| Check | Result | Notes |
|---|---|---|
| All 7 panels have `index.html` | PASS | — |
| All 7 panels have `{panel}.css` | PASS | — |
| All 7 panels have `{panel}.js` | PASS | — |
| All 7 panels have `README.md` | PASS | — |
| Shared CSS load order correct (7 files, reset→effects) | PASS | All panels verified |
| No absolute URLs in panel files | PASS | `xmlns="http://..."` in SVG is a namespace attribute, not a URL reference |
| No `blogger-template.css` imports in any panel | PASS | — |
| No panel-specific selectors leaked into shared CSS | PASS | effects.css utilities are generic `.nc-fx-*` and `.nc-panel-sweep` |
| SVG filter IDs unique across shared page scope | PASS | HUD-05: `ncVvGlow`/`ncVvGlowS`; HUD-06: `ncVsGlow`/`ncVsGlowS`; HUD-07: none |
| Gallery (`index.html`) links all 7 migrated panels | PASS | — |
| Playground (`playground/index.html`) iframes all 7 panels | PASS | — |
| All shared CSS files present (`shared/css/`) | PASS | 7 files: reset, tokens, base, animations, typography, layout, effects |
| All shared JS files present (`shared/js/`) | PASS | hud-core.js, hud-loader.js |
| No test/debug artifacts in production HTML | PASS | Test button removed from HUD-07 prior to commit |
| HUD-07 CSS source is from HUD-7.html inline styles | PASS | Not from `blogger-template.css` (checkbox-based, incompatible) |

**Overall: 15/15 PASS — 0 WARN — 0 FAIL**

---

## Next Recommended Step

**Cleanup pass C-01:** Promote the shared HUD Post frame into a `nc-hp-frame` partial (or document the duplicate as accepted technical debt with a comment in both files) before HUD-03/04 diverge further.

After that, the widget system is ready for **phase 2**: new panel development using the shared layer, without migration constraints.
