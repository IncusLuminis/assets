Blogger Pilot Release — HUD01/HUD02

Release Specification for Claude

Goal:
Prepare a production-ready pilot release of HUD01 and HUD02 for deployment inside Blogger posts.

This is NOT a framework task.
This is a static HTML/CSS deployment task optimized specifically for Blogger limitations.

Based on the validated HUD03 Blogger prototype architecture.  ￼

⸻

1. Target Environment

Platform:

* Blogger (Blogspot)

Known constraints:

* Main content column width is approximately 900–950px on desktop.
* Layout uses:
    * ~2/3 main content column
    * ~1/3 sidebar
* Panels are embedded directly inside Blogger posts.
* Blogger template allows adding global CSS.
* Post body allows raw HTML embedding.
* External JS/CDN dependencies should be avoided whenever possible.

Media:

* images are hosted inside Blogger
* videos are embedded via iframe (HeyGen / YouTube / TikTok)

Important:
HUD panels must remain stable inside Blogger rendering engine.

⸻

2. Current Architecture

HUD01 and HUD02 already exist as:

* static HTML
* static CSS
* lightweight JS-free architecture
* scalable vector-style frame geometry
* responsive layout behavior

The architecture MUST remain:

* static
* portable
* copy-paste deployable

No:

* React
* Vue
* npm
* webpack
* runtime dependencies

⸻

3. Release Objective

Prepare the first reusable Blogger release for:

* HUD01
* HUD02

Release folder:

/releases/blogger-pilot-hud01-02/

This becomes the canonical release structure for future SVG-native HUD panels.

⸻

4. Required Release Structure

Create:

/releases/blogger-pilot-hud01-02/
│
├── blogger-hud01-template.css
├── blogger-hud02-template.css
│
├── blogger-hud01-post.html
├── blogger-hud02-post.html
│
├── BLOGGER_PILOT_README.md
│
├── examples/
│   ├── hud01-image-version.html
│   ├── hud01-heygen-version.html
│   ├── hud01-youtube-version.html
│   ├── hud02-image-version.html
│   ├── hud02-heygen-version.html
│   └── hud02-youtube-version.html
│
├── screenshots/
│   ├── hud01-desktop.png
│   ├── hud01-mobile.png
│   ├── hud02-desktop.png
│   └── hud02-mobile.png
│
└── optional/
    └── blogger-template-snippet.txt

⸻

5. Deployment Model

Global CSS

Reusable CSS must be extracted into:

* blogger-hud01-template.css
* blogger-hud02-template.css

These files are intended for:

Blogger → Theme → Edit HTML

Claude must:

* isolate reusable CSS
* remove duplicated CSS
* preserve all visual behavior
* preserve namespaced classes (nc-*)

⸻

Post HTML

blogger-hud01-post.html
blogger-hud02-post.html

must contain:

* only required HTML markup
* minimal inline CSS
* no duplicated framework code

User workflow must become:

1. Put CSS into Blogger template once
2. Paste panel HTML into posts

⸻

6. Critical Architectural Difference vs HUD03

HUD01/HUD02 are NOT bitmap-frame panels.

These panels use:

* scalable contour geometry
* CSS/SVG-style line architecture
* resolution-independent frame rendering

This is the primary advantage of HUD01/HUD02.

Claude must preserve:

* geometric scalability
* clean contour rendering
* responsive line integrity

Avoid:

* bitmap slicing
* raster frame fragments
* pixel-position hacks

HUD01/HUD02 are the foundation for future SVG-native HUD architecture.

⸻

7. Responsive Constraints

HUD01/HUD02 must be optimized for:

Desktop:

* width ≈ 900–950px max

Tablet:

* graceful scaling

Mobile:

* decorative frame details may simplify
* content remains readable
* embedded media stable

Do NOT optimize for:

* 1400–1800px cinematic layouts

Primary target:
Blogger content column.

⸻

8. Native HTML Content Support

Panels must support arbitrary HTML content inside content area.

Supported content:

* text
* images
* tables
* lists
* links
* embeds
* inline formatting
* blockquotes
* scientific notes
* helper sections

Architecture must NOT assume:

* fixed content type
* fixed height
* fixed media type

⸻

9. Media Architecture

HUD01/HUD02 must support:

A. Static image

<img class="nc-hud-float-image" ...>

⸻

B. Vertical embedded media

Examples:

* HeyGen
* TikTok Shorts
* YouTube Shorts

<div class="nc-hud-media nc-hud-media-vertical">
  <iframe ...></iframe>
</div>

⸻

C. Horizontal embedded media

Examples:

* YouTube
* Vimeo

<div class="nc-hud-media nc-hud-media-horizontal">
  <iframe ...></iframe>
</div>

⸻

10. Critical Layout Requirement

Panel height must automatically adapt to:

* text height
* image height
* video height

Whichever is larger defines total panel height.

No:

* clipped frames
* overflow bugs
* collapsing containers

This behavior is REQUIRED.

⸻

11. Animation Requirements

Preserve existing HUD01/HUD02 behavior.

Keep:

* contour glow
* line illumination
* lightweight motion effects
* ticker (if applicable)
* sweep effects

But:

* animations must remain Blogger-safe
* CSS-only preferred
* no heavy JS animation systems

⸻

12. Contour Sweep Architecture

HUD01/HUD02 are the FIRST candidates for:

* contour-only sweep
* line-travel glow
* SVG path illumination

Unlike HUD03:
HUD01/HUD02 geometry is already suitable for this.

Claude must:

* preserve contour-based architecture
* avoid blocking future SVG path animation
* document future integration points

Current pilot may still use simplified sweep implementation.

⸻

13. Blogger Compatibility Audit

Claude must verify:

* no CSS collisions with Blogger theme
* no global selector pollution
* all classes namespaced (nc-*)
* iframe responsiveness
* overflow behavior
* font rendering
* mobile stability

⸻

14. RSS / Fallback Compatibility

HUD01/HUD02 must degrade gracefully.

Required fallback behavior:

* content remains readable without effects
* text visible even if CSS stripped
* embeds degrade safely
* no broken layout in RSS readers

Document:

* what survives in RSS
* what is decorative-only
* how Blogger sanitization affects embeds

⸻

15. Required Deliverables

Claude must provide:

A. Production CSS

Clean reusable stylesheets.

⸻

B. Production HTML

Minimal Blogger-ready embed blocks.

⸻

C. Example Variants

Working examples for:

* image
* HeyGen vertical
* YouTube horizontal

for BOTH HUD01 and HUD02.

⸻

D. README

Clear deployment instructions:

* where CSS goes
* where HTML goes
* how to replace media
* how to tune animations
* how to disable effects
* how to switch media orientation

README assumes:
manual Blogger editing workflow.

⸻

16. Future Architecture Direction

This release is Phase 2.

Future phases:

* SVG-native HUD library
* contour-only animated sweeps
* reusable frame geometry system
* panel geometry presets
* infographic modules
* Observer Console integration

Current task:
ONLY stabilize and release HUD01/HUD02 for Blogger.

No redesigns.
No framework migration.
No unnecessary abstraction.

Priority:
reliable Blogger deployment with scalable vector-style HUD geometry.