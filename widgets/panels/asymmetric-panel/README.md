# Asymmetric Panel

Sci-fi HUD panel with clipped top-right corner, left accent bar, and live telemetry data simulation.

## Purpose
A general-purpose data panel with an asymmetric design. Displays multiple telemetry fields (vector, altitude, velocity, power) with simulated live updates.

## Files
| File | Role |
|---|---|
| `index.html` | Widget entry point — open directly in browser |
| `panel.css` | Widget-scoped styles (`.nc-asym-panel` namespace) |
| `panel.js` | Live data simulation stub |

## Shared layer
All shared styles are loaded from `../../shared/css/`:
- `reset.css` — CSS reset
- `tokens.css` — CSS custom properties
- `base.css` — dark HUD theme, utility classes
- `animations.css` — keyframe animations

## Running locally
Open `index.html` via any static server:
```bash
# Python 3
python3 -m http.server 8080 --directory /path/to/widgets

# Then visit:
# http://localhost:8080/panels/asymmetric-panel/
```
Or open `index.html` directly in a browser (file:// works for this widget).

## CSS namespace
All classes use the `.nc-asym-panel` prefix.
