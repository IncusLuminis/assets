import { defineConfig } from "@playwright/test";

/**
 * Story #9: first use of Playwright in this repo. Minimal config --
 * headless Chromium only, no `webServer` (the spec itself intercepts every
 * request via `page.route` and serves the repo's own `dist/`/`library/`
 * files from disk, so no real HTTP server or open port is needed -- see
 * `tests/e2e/svg-renderer.spec.ts`).
 *
 * Requires `npm run build` first (the harness page imports the real built
 * `dist/runtime/index.js`); run via `npm run test:e2e`.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    headless: true
  }
});
