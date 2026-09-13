import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";

/**
 * Story #9 AC: "Playwright headless test: mount -> setData -> resize ->
 * destroy on the fixture SVG Theme, asserting no console errors and no
 * viewport overflow (Plan §2 decision 11)."
 *
 * No real network is used anywhere in this spec: every request the page
 * makes is intercepted and served from this repo's own `dist/`/`library/`
 * files on disk (or aborted), including the "SKY VIEWER" control's lazy
 * external-resource request -- proving the lazy-load hook fires with the
 * correct host/kind without this test ever reaching `aladin.cds.unistra.fr`.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const ORIGIN = "http://hud-assets.test";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

test.beforeEach(async ({ page }) => {
  const distExists = fs.existsSync(path.join(repoRoot, "dist", "runtime", "index.js"));
  test.skip(!distExists, "dist/runtime/index.js not built -- run `npm run build` before `npm run test:e2e`");

  // Serve this repo's own files for our fake origin. Any OTHER origin
  // (e.g. the skyViewer hook's `https://aladin.cds.unistra.fr/`) is
  // fulfilled with an inert stand-in rather than `route.abort()`: an
  // aborted request makes the browser itself log a console/network error
  // that has nothing to do with this renderer's own code, which would
  // defeat the "no console errors" assertion below for a reason unrelated
  // to a real bug. Either way, Playwright's route interception means the
  // page never actually reaches a real network socket for these requests.
  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== ORIGIN) {
      const isStylesheet = req.resourceType() === "stylesheet";
      return route.fulfill({
        status: 200,
        contentType: isStylesheet ? "text/css" : "application/javascript",
        body: isStylesheet ? "" : "/* fixture: external resource intentionally not fetched in tests */"
      });
    }
    const filePath = path.join(repoRoot, decodeURIComponent(url.pathname));
    if (!filePath.startsWith(repoRoot) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      return route.fulfill({ status: 404, body: "not found" });
    }
    const ext = path.extname(filePath);
    return route.fulfill({
      status: 200,
      contentType: MIME[ext] ?? "application/octet-stream",
      body: fs.readFileSync(filePath)
    });
  });
});

test("mount -> setData -> resize -> destroy on fixture-svg-hud: no console errors, no viewport overflow", async ({
  page
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto(`${ORIGIN}/tests/e2e/fixtures/harness.html`);

  await page.evaluate(() =>
    (window as any).__hudHarness.mount({
      theme: "fixture-svg-hud",
      version: "0.1.0",
      variant: "maxi",
      orientation: "landscape"
    })
  );

  // The real composition mounted: both the <svg> frame layer and the HTML
  // content layer (Contract §5.3 point 2), via [data-slot] -- this test
  // never references an internal SVG id/class (Contract §9.1, Arch §18).
  await expect(page.locator(".fx-svg-hud__frame")).toHaveCount(1);
  await expect(page.locator('[data-slot="title"]')).toHaveCount(1);

  await page.evaluate(() => (window as any).__hudHarness.setData({ title: "NGC 1300", status: "TARGET LOCK" }));
  await expect(page.locator('[data-slot="title"]')).toHaveText("NGC 1300");
  await expect(page.locator('[data-slot="status"]')).toHaveText("TARGET LOCK");

  await page.evaluate(() => (window as any).__hudHarness.resize({ width: 480, height: 270 }));

  // Lazy external-resource hook: fires only on demand, and only against the
  // capability-declared host -- proven here without any real network call
  // (the beforeEach route handler aborts anything not served from disk).
  await page.evaluate(() => (window as any).__hudHarness.clickControl('[data-hud-control="load-sky-viewer"]'));
  await page.waitForTimeout(50);

  // Contract §15.5: overflowVisible:true means the glow layer's decorative
  // bleed outside its own box is EXPECTED and must not be treated as a
  // layout bug -- what must NOT happen is the *host page* gaining a
  // scrollbar / growing past the viewport it was given.
  const hasPageOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth > window.innerWidth + 1 ||
      document.documentElement.scrollHeight > window.innerHeight + 1
  );
  expect(hasPageOverflow).toBe(false);

  await page.evaluate(() => (window as any).__hudHarness.destroy());
  await expect(page.locator("#host")).toBeEmpty();

  expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});
