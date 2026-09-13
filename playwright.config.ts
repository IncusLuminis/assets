import { defineConfig } from "@playwright/test";

/**
 * First Playwright use in this repo -- added independently by two parallel
 * Stories (#9 SVG renderer, #10 CSS renderer) that both needed a headless
 * real-browser isolation/lifecycle check. Minimal config on purpose so the
 * merge between them stays trivial: headless Chromium only, no `webServer`
 * -- each spec intercepts its own requests via `page.route` and serves the
 * repo's own `dist/`/`library/` files from disk, so no real HTTP server or
 * open port is needed (see `tests/e2e/svg-renderer.spec.ts` and
 * `tests/e2e/css-renderer.spec.ts`).
 *
 * Requires `npm run build` first (the harness pages import the real built
 * `dist/runtime/index.js`); run via `npm run test:e2e`.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [["list"]],
  use: {
    headless: true
  }
});
