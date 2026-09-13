# library/media/

Reserved for shared binary resources a Theme may reference (textures,
backgrounds, WebM loops, common icons, static overlays, reusable image
resources — Architecture §8.3). Self-contained Themes remain preferable
where practical for portability and version reproducibility; this directory
is the deliberate exception for genuinely shared media.

Heavy raster/video media placed here is **CDN-only** per the repo's existing
`.gitignore` binary-media policy (Plan §2 decision 5) — it is not committed
to git regardless of which directory it lives under. Only vector/text
formats (SVG, and text-based data such as CSS/JS/HTML/JSON) are diffable and
committed.

Deliberately empty in Story #5 — no shared media exists yet; the fixture
Theme (`library/themes/fixture-hud/`) is fully self-contained.
