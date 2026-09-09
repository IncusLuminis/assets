# NebulaCast HUD Panel — Blogger Pilot Release
## HUD-03 / HUD-04 · Version 1.0 · 2026-05-24

---

## Overview

This package lets you embed sci-fi HUD panels directly into Blogger posts.
Each panel renders with animated frame decorations, a scrolling ticker, and a
collapsible mini-card. The main content area supports any standard HTML — text,
images, and embedded video (HeyGen, YouTube, TikTok).

The release ships two panel styles from one CSS/JS base:

| Style | What goes inside |
|-------|-----------------|
| **HUD-03** | Text + static image |
| **HUD-04** | Text + embedded video (vertical or horizontal) |

---

## File Map

```
blogger-pilot-hud03/
│
├── blogger-hud03-template.css      ← paste into Blogger template ONCE
├── blogger-hud03-template.js       ← paste into Blogger template ONCE
├── blogger-hud03-post.html         ← base template for each new post
│
├── examples/
│   ├── image-version.html          ← ready-to-paste: text + static image
│   ├── heygen-version.html         ← ready-to-paste: HeyGen vertical video
│   ├── youtube-version.html        ← ready-to-paste: YouTube horizontal video
│   └── tiktok-version.html         ← ready-to-paste: TikTok vertical video
│
├── screenshots/                    ← (empty — add your own)
│
└── optional/
    └── blogger-template-snippet.txt ← combined <style>+<script> block for
                                        one-step Blogger template install
```

---

## Step 1 — Install global CSS and JS into Blogger (once)

> You do this **one time**. Every post reuses the same CSS and JS.

### Option A — One-step paste (recommended)

1. Open **`optional/blogger-template-snippet.txt`**
2. Copy the entire contents
3. Go to: Blogger → Theme → Edit HTML
4. Find the closing `</head>` tag
5. Paste the snippet **just before** `</head>`
6. Save

### Option B — Separate CSS and JS

**CSS:**
1. Open `blogger-hud03-template.css` — copy all
2. Wrap in `<style>` tags
3. Paste before `</head>` in Blogger's Edit HTML

**JS:**
1. Open `blogger-hud03-template.js` — copy all
2. Wrap in `<script>` tags
3. Paste just **before** `</body>` in Blogger's Edit HTML

---

## Step 2 — Create a post

1. Create a new Blogger post
2. Switch to **HTML mode** (not Compose)
3. Open one of the example files from `examples/` that matches your content type
4. Copy the entire contents
5. Paste into the post's HTML editor
6. Make your customisations (see below)
7. Publish

---

## Customisation Reference

Every post has six things to change:

| Placeholder | Replace with |
|-------------|-------------|
| `SYSTEM_LABEL` | Location label — e.g. `OUTPOST 42` |
| `CHARACTER_NAME` | Name displayed in the panel title and mini-card |
| `THUMB_URL` | Direct Blogger image URL for the mini-card thumbnail |
| `TICKER_TEXT / MORE TEXT / EVEN MORE /` | Scrolling data line (keep the slash separators) |
| Media block | See "Choosing a media type" below |
| `BODY_TEXT` / `<p>` content | Your post body — any HTML is supported |

---

## Choosing a Media Type

Pick **one** media block and delete the others from `nc-hp-text`.

### A — Static image (HUD-03 style)

```html
<img class="nc-hud-float-image"
     src="https://your-blogger-image-url.jpg"
     alt="Description">
```

Image floats left. Text wraps right. Use a portrait-orientation photo for best results.

---

### B — Vertical video (HeyGen / TikTok / YouTube Shorts)

```html
<div class="nc-hud-media nc-hud-media-vertical">
  <div class="nc-reconnect">RECONNECTING…</div>
  <iframe
    src="EMBED_URL"
    frameborder="0"
    allow="encrypted-media; fullscreen"
    allowfullscreen>
  </iframe>
</div>
```

Renders at 9:16 aspect ratio. Floats left; text wraps right.

**Embed URL formats:**
- HeyGen: `https://app.heygen.com/embeds/YOUR_ID`
- TikTok: `https://www.tiktok.com/embed/v2/VIDEO_ID`
- YouTube Shorts: `https://www.youtube.com/embed/VIDEO_ID`

---

### C — Horizontal video (YouTube / Vimeo)

```html
<div class="nc-hud-media nc-hud-media-horizontal">
  <div class="nc-reconnect">RECONNECTING…</div>
  <iframe
    src="https://www.youtube.com/embed/VIDEO_ID?rel=0&modestbranding=1"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
    allowfullscreen>
  </iframe>
</div>
```

Renders at 16:9 aspect ratio. Floats left; text wraps right.

---

## Hosting Images in Blogger

Images must be uploaded to Blogger itself — do **not** link to external hosts.

