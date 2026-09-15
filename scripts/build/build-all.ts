#!/usr/bin/env node
/**
 * Aggregate build orchestrator (Plan §3): packages every real Theme
 * (`build-theme.ts`), bundles the Runtime (`build.mjs`, Story #5), then
 * generates `registry/index.json` from the just-built `dist/themes/**`
 * (`build-registry.ts`, Story #1) -- in that order, because Registry
 * generation requires the Theme dist/ packages to already exist (this
 * Story's AC; Arch §49).
 *
 * Usage:
 *   node scripts/build/build-all.ts
 *   npm run build:all
 *
 * Deliberately builds the four named real Themes, NOT every directory
 * under `library/themes/` (`build-theme.ts --all` would also pick up the
 * Story #5 fixture Themes -- `fixture-hud`, `fixture-svg-hud`,
 * `fixture-css-hud` -- which exist purely as Vitest test scaffolding and
 * must never end up published in the committed `registry/index.json`).
 * `build-theme.ts`'s own `--all`/discovery mode stays generic (and is
 * exercised directly by this Story's tests) for exactly this kind of reuse
 * elsewhere; this orchestrator is simply not that "elsewhere".
 *
 * Stops at the first failure (a thrown error propagates and exits
 * non-zero) rather than continuing partway -- Registry generation must
 * never run against a `dist/themes/**` that a failed Theme build left
 * incomplete.
 *
 * `npm run build` (Story #5, unchanged) still builds only the Runtime --
 * see this repo's root `package.json` and `scripts/build/README.md` for
 * why that script was left alone rather than repointed here.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runBuild as buildRuntime } from "./build.mjs";
import { buildTheme } from "./build-theme.ts";
import { buildRegistry, writeRegistryIndex } from "./build-registry.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(__dirname, "..", "..");

// The real, publishable Themes (Plan §5 Stories #11-13, #15). See file
// header for why this is an explicit list, not `discoverThemeIds()`.
export const REAL_THEME_IDS = ["hud-01", "hud-02", "hud-03", "hud-04"];

export interface BuildAllOptions {
  repoRoot?: string;
}

export async function buildAll(options: BuildAllOptions = {}): Promise<void> {
  const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;

  for (const id of REAL_THEME_IDS) {
    const result = buildTheme(id, { repoRoot });
    console.log(
      `[build-all] theme ${result.id}@${result.version} -> ${path.relative(process.cwd(), result.outputDir)}`
    );
  }

  await buildRuntime();
  console.log("[build-all] runtime -> dist/runtime/");

  const index = buildRegistry({ repoRoot });
  const outputPath = writeRegistryIndex(index, { repoRoot });
  console.log(
    `[build-all] registry -> ${path.relative(process.cwd(), outputPath)} (${index.themes.length} themes)`
  );
}

function isMainModule(): boolean {
  return Boolean(process.argv[1]) && path.resolve(process.argv[1] as string) === fileURLToPath(import.meta.url);
}

/** See `build-theme.ts`'s identical helper for why this flag exists. */
function extractRepoRootFlag(args: string[]): string | undefined {
  const flag = args.find((arg) => arg.startsWith("--repo-root="));
  return flag ? flag.slice("--repo-root=".length) : undefined;
}

if (isMainModule()) {
  try {
    await buildAll({ repoRoot: extractRepoRootFlag(process.argv.slice(2)) });
  } catch (err) {
    console.error((err as Error).message);
    process.exitCode = 1;
  }
}
