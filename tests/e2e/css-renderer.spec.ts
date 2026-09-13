import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { test, expect } from "@playwright/test";

/**
 * Story #10 AC: "Playwright headless test: mount / setData / resize /
 * destroy on the fixture CSS Theme; no console errors, no overflow, no
 * leaked styles or listeners." Also the authoritative half of "CSS
 * isolation validated, not assumed" (Contract §15.3) -- see
 * `docs/adr/0003-css-renderer-isolation.md`: jsdom cannot compute styles
 * inside a Shadow DOM (verified separately in
 * `tests/unit/css-renderer-isolation.test.js`'s own docstring), so the
 * "clip-path/drop-shadow/box-shadow actually render inside Shadow DOM"
 * claim is proven here, in a real Chromium, not in the jsdom suite.
 *
 * `CssRenderer.ts` is bundled directly with esbuild (already a
 * devDependency, Story #5) rather than requiring a dev server or a second
 * build target -- this spec is self-contained.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const themeDir = path.join(repoRoot, "library", "themes", "fixture-css-hud");
const THEME_ORIGIN = "https://fixture-css-hud.test";
const MEDIA_SRC = "https://app.heygen.com/embeds/fixture-demo";

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

test.describe("CssRenderer -- real browser (Playwright): fixture-css-hud", () => {
  test("mount -> setData -> resize -> setVariant -> destroy: no console errors, no overflow, clip-path/drop-shadow/box-shadow survive Shadow DOM, host page is unaffected", async ({
    page
  }) => {
    const bundle = await bundleCssRenderer();
    const manifest = JSON.parse(fs.readFileSync(path.join(themeDir, "manifest.json"), "utf8"));

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(String(err)));

    // Serve the real fixture Theme package straight off disk under a fake
    // origin -- CssRenderer's default fetchText is the real `fetch()`
    // (Contract §6.2: the renderer itself fetches styles/markup/scripts
    // against assetBaseUrl), so this is exercising the actual production
    // code path, not a test-only fetch stub (unlike the jsdom suite, which
    // has to substitute a file-reading fetchText -- see
    // tests/helpers/file-fetch-text.js's own docstring for why).
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
    // capabilities.mediaEmbed declares a real allowlisted host
    // (app.heygen.com, Contract §16.2) -- fulfilled locally so this test
    // never makes a real third-party network call.
    await page.route("https://app.heygen.com/**", async (route) => {
      await route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>fixture</title>" });
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
        container.style.width = "800px";
        container.style.height = "500px";
        document.body.appendChild(container);

        const renderer = new CssRenderer();
        const context = {
          theme: "fixture-css-hud",
          version: "0.1.0",
          variant: "maxi",
          orientation: "landscape",
          manifest,
          baseVersion: "1.0.0",
          assetBaseUrl
        };

        const setAllSlots = () =>
          renderer.setData({
            title: "OUTPOST 32",
            subtitle: "CHARACTER FILE",
            content: "<p>body copy wrapping the floated media block</p>",
            footer: "scrolling ticker text",
            media: mediaSrc
          });

        await renderer.mount(container, context);
        setAllSlots();
        renderer.resize({ width: 800, height: 500 });
        await renderer.setVariant("mini");
        setAllSlots();
        await renderer.setVariant("maxi");
        setAllSlots();

        const shadow = container.shadowRoot;
        const frame = shadow?.querySelector(".fixture-css-hud__frame");
        const frameStyle = frame ? getComputedStyle(frame) : undefined;
        const iframe = shadow?.querySelector("iframe.hud-media-embed-iframe");

        // getComputedStyle() returns a LIVE CSSStyleDeclaration -- and
        // `.src` reflects the current attribute -- so every value that
        // matters pre-destroy() must be read into a plain string/number
        // *before* destroy() runs, not merely referenced.
        const clipPath = frameStyle?.clipPath ?? null;
        const filter = frameStyle?.filter ?? null;
        const boxShadow = frameStyle?.boxShadow ?? null;
        const iframeSrc = iframe instanceof HTMLIFrameElement ? iframe.src : null;
        const bodyBgBefore = getComputedStyle(document.body).backgroundColor;
        const markerColorBefore = getComputedStyle(hostMarker).color;
        // "No overflow" (issue #10 AC): the panel's overflow:visible
        // drop-shadow decoration must not grow the page's *scrollable* area
        // beyond its *visible* area -- i.e. it must not introduce a
        // scrollbar. `document.documentElement` always reports at least the
        // viewport's own size regardless of content, so the right check is
        // scrollWidth/Height vs. clientWidth/Height, not vs. a fixed pixel
        // budget (the viewport itself is 1280x720 by Playwright's default).
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
          boxShadow,
          iframeSrc,
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

    // Isolation: Shadow DOM attempted and kept (docs/adr/0003).
    expect(result.isolationOutcome).toBe("shadow-dom");
    expect(result.hadShadowRoot).toBe(true);

    // "Validated, not assumed" -- the legacy clip-path/drop-shadow frame
    // actually renders inside the Shadow DOM in a real browser.
    expect(result.clipPath).not.toBe("none");
    expect(result.filter).toContain("drop-shadow");
    expect(result.boxShadow).not.toBe("none");

    // mediaEmbed: the allowlisted-host iframe is live at maxi (src-swap lifecycle, Contract §10.5).
    expect(result.iframeSrc).toBe(MEDIA_SRC);

    // No overflow: the fixed 800x500 container plus its overflow:visible
    // drop-shadow decoration must not introduce a page scrollbar.
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
});
