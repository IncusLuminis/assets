import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { test, expect } from "@playwright/test";

/**
 * Issue #13 AC / Contract §15.3 "validated, not assumed": empirically
 * verifies, in a real headless Chromium (not jsdom -- see
 * `docs/adr/0003-css-renderer-isolation.md` for why jsdom cannot answer
 * this), that HUD-04's *own* CSS mechanisms -- `clip-path` (frame-shell /
 * frame-inner / mini-card cut corners), `filter: drop-shadow()` (frame
 * glow), `transform: skewX()` (the frame-loader's skewed segments),
 * `transform: scale()` (the mini-card's scaled-down video preview,
 * Inventory §1.34) and `float: left` (media/text wrap) -- all survive
 * `CssRenderer`'s Shadow DOM mount, and that the `mediaEmbed` `src-swap`
 * lifecycle (which drives the RECONNECTING… overlay, Contract §10.5) behaves
 * exactly as the real `widgets/panels/hud-04/hud-04.css:608-635` mechanism:
 * CSS keyed off `iframe[src="about:blank"]`, not a fabricated `load` event
 * (README "Correction to the issue's / audit's ... claim").
 *
 * `CssRenderer.ts` is bundled directly with esbuild, mirroring
 * `tests/e2e/css-renderer.spec.ts` (#10) exactly -- this Story does not
 * touch that file.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const themeDir = path.join(repoRoot, "library", "themes", "hud-04");
const THEME_ORIGIN = "https://hud-04.test";
const MEDIA_SRC = "https://app.heygen.com/embeds/21a8ec0238bb4e54a153374163cb059f";

async function bundleCssRenderer(): Promise<string> {
  const result = await build({
    entryPoints: [path.join(repoRoot, "src", "runtime", "renderers", "CssRenderer.ts")],
    bundle: true,
    format: "iife",
    globalName: "HudCssRendererModule",
    platform: "browser",
    target: "es2022",
    write: false
  });
  const file = result.outputFiles[0];
  if (!file) throw new Error("esbuild produced no output for CssRenderer.ts");
  return file.text;
}

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".css")) return "text/css";
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

test.describe("CssRenderer -- real browser (Playwright): hud-04", () => {
  test("maxi: mount -> setData -> mediaEmbed live -> destroy: Shadow DOM held, clip-path/drop-shadow/skewX/float survive, host page unaffected", async ({
    page
  }) => {
    const bundle = await bundleCssRenderer();
    const manifest = JSON.parse(fs.readFileSync(path.join(themeDir, "manifest.json"), "utf8"));

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(String(err)));

    await page.route(`${THEME_ORIGIN}/**`, async (route) => {
      const url = new URL(route.request().url());
      const relPath = decodeURIComponent(url.pathname.replace(/^\//, ""));
      const filePath = path.join(themeDir, relPath);
      if (!fs.existsSync(filePath)) {
        await route.fulfill({ status: 404, body: "not found" });
        return;
      }
      await route.fulfill({ status: 200, contentType: contentTypeFor(filePath), body: fs.readFileSync(filePath) });
    });
    // capabilities.mediaEmbed declares the real HeyGen host (Contract §16.2) --
    // fulfilled locally so this test never makes a real third-party network call.
    await page.route("https://app.heygen.com/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>hud-04 media stub</title>" });
    });

    await page.goto("about:blank");
    await page.addScriptTag({ content: bundle });

    const result = await page.evaluate(
      async ({ manifest, assetBaseUrl, mediaSrc }) => {
        // @ts-expect-error -- injected by the esbuild IIFE bundle above
        const { CssRenderer } = window.HudCssRendererModule;

        document.body.style.margin = "0";
        document.body.style.backgroundColor = "rgb(10, 20, 30)";
        const hostMarker = document.createElement("div");
        hostMarker.id = "host-marker";
        hostMarker.style.color = "rgb(1, 2, 3)";
        hostMarker.textContent = "host content, unrelated to the Theme";
        document.body.appendChild(hostMarker);

        const container = document.createElement("div");
        container.style.width = "1200px";
        container.style.height = "1000px";
        document.body.appendChild(container);

        const renderer = new CssRenderer();
        const context = {
          theme: "hud-04",
          version: "1.0.0",
          variant: "maxi",
          orientation: "landscape",
          manifest,
          baseVersion: "1.0.0",
          assetBaseUrl
        };

        const setAllSlots = () =>
          renderer.setData({
            title: "КОМАНДОР КЕЛЛАН",
            subtitle: "OUTPOST 32",
            content: "<p>Body copy wrapping the floated media block.</p>",
            footer: "JWST / PROTOPLANETARY DISK SURVEY",
            media: mediaSrc
          });

        await renderer.mount(container, context);
        setAllSlots();

        const shadow = container.shadowRoot;
        const frameShell = shadow?.querySelector(".nc-hp-frame-shell");
        const frameLoaderSpan = shadow?.querySelector(".nc-hp-frame-loader span");
        const media = shadow?.querySelector('[data-slot="media"]');
        const iframeMaxi = shadow?.querySelector('[data-slot="media"] iframe');

        const frameShellStyle = frameShell ? getComputedStyle(frameShell) : undefined;
        const loaderStyle = frameLoaderSpan ? getComputedStyle(frameLoaderSpan.closest(".nc-hp-frame-loader")) : undefined;
        const mediaStyle = media ? getComputedStyle(media) : undefined;

        const clipPath = frameShellStyle?.clipPath ?? null;
        const filter = frameShellStyle?.filter ?? null;
        const loaderTransform = loaderStyle?.transform ?? null;
        const mediaFloat = mediaStyle?.float ?? null;
        const iframeSrcAtMaxi = iframeMaxi instanceof HTMLIFrameElement ? iframeMaxi.src : null;
        const iframeOpacityAtMaxi = iframeMaxi ? getComputedStyle(iframeMaxi).opacity : null;

        // Switch to mini -- verifies setVariant + the mini-card's scale() transform
        // on its scaled-down video preview (Inventory §1.34).
        await renderer.setVariant("mini");
        setAllSlots();
        const miniVideoIframe = shadow?.querySelector(".nc-hp-mini-video-wrap iframe");
        const miniIframeStyle = miniVideoIframe ? getComputedStyle(miniVideoIframe) : undefined;
        const miniIframeTransform = miniIframeStyle?.transform ?? null;
        const miniIframeSrc = miniVideoIframe instanceof HTMLIFrameElement ? miniVideoIframe.src : null;

        await renderer.setVariant("maxi");
        setAllSlots();
        const iframeAfterBackToMaxi = shadow?.querySelector('[data-slot="media"] iframe');
        const iframeSrcBackAtMaxi = iframeAfterBackToMaxi instanceof HTMLIFrameElement ? iframeAfterBackToMaxi.src : null;

        const bodyBgBefore = getComputedStyle(document.body).backgroundColor;
        const markerColorBefore = getComputedStyle(hostMarker).color;
        const horizontalOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
        const verticalOverflow = document.documentElement.scrollHeight > document.documentElement.clientHeight;
        const isolationOutcome = renderer.isolationOutcome;
        const hadShadowRoot = !!shadow;

        renderer.destroy();

        const bodyBgAfter = getComputedStyle(document.body).backgroundColor;
        const markerColorAfter = getComputedStyle(hostMarker).color;

        return {
          isolationOutcome,
          hadShadowRoot,
          clipPath,
          filter,
          loaderTransform,
          mediaFloat,
          iframeSrcAtMaxi,
          iframeOpacityAtMaxi,
          miniIframeTransform,
          miniIframeSrc,
          iframeSrcBackAtMaxi,
          horizontalOverflow,
          verticalOverflow,
          bodyBgBefore,
          markerColorBefore,
          bodyBgAfter,
          markerColorAfter,
          containerChildrenAfterDestroy: container.children.length,
          shadowChildrenAfterDestroy: container.shadowRoot ? container.shadowRoot.children.length : 0
        };
      },
      { manifest, assetBaseUrl: `${THEME_ORIGIN}/`, mediaSrc: MEDIA_SRC }
    );

    expect(consoleErrors, `unexpected console/page errors:\n${consoleErrors.join("\n")}`).toEqual([]);

    // Isolation: Shadow DOM attempted and kept -- "validated, not assumed" for hud-04's own CSS.
    expect(result.isolationOutcome).toBe("shadow-dom");
    expect(result.hadShadowRoot).toBe(true);
    expect(result.clipPath).not.toBe("none");
    expect(result.filter).toContain("drop-shadow");
    expect(result.loaderTransform).not.toBe("none"); // skewX() on .nc-hp-frame-loader
    expect(result.mediaFloat).toBe("left");
    expect(result.miniIframeTransform).not.toBe("none"); // scale() on the mini-card video preview

    // mediaEmbed / RECONNECTING… overlay (Contract §10.5, README "mediaEmbed wiring"):
    // live src + full opacity at maxi ...
    expect(result.iframeSrcAtMaxi).toBe(MEDIA_SRC);
    expect(result.iframeOpacityAtMaxi).toBe("1");
    // ... parked at mini (the mini-card's own preview iframe is a *separate*
    // element from the main media slot and is independently src-swapped too) ...
    expect(result.miniIframeSrc).toBe("about:blank");
    // ... and restored again back at maxi.
    expect(result.iframeSrcBackAtMaxi).toBe(MEDIA_SRC);

    // No overflow: overflowVisible:true decoration must not introduce a page scrollbar.
    expect(result.horizontalOverflow).toBe(false);
    expect(result.verticalOverflow).toBe(false);

    // No leak: distinctive host styles, set before mount, are byte-identical after mount+interaction and after destroy().
    expect(result.bodyBgBefore).toBe("rgb(10, 20, 30)");
    expect(result.markerColorBefore).toBe("rgb(1, 2, 3)");
    expect(result.bodyBgAfter).toBe(result.bodyBgBefore);
    expect(result.markerColorAfter).toBe(result.markerColorBefore);

    // No leaked DOM: destroy() emptied both the light-DOM container and the shadow root.
    expect(result.containerChildrenAfterDestroy).toBe(0);
    expect(result.shadowChildrenAfterDestroy).toBe(0);
  });

  test("RECONNECTING… overlay: pure CSS iframe[src=\"about:blank\"] mechanism, not a load-event listener (README correction)", async ({
    page
  }) => {
    const bundle = await bundleCssRenderer();
    const manifest = JSON.parse(fs.readFileSync(path.join(themeDir, "manifest.json"), "utf8"));

    await page.route(`${THEME_ORIGIN}/**`, async (route) => {
      const url = new URL(route.request().url());
      const relPath = decodeURIComponent(url.pathname.replace(/^\//, ""));
      const filePath = path.join(themeDir, relPath);
      if (!fs.existsSync(filePath)) {
        await route.fulfill({ status: 404, body: "not found" });
        return;
      }
      await route.fulfill({ status: 200, contentType: contentTypeFor(filePath), body: fs.readFileSync(filePath) });
    });
    await page.route("https://app.heygen.com/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>hud-04 media stub</title>" });
    });

    await page.goto("about:blank");
    await page.addScriptTag({ content: bundle });

    const result = await page.evaluate(
      async ({ manifest, assetBaseUrl, mediaSrc }) => {
        // @ts-expect-error -- injected by the esbuild IIFE bundle above
        const { CssRenderer } = window.HudCssRendererModule;

        // maxi/landscape instance -- checks the "live" (opacity 1, real src) state.
        const containerMaxi = document.createElement("div");
        document.body.appendChild(containerMaxi);
        const rendererMaxi = new CssRenderer();
        await rendererMaxi.mount(containerMaxi, {
          theme: "hud-04",
          version: "1.0.0",
          variant: "maxi",
          orientation: "landscape",
          manifest,
          baseVersion: "1.0.0",
          assetBaseUrl
        });
        rendererMaxi.setData({ title: "x", media: mediaSrc });

        const shadowMaxi = containerMaxi.shadowRoot;
        const reconnect = shadowMaxi?.querySelector(".nc-reconnect");
        const iframeMaxi = shadowMaxi?.querySelector('[data-slot="media"] iframe');

        // At maxi: iframe has the real src, and CSS hides nothing (opacity 1) --
        // the RECONNECTING label sits behind it (z-index 0 vs iframe's z-index 1).
        const iframeOpacityAtMaxi = iframeMaxi ? getComputedStyle(iframeMaxi).opacity : null;
        const reconnectZIndexAtMaxi = reconnect ? getComputedStyle(reconnect).zIndex : null;
        const iframeZIndexAtMaxi = iframeMaxi ? getComputedStyle(iframeMaxi).zIndex : null;

        rendererMaxi.destroy();

        // micro/portrait instance, mounted directly (Contract §14.4: orientation
        // changes are not a 1.0 setVariant() capability -- a fresh instance is
        // required) -- checks the "parked" (opacity 0, about:blank) state.
        const containerMicro = document.createElement("div");
        document.body.appendChild(containerMicro);
        const rendererMicro = new CssRenderer();
        await rendererMicro.mount(containerMicro, {
          theme: "hud-04",
          version: "1.0.0",
          variant: "micro",
          orientation: "portrait",
          manifest,
          baseVersion: "1.0.0",
          assetBaseUrl
        });
        rendererMicro.setData({ title: "x", media: mediaSrc });
        const iframeMicro = containerMicro.shadowRoot?.querySelector('[data-slot="media"] iframe');
        const iframeSrcAtMicro = iframeMicro instanceof HTMLIFrameElement ? iframeMicro.src : null;
        const iframeOpacityAtMicro = iframeMicro ? getComputedStyle(iframeMicro).opacity : null;

        rendererMicro.destroy();

        return {
          reconnectFound: !!reconnect,
          iframeOpacityAtMaxi,
          reconnectZIndexAtMaxi,
          iframeZIndexAtMaxi,
          iframeSrcAtMicro,
          iframeOpacityAtMicro
        };
      },
      { manifest, assetBaseUrl: `${THEME_ORIGIN}/`, mediaSrc: MEDIA_SRC }
    );

    expect(result.reconnectFound).toBe(true);
    // maxi: real src, full opacity, iframe stacked above the reconnect label.
    expect(result.iframeOpacityAtMaxi).toBe("1");
    expect(Number(result.iframeZIndexAtMaxi)).toBeGreaterThan(Number(result.reconnectZIndexAtMaxi));
    // micro: parked at about:blank -- the CSS `iframe[src="about:blank"] { opacity: 0 }`
    // rule (ported verbatim from hud-04.css:633-635) lets RECONNECTING… show through.
    expect(result.iframeSrcAtMicro).toBe("about:blank");
    expect(result.iframeOpacityAtMicro).toBe("0");
  });
});