To get a direct Blogger image URL:
1. Upload image via the post editor (Insert → Image)
2. Click the image → click the chain-link icon to copy the URL
3. The URL will end in `/s1600/filename.jpg` — use that URL

For the thumbnail (`THUMB_URL` in the mini-card), a smaller version works fine:
change `/s1600/` to `/s200/` for a 200px-wide copy served by Blogger's CDN.

---

## Animations

All animations run via CSS — no JavaScript involved.

| Animation | CSS keyframe | Where to tune |
|-----------|-------------|---------------|
| Panel open sweep | `ncHpOpenHud` | `animation-duration` on `.nc-hp-panel` (default 1.2s) |
| Ambient glow pulse | `hudBreath` | `animation-duration` (default 5s) |
| Light-beam sweep | `hudPanelSweep` | `animation-duration` on `.nc-panel-sweep` (default 7s) |
| Ticker scroll | `hudTickerScroll` | `animation-duration` on `.nc-hp-frame-ticker span` (default 30s) |
| Loader segments | `ncHpLoader1–8` | `animation-duration` on `.nc-hp-frame-loader span` (default 6.2s) |

To **slow down** an animation, increase its duration.
To **disable** an animation, add `animation: none !important` to the relevant selector in a post-level `<style>` block.

---

## Disabling Frame Effects

To hide all decorative frame elements on a single post (e.g. for a lightweight mobile-first layout):

```html
<style>
  .nc-hp-frame-shell,
  .nc-hp-frame-inner,
  .nc-hp-frame-loader,
  .nc-hp-frame-topline,
  .nc-hp-frame-mask,
  .nc-hp-sweep { display: none !important; }
</style>
```

Paste this block anywhere in the post above your HUD widget div.
Frame elements are also hidden automatically at screen widths ≤ 900px.

---

## Collapse / Expand Toggle

Each panel starts collapsed to a 148px mini-card. A **▼ / ▲** button in the top-right corner toggles it. Clicking anywhere on the mini-card also expands the panel.

The toggle height and animation are controlled by the inline `<script>` at the bottom of each post's HTML:

```js
NcHudMini.init({
  widget      : widget,
  panel       : panel,
  miniH       : 148,       // collapsed height in px
  scale       : null,      // optional: scale factor when collapsed (null = no scaling)
  expandedMaxH: 2000       // max-height when expanded — increase for very long posts
});
```

- Increase `miniH` to show more of the panel in collapsed state.
- Increase `expandedMaxH` if your post is taller than 2000px and gets clipped when expanded.
- Set `scale: 0.5` to shrink the panel to 50% while collapsed (visual preview mode).

---

## Multiple Panels on One Page

You can paste as many HUD panels as you like into a single post or across multiple posts. Each panel's `<script>` uses `document.currentScript` to find its own widget — they never interfere with each other.

---

## Mobile Behaviour

At screen widths ≤ 900px:
- All decorative frame elements are hidden
- Padding is reduced
- Floated media becomes full-width block elements
- Text font size increases slightly for readability

No additional configuration needed.

---

## Switching Between HUD-03 and HUD-04

There is no separate CSS or JS for HUD-03 vs. HUD-04 — it is the same file.
The visual difference is determined entirely by what you put inside `.nc-hp-text`:

- Static image → HUD-03 appearance (image + text layout)
- Video embed → HUD-04 appearance (video + text layout)

---

## Architecture Notes for Developers

- All class names are prefixed `nc-hp-*` (panel internals) or `nc-hud-*` (public media API). No global resets, no `:root` overrides. Safe to deploy alongside any Blogger theme.
- The sweep beam (`nc-panel-sweep`) uses a CSS `background: linear-gradient` inside a rotated `div`. Future versions may replace this with an SVG contour runner travelling along the frame border — the architecture does not prevent this migration (see `§10` of the release spec).
- Google Fonts (`Share Tech Mono`) is loaded via `@import` in the CSS. If the font is blocked (intranet / offline), all text falls back to `monospace`.
- `NcHudMini` is a standalone IIFE module — no dependencies. It exposes `window.NcHudMini = { init }`.

---

## Quick Checklist — Deploying a New Post

- [ ] CSS and JS are already in the Blogger template
- [ ] Copied an example file that matches the content type
- [ ] Replaced `SYSTEM_LABEL` in both locations (mini-card + panel content)
- [ ] Replaced `CHARACTER_NAME` in both locations
- [ ] Replaced `THUMB_URL` with a real Blogger-hosted image URL
- [ ] Replaced ticker text
- [ ] Replaced media placeholder with actual embed URL or image URL
- [ ] Replaced body text
- [ ] Checked that `expandedMaxH` is large enough for post height
- [ ] Previewed on mobile (≤ 900px) before publishing
