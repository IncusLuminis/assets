import { defineConfig } from "@playwright/test";

/**
 * First Playwright use in this repo (Story #10 AC: "Playwright headless
 * test: mount / setData / resize / destroy on the fixture CSS Theme"). A
 * parallel Coder (#9) is also adding Playwright in a sibling worktree --
 * kept minimal/additive on purpose so a merge between the two doesn't
 * fight over config shape; see `tests/e2e/README` note in
 * `docs/adr/0003-css-renderer-isolation.md`'s neighbourhood for the
 * decision this Story made (real Chromium, not a jsdom-only fallback --
 * Chromium was already available in this environment).
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
