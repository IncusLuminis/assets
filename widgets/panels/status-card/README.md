# Status Card

Compact HUD status card with animated stat bars for shields, hull integrity, and power levels. Status transitions between NOMINAL / DEGRADED / CRITICAL automatically.

## Purpose
Entity status overview panel. Shows three resource bars with colour-coded warning states and a live blinking status indicator.

## Files
| File | Role |
|---|---|
| `index.html` | Widget entry point |
| `status-card.css` | Widget-scoped styles (`.nc-status-card` namespace) |
| `status-card.js` | Live stat simulation with warning state logic |

## Shared layer
Loads from `../../shared/css/`: `reset.css`, `tokens.css`, `base.css`, `animations.css`, `typography.css`

## Running locally
```bash
python3 -m http.server 8080 --directory /path/to/widgets
# http://localhost:8080/panels/status-card/
```

## CSS namespace
All classes use the `.nc-status-card` prefix.
