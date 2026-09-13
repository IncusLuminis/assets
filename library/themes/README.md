# library/themes/

HUD Theme **sources** (editable) — one directory per Theme `id`, e.g.
`library/themes/hud-01/`. This is the *source* side of the source/published
split (HUD Theme Contract 1.0 §2.1): hand-edited or Visual-Composer-authored
here, then built into the deterministic, immutable published package under
`dist/themes/<id>/<version>/` (generated, never committed).

The published package layout is normative and documented in Contract §2.2 —
`manifest.json` at the package root, `maxi/`, `mini/`, `micro/` variant
directories each containing `landscape/`/`portrait/` orientation
subdirectories per the Theme's declared `compositions`, plus optional
`assets/`, `styles/`, `scripts/`, `preview/`, `sources/`.

## What's here now (Story #5)

`fixture-hud/` — a minimal, schema-valid example Theme proving the directory
shape and manifest schema conformance, with no consumer-specific coupling.
It is a fixture, not a real HUD — see its own README.

## What's coming later (not this Story)

The four baseline HUD Themes (`hud-01`..`hud-04`, plus `hud-10`) are migrated
from `widgets/panels/hud-0N/` by Stories **#11–#15**, preserving behaviour
(Architecture §40 Stage 3). `widgets/` stays in place as their migration
input until then (Plan §3) — see the top-level README.
