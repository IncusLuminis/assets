# Blogger Pilot Release — HUD03
## Release Specification for Claude
Goal:
Prepare a production-ready pilot release of HUD03 for deployment inside Blogger posts.
This is NOT a framework task.
This is a static HTML/CSS deployment task optimized specifically for Blogger limitations.
---
# 1. Target Environment
Platform:
- Blogger (Blogspot)
Known constraints:
- Main content column width is approximately 900–950px on desktop.
- Layout uses:
  - ~2/3 main content column
  - ~1/3 sidebar
- Panels are embedded directly inside Blogger posts.
- Blogger template allows adding global CSS.
- Post body allows raw HTML embedding.
- External JS/CDN dependencies should be avoided whenever possible.
- Media:
  - images are hosted inside Blogger
  - videos are embedded via iframe (HeyGen / YouTube / TikTok)
Important:
HUD panels must remain stable inside Blogger rendering engine.
---
# 2. Current Architecture
HUD03 already exists as:
- static HTML
- static CSS
- no framework
- no build pipeline
The architecture MUST remain:
- static
- portable
- copy-paste deployable
No:
- React
- Vue
- npm
- webpack
- runtime dependencies
---
# 3. Release Objective
Prepare the first deployable Blogger release:
/releases/blogger-pilot-hud03/
This folder becomes the canonical deployment artifact for future HUD panels.
---
# 4. Required Release Structure
Create:
/releases/blogger-pilot-hud03/
│
├── blogger-hud03-template.css
├── blogger-hud03-post.html
├── BLOGGER_PILOT_README.md
│
├── examples/
│   ├── image-version.html
│   ├── heygen-version.html
│   ├── youtube-version.html
│   └── tiktok-version.html
│
├── screenshots/
│   ├── desktop.png
│   └── mobile.png
│
└── optional/
    └── blogger-template-snippet.txt
---
# 5. Deployment Model
## Global CSS
All reusable CSS should be extracted into:
blogger-hud03-template.css
This file is intended for:
Blogger → Theme → Edit HTML
Claude must:
- isolate reusable CSS
- remove duplicated CSS
- preserve all visual behavior
---
## Post HTML
blogger-hud03-post.html must contain:
- only required HTML markup
- minimal inline CSS
- no duplicated framework code
User workflow must become:
1. Put CSS into Blogger template once
2. Paste panel HTML into posts
---
# 6. Responsive Constraints
HUD03 must be optimized for:
Desktop:
- width ≈ 900–950px max
Tablet:
- graceful scaling
Mobile:
- all decorative frame elements hidden if needed
- content readable
- embedded media stable
Do NOT optimize for:
- 1200–1600px cinematic layouts
The Blogger column width is the primary target.
---
# 7. Media Architecture
HUD03 must support all of the following INSIDE the same content block:
## A. Static image
Example:
```html
<img class="nc-hud-float-image" ...>

⸻

B. Vertical embedded media

Examples:

* HeyGen
* TikTok Shorts
* YouTube Shorts

Example wrapper:

<div class="nc-hud-media nc-hud-media-vertical">
  <iframe ...></iframe>
</div>

⸻

C. Horizontal embedded media

Examples:

* YouTube
* Vimeo

Example wrapper:

<div class="nc-hud-media nc-hud-media-horizontal">
  <iframe ...></iframe>
</div>

⸻

8. Critical Layout Requirement

Panel height must automatically adapt to:

* text height
* image height
* video height

Whichever is larger must define the panel height.

No:

* clipped frames
* overflow bugs
* collapsing containers

Current architecture already partially supports this.
Claude must preserve and stabilize it.

⸻

9. Animation Requirements

Preserve existing HUD03 behavior:

Keep:

* loader animation
* ticker
* frame glow
* panel sweep
* animated segments

But:

Animations must remain lightweight enough for Blogger.

No heavy JS animation systems.

CSS-only preferred.

⸻

10. Sweep Optimization Task

Current sweep illuminates background area.

Future objective:
Sweep/glow should travel ONLY along frame contours.

For HUD03 pilot:

* current sweep may remain temporarily
* BUT architecture should allow future SVG-path glow implementation

Claude should:

* document where contour-based sweep can later be integrated
* avoid architecture that blocks future SVG conversion

⸻

11. Blogger Compatibility Audit

Claude must verify:

* no CSS collisions with Blogger theme
* no global selector pollution
* all classes safely namespaced (nc-*)
* iframe responsiveness
* overflow behavior
* font rendering
* mobile stability

⸻

12. Required Deliverables

Claude must provide:

A. Production CSS

Clean reusable stylesheet.

⸻

B. Production HTML

Minimal Blogger-ready embed block.

⸻

C. Example Variants

Working examples for:

* image
* HeyGen vertical
* YouTube horizontal
* TikTok

⸻

D. README

Clear deployment instructions:

* where CSS goes
* where HTML goes
* how to replace media
* how to tune animations
* how to disable effects
* how to switch vertical/horizontal media

README should assume:
user is manually editing Blogger.

⸻

13. Future Architecture Direction

This release is Phase 1.

Future phases:

* SVG-native HUD panels
* contour-only glow sweep
* reusable HUD component library
* multiple panel geometries
* infographic layouts
* Observer Console integration

Current task:
ONLY stabilize and release HUD03 for Blogger.

No redesigns.
No framework migration.
No unnecessary abstraction.

Priority:
reliable deployment inside Blogger.