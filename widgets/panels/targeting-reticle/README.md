# Targeting Reticle

Circular targeting overlay with rotating rings, crosshair, corner brackets, and live azimuth/range/elevation readouts.

## Purpose
Full-viewport targeting HUD element. Simulates lock-on behavior with occasional lock/scan state transitions.

## Files
| File | Role |
|---|---|
| `index.html` | Widget entry point |
| `reticle.css` | Widget-scoped styles (`.nc-reticle` namespace) |
| `reticle.js` | Live targeting data simulation stub |

## Shared layer
Loads from `../../shared/css/`: `reset.css`, `tokens.css`, `base.css`, `animations.css`, `typography.css`

## Running locally
```bash
python3 -m http.server 8080 --directory /path/to/widgets
# http://localhost:8080/panels/targeting-reticle/
```

## CSS namespace
All classes use the `.nc-reticle` prefix.
