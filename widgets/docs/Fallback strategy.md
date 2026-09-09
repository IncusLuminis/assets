# NebulaCast HUD Panels — Fallback & Unhappy Path Specification
## Goal
HUD panels are visual enhancement layers. Essential content must remain accessible when advanced features fail, are blocked, or are stripped by the target environment.
This document defines fallback behavior for:
- external media failure
- Aladin / data API failure
- mobile narrow columns
- RSS readers
- disabled CSS / JS
- blocked iframes
- slow networks
- reduced-motion users
Apply this after the first Blogger pilot release.
---
## 1. Core Principle
Every HUD panel must have two layers:
1. Enhanced HUD presentation  
   Full sci-fi frame, animation, media, iframe, SVG, loaders, tickers.
2. Plain fallback content  
   Readable title, image, summary, and link.
The user must never lose the meaning of the post if HUD effects fail.
---
## 2. RSS Fallback
### Problem
RSS readers often strip:
- CSS
- JS
- iframe
- SVG
- advanced HTML
- animations
### Requirement
Every HUD block must be followed by a plain fallback block.
```html
<div class="nc-rss-fallback">
  <h2>Командор Келлан</h2>
  <img src="BLOGGER_IMAGE_URL" alt="Командор Келлан">
  <p>Краткое содержание материала обычным HTML.</p>
  <p>
    <a href="POST_URL">Открыть полную версию с HUD-панелью</a>
  </p>
</div>

On the website:

.nc-rss-fallback {
  display: none;
}

Rule

Do not put the only copy of essential text inside an iframe, SVG, canvas, or JS-rendered block.

⸻

3. Mobile Narrow Column Fallback

Problem

Blogger mobile layout may reduce post width to 320–430px. Horizontal HUD panels may become unreadable.

Requirement

At narrow widths, panels must degrade into a simple vertical layout.

Breakpoint:

@media (max-width: 540px) {
  ...
}

Mobile behavior:

* hide complex frame geometry if needed
* hide ticker if it hurts readability
* hide or simplify loader
* media becomes full-width
* text follows below media
* no horizontal overflow
* no internal scrollbars

Required CSS pattern

@media (max-width: 540px) {
  .nc-hud-widget {
    width: 100%;
    overflow: hidden;
  }
  .nc-hud-frame,
  .nc-frame-ticker,
  .nc-frame-loader {
    display: none;
  }
  .nc-hud-media {
    float: none;
    width: 100%;
    max-width: none;
    margin: 0 0 20px 0;
  }
  .nc-hud-text {
    text-align: left;
  }
}

⸻

4. External Video / Iframe Failure

Problem

HeyGen, YouTube, TikTok, or browser privacy settings may block iframe embeds.

Requirement

Every video block must include fallback text and a direct link.

<div class="nc-hud-media nc-hud-media-vertical">
  <iframe src="..." allowfullscreen></iframe>
</div>
<p class="nc-media-fallback">
  Видео может не загрузиться. 
  <a href="VIDEO_URL">Открыть видео напрямую</a>.
</p>

On enhanced site:

.nc-media-fallback {
  font-size: 12px;
  opacity: .65;
}

Optional later:

* JS may hide fallback after iframe load.

⸻

5. Image Failure

Problem

Blogger image URLs may change, expire, or fail to load.

Requirement

All images must have meaningful alt.

<img
  src="BLOGGER_IMAGE_URL"
  alt="Портрет Командора Келлана"
>

If using media wrapper, provide fallback background and keep layout stable.

.nc-hud-media {
  background:
    linear-gradient(135deg, rgba(0,40,60,.4), rgba(0,0,0,.9));
}

⸻

6. Aladin Lite Failure

Applies to HUD01 / HUD02 only.

Problem

Aladin CDN, SIMBAD target resolution, or browser restrictions may fail.

Requirement

HUD01/02 must always keep a static image fallback.

Behavior:

* default view shows static image
* Aladin loads only on user action
* if Aladin fails, static image remains visible
* show small status message

Example:

<div class="nc-aladin-fallback">
  Sky viewer unavailable. Static object image shown.
</div>

Acceptance criteria

No blank left panel if Aladin fails.

⸻

7. VO / SIMBAD / VizieR / ADS Failure

Applies to HUD01 / HUD02 only.

Problem

Public astronomical services may be slow, unavailable, rate-limited, or CORS-blocked.

Requirement

Each data tab must have static fallback content.

DATA tab:

* show manually provided object facts if API fails

PAPERS tab:

* show “References unavailable” and link to search query

CATALOGS tab:

* show “Catalog lookup unavailable”

Example:

<div class="nc-api-fallback">
  External catalog data is temporarily unavailable.
</div>

Rule

External data must enhance the panel, not be required to render it.

⸻

8. CSS Disabled / Stripped

Problem

RSS readers or strict clients may strip CSS.

Requirement

HTML order must remain readable without CSS.

Recommended content order:

1. system label
2. title
3. image/video fallback link
4. text
5. source/full-post link

Avoid relying on CSS order for meaning.

⸻

9. JS Disabled

Problem

Blogger may allow JS in template, but clients may block it.

Requirement

Core HUD03/04 pilot must work without JS.

JS may only enhance:

* iframe load state
* contour animation
* lazy loading
* mini/expand behavior

No essential text or media should require JS to appear.

⸻

10. Reduced Motion

Problem

Some users prefer reduced motion. Heavy HUD effects can also hurt mobile performance.

Requirement

Respect:

@media (prefers-reduced-motion: reduce) {
  .nc-hud-widget *,
  .nc-hud-widget *::before,
  .nc-hud-widget *::after {
    animation: none !important;
    transition: none !important;
  }
}

⸻

11. Slow Network

Problem

Fonts, images, iframes, or external APIs may load slowly.

Requirement

Panel must render readable text immediately.

Rules:

* do not block text on media load
* do not block layout on iframe load
* use fallback font stack
* use stable aspect-ratio boxes for media

⸻

12. Blogger Theme Collision

Problem

Blogger themes may inject global styles.

Requirement

All HUD classes must be namespaced:

nc-*

Avoid:

* global img
* global iframe
* global p
* global h2
* global body
* global reset inside post CSS

All selectors must be scoped under root:

.nc-hud-widget ...

⸻

13. Manual QA Matrix

Test each release with:

* Desktop Blogger column: ~927px
* Tablet: ~760px
* Mobile: 390px
* CSS animations enabled
* reduced-motion enabled
* iframe blocked
* image broken URL
* long Russian text
* RSS preview / feed reader
* no JS

⸻

14. Release Acceptance Criteria

A HUD release is acceptable only if:

* post remains readable without HUD effects
* mobile version has no horizontal scrolling
* RSS fallback is visible in RSS readers
* site hides RSS fallback correctly
* iframe failure does not create blank content
* image failure does not destroy layout
* external API failure does not break HUD01/02
* JS is optional for HUD03/04
* Blogger theme is not affected outside HUD block

