import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { test, expect } from "@playwright/test";

/**
 * Issue #15 AC / Contract §15.3 "validated, not assumed": empirically
 * verifies, in a real headless Chromium (not jsdom -- see
 * `docs/adr/0003-css-renderer-isolation.md` for why jsdom cannot answer
 * this), that HUD-03's *own* CSS mechanisms -- `clip-path` (frame-shell /
 * frame-inner / mini-card cut corners), `filter: drop-shadow()` (frame
 * glow), `transform: skewX(...)` (the frame-loader's skewed segments) and
 * `float: left` (image/text wrap) -- all survive `CssRenderer`'s Shadow DOM
 * mount. This package shares its frame CSS with `library/themes/hud-04/`
 * (#13), which already confirmed Shadow DOM holds for that shared
 * foundation -- but the assignment explicitly calls for **re-verifying**,
 * not assuming identical, for HUD-03's own specific composition (in
 * particular its plain `<img data-slot="media">` element, which HUD-04 does
 * not have -- HUD-04's media slot is an iframe wrapper).
 *
 * `CssRenderer.ts` is bundled directly with esbuild, mirroring
 * `tests/e2e/css-renderer-hud-04.spec.ts` (#13) exactly -- this Story does
 * not touch that file.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const themeDir = path.join(repoRoot, "library", "themes", "hud-03");
const THEME_ORIGIN = "https://hud-03.test";
const IMAGE_SRC = "https://example.com/blogger-hosted/akemi-portrait.jpg";

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

/**
 * styles/shared.css `@import`s the real source's Google Font verbatim
 * (README "Behavioral diffs" item 5, Contract §16.3 `external-io-on-mount`).
 * Stub both hosts so this suite never makes a real network call to them.
 */
async function stubGoogleFonts(page: import("@playwright/test").Page): Promise<void> {
  await page.route("https://fonts.googleapis.com/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "text/css", body: "/* stubbed -- no real font fetch in tests */" });
  });
  await page.route("https://fonts.gstatic.com/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "font/woff2", body: Buffer.from([]) });
  });
}

/** The `media` slot's <img> points at a real-looking but non-existent host -- stub it locally so no real network call is ever made. */
async function stubMediaImage(page: import("@playwright/test").Page): Promise<void> {
  const onePxPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
  );
  await page.route("https://example.com/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "image/png", body: onePxPng });
  });
}

