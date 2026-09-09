# Blogger Embed Guide

How to embed NebulaCast HUD widgets into Blogger posts once widgets are hosted on Cloudflare.

---

## Architecture overview

```
Cloudflare Pages
  └── widgets/
        ├── shared/          ← served as static assets
        └── panels/
              └── <widget>/
                    └── index.html   ← iframe src
```

Blogger posts embed widgets via `<iframe>` pointing to the Cloudflare-hosted `index.html`.

---

## Basic embed snippet

Paste into a Blogger post's HTML editor:

```html
<iframe
  src="https://hud.nebulacast.com/panels/status-card/index.html"
  width="320"
  height="240"
  style="border:none; background:#020d14; border-radius:4px;"
  loading="lazy"
  title="Status Card HUD Widget">
</iframe>
```

Replace `status-card` with any widget slug from `panels/`.

---

## Responsive embed

Wrap in a container for fluid width:

```html
<div style="position:relative; width:100%; padding-bottom:56.25%; height:0; overflow:hidden;">
  <iframe
    src="https://hud.nebulacast.com/panels/asymmetric-panel/index.html"
    style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;"
    loading="lazy"
    title="Asymmetric Panel HUD Widget">
  </iframe>
</div>
```

---

## Cloudflare deployment checklist

- [ ] Connect GitHub repo to Cloudflare Pages.
- [ ] Set build output directory to `widgets/`.
- [ ] No build command needed — pure static files.
- [ ] Set custom domain: `hud.nebulacast.com`.
- [ ] Verify `Content-Security-Policy` headers allow iframe embedding from `nebulacast.com`.
- [ ] Add `X-Frame-Options: ALLOWALL` or `Content-Security-Policy: frame-ancestors 'self' *.nebulacast.com *.blogspot.com` in Cloudflare Pages headers config (`_headers` file).

---

## _headers file (place in widgets/ root)

```
/*
  X-Frame-Options: ALLOWALL
  Content-Security-Policy: frame-ancestors 'self' https://*.nebulacast.com https://*.blogspot.com
```

---

## Testing locally before deploy

```bash
python3 -m http.server 8080 --directory /path/to/HUD/widgets
# Open http://localhost:8080/playground/ to preview all widgets
```