test.describe("CssRenderer -- real browser (Playwright): hud-03", () => {
  test("maxi: mount -> setData -> destroy: Shadow DOM held, clip-path/drop-shadow/skewX/float survive, plain <img> media resolves, host page unaffected", async ({
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
    await stubMediaImage(page);
    await stubGoogleFonts(page);

    await page.goto("about:blank");
    await page.addScriptTag({ content: bundle });

    const result = await page.evaluate(
      async ({ manifest, assetBaseUrl, imageSrc }) => {
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
          theme: "hud-03",
          version: "1.0.0",
          variant: "maxi",
          orientation: "landscape",
          manifest,
          baseVersion: "1.0.0",
          assetBaseUrl
        };

        const setAllSlots = () =>
          renderer.setData({
            title: "АКЕМИ ХАНА",
            subtitle: "OUTPOST 42",
            content: "<p>Body copy wrapping the floated image.</p>",
            footer: "SECTOR 7-GAMMA / CLEARANCE LEVEL ALPHA",
            media: imageSrc
          });

        await renderer.mount(container, context);
        setAllSlots();

        const shadow = container.shadowRoot;
        const frameShell = shadow?.querySelector(".nc-hp-frame-shell");
        const frameLoader = shadow?.querySelector(".nc-hp-frame-loader");
        const media = shadow?.querySelector('[data-slot="media"]');

        const frameShellStyle = frameShell ? getComputedStyle(frameShell) : undefined;
        const loaderStyle = frameLoader ? getComputedStyle(frameLoader) : undefined;
        const mediaStyle = media ? getComputedStyle(media) : undefined;

        const clipPath = frameShellStyle?.clipPath ?? null;
        const filter = frameShellStyle?.filter ?? null;
        const loaderTransform = loaderStyle?.transform ?? null;
        const mediaFloat = mediaStyle?.float ?? null;
        const mediaTagName = media?.tagName ?? null;
        const mediaSrcResolved = media instanceof HTMLImageElement ? media.src : null;

        // Switch to mini -- verifies setVariant + the real .nc-hp-mini-card
        // structure + its own plain-<img> media slot (Inventory §1.26).
        await renderer.setVariant("mini");
        setAllSlots();
        const miniCard = shadow?.querySelector(".nc-hp-mini-card");
        const miniCardStyle = miniCard ? getComputedStyle(miniCard, "::before") : undefined;
        const miniCardClipPath = miniCardStyle?.clipPath ?? null;
        const miniThumb = shadow?.querySelector(".nc-hp-mini-thumb");
        const miniThumbSrc = miniThumb instanceof HTMLImageElement ? miniThumb.src : null;

        await renderer.setVariant("maxi");
        setAllSlots();
        const mediaAfterBackToMaxi = shadow?.querySelector('[data-slot="media"]');
        const mediaSrcBackAtMaxi = mediaAfterBackToMaxi instanceof HTMLImageElement ? mediaAfterBackToMaxi.src : null;

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
          mediaTagName,
          mediaSrcResolved,
          miniCardClipPath,
          miniThumbSrc,
          mediaSrcBackAtMaxi,
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
      { manifest, assetBaseUrl: `${THEME_ORIGIN}/`, imageSrc: IMAGE_SRC }
    );

    expect(consoleErrors, `unexpected console/page errors:\n${consoleErrors.join("\n")}`).toEqual([]);

    // Isolation: Shadow DOM attempted and kept -- "validated, not assumed" for hud-03's own CSS.
    expect(result.isolationOutcome).toBe("shadow-dom");
    expect(result.hadShadowRoot).toBe(true);
    expect(result.clipPath).not.toBe("none");
    expect(result.filter).toContain("drop-shadow");
    expect(result.loaderTransform).not.toBe("none"); // skewX() on .nc-hp-frame-loader
    expect(result.mediaFloat).toBe("left");
    expect(result.mediaTagName).toBe("IMG"); // plain <img>, no mediaEmbed iframe
    expect(result.mediaSrcResolved).toBe(IMAGE_SRC);
    expect(result.miniCardClipPath).not.toBe("none"); // the mini-card's own ::before clip-path cut corner
    expect(result.miniThumbSrc).toBe(IMAGE_SRC);
    expect(result.mediaSrcBackAtMaxi).toBe(IMAGE_SRC);

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

  test("micro:portrait mounts the reduced reflow composition with clip-path frame decoration hidden and image stacked full-width", async ({
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
    await stubMediaImage(page);
    await stubGoogleFonts(page);

    await page.goto("about:blank");
    await page.addScriptTag({ content: bundle });

    const result = await page.evaluate(
      async ({ manifest, assetBaseUrl, imageSrc }) => {
        // @ts-expect-error -- injected by the esbuild IIFE bundle above
        const { CssRenderer } = window.HudCssRendererModule;

        const container = document.createElement("div");
        document.body.appendChild(container);
        const renderer = new CssRenderer();
        await renderer.mount(container, {
          theme: "hud-03",
          version: "1.0.0",
          variant: "micro",
          orientation: "portrait",
          manifest,
          baseVersion: "1.0.0",
          assetBaseUrl
        });
        renderer.setData({ title: "x", media: imageSrc });

        const shadow = container.shadowRoot;
        const frameShellPresent = !!shadow?.querySelector(".nc-hp-frame-shell");
        const media = shadow?.querySelector('[data-slot="media"]');
        const mediaFloat = media ? getComputedStyle(media).float : null;

        renderer.destroy();

        return { frameShellPresent, mediaFloat, hadShadowRoot: !!shadow };
      },
      { manifest, assetBaseUrl: `${THEME_ORIGIN}/`, imageSrc: IMAGE_SRC }
    );

    expect(result.hadShadowRoot).toBe(true);
    // micro:portrait's own markup omits the frame-decoration elements entirely
    // (same as #13's hud-04 micro markup) -- the @media(max-width:900px)-derived
    // display:none rule in shared.css is a defensive belt-and-suspenders only.
    expect(result.frameShellPresent).toBe(false);
    // The reflow un-floats the image (stacked full-width above the text).
    expect(result.mediaFloat).toBe("none");
  });
});
