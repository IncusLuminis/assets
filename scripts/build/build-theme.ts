#!/usr/bin/env node
/**
 * Packages ONE Theme's `library/themes/<id>/` **source** into a deterministic
 * published package `dist/themes/<id>/<version>/`, matching HUD Theme
 * Contract 1.0 §2.2's structure (Story #1 -- the prerequisite the issue's
 * own AC needs: "Registry metadata is written only after the referenced
 * Theme assets exist in dist/", Arch §49).
 *
 * Usage:
 *   node scripts/build/build-theme.ts <themeId> [<themeId> ...]
 *   node scripts/build/build-theme.ts --all
 *
 * `--all` builds every `library/themes/<id>/` that has a `manifest.json`
 * (including the Story #5 fixture Themes -- see `discoverThemeIds`). The
 * *production* build (`build-all.ts`, `npm run build:all`) does not use
 * `--all`; it names the four real Themes explicitly so fixture Themes never
 * end up in the committed `registry/index.json` -- see `build-all.ts`.
 *
 * What "fail closed" means here: this script either produces a **complete**
 * `dist/themes/<id>/<version>/` package, or it produces **no output at all**
 * for that Theme (a non-zero exit, no partial/corrupt directory left behind
 * -- see `lib/fs-utils.ts#buildIntoDirAtomically`). It refuses to run before
 * checking:
 *   1. the source manifest validates against
 *      `registry/schemas/manifest.schema.json` (Story #1 AC);
 *   2. every `compositions[*]` marked `supported: true` has its `dir` on
 *      disk (Contract §2.2 rule 2);
 *   3. every file an `entrypoints[*]` entry references (`markup`, `styles`,
 *      `scripts`) actually exists under the Theme source (this Story's
 *      "missing-asset detection" AC -- this script is the primary owner of
 *      that check; `build-registry.ts` repeats a lighter version of it
 *      against `dist/` as a defense-in-depth secondary check, since it must
 *      not assume every `dist/themes/**` package it finds was necessarily
 *      produced by this exact script run -- see that file's own comment).
 *
 * Determinism ("same input -> byte-identical output", this Story's AC): the
 * set of files packaged is computed from the manifest + a directory walk
 * that sorts entries by name at every level (`lib/fs-utils.ts`), never from
 * unordered `fs` iteration; every file is copied byte-for-byte
 * (`fs.readFileSync` -> `fs.writeFileSync`, no timestamps or other
 * machine-specific metadata written into any file's *content*); and nothing
 * this script writes includes a build timestamp, host name, or similar.
 * Re-running against unchanged source therefore produces byte-identical
 * file contents every time (verified by
 * `tests/unit/build-theme.test.js`'s determinism test, not just claimed).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateManifestAgainstSchema } from "./lib/manifest-validator.ts";
import { listFilesRecursive, writeFileEnsuringDir, buildIntoDirAtomically } from "./lib/fs-utils.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(__dirname, "..", "..");

// Contract §2.2: the fixed set of *optional* top-level Theme-root
// directories that, when present, are part of the published package.
// `sources/` is deliberately excluded (Contract §2.2 rule 4: authoring
// sources are not required for runtime rendering and MAY be omitted from
// the deployed package -- this build always omits it, and it always omits
// anything else at the Theme root too, e.g. README.md: the published
// package is an explicit allowlist, not "copy everything").
const OPTIONAL_ROOT_DIRS = ["assets", "styles", "scripts", "preview"];

const COMPOSITION_KEYS = [
  "maxi:landscape",
  "maxi:portrait",
  "mini:landscape",
  "mini:portrait",
  "micro:landscape",
  "micro:portrait"
] as const;

export class ThemeBuildError extends Error {
  readonly themeId: string;

  constructor(themeId: string, message: string) {
    super(`[build-theme:${themeId}] ${message}`);
    this.name = "ThemeBuildError";
    this.themeId = themeId;
  }
}

export interface BuildThemeOptions {
  repoRoot?: string;
  /**
   * Where to write `themes/<id>/<version>/` -- defaults to
   * `<repoRoot>/dist`. Overridable independently of `repoRoot` so tests can
   * build from this actual repo's real `library/themes/` sources while
   * writing output to a throwaway temp directory instead of this repo's
   * own `dist/` (`tests/unit/build-registry.test.js`'s real-Themes
   * end-to-end test).
   */
  distRoot?: string;
}

export interface BuildThemeResult {
  id: string;
  version: string;
  themeSourceDir: string;
  outputDir: string;
  /** Package-relative, POSIX-separated, sorted paths actually written. */
  files: string[];
}

/** Every `library/themes/<id>/` that has a `manifest.json`, sorted. */
export function discoverThemeIds(repoRoot: string = DEFAULT_REPO_ROOT): string[] {
  const themesRoot = path.join(repoRoot, "library", "themes");
  return fs
    .readdirSync(themesRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => fs.existsSync(path.join(themesRoot, name, "manifest.json")))
    .sort();
}

/**
 * Builds `library/themes/<themeId>/` into `dist/themes/<themeId>/<version>/`.
 * Throws `ThemeBuildError` (fail closed, no output written) on any invalid
 * manifest or missing asset.
 */
export function buildTheme(themeId: string, options: BuildThemeOptions = {}): BuildThemeResult {
  const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
  const distRoot = options.distRoot ?? path.join(repoRoot, "dist");
  const themeDir = path.join(repoRoot, "library", "themes", themeId);
  const manifestPath = path.join(themeDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    throw new ThemeBuildError(themeId, `no manifest.json found under ${themeDir}`);
  }

  let manifest: any;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err) {
    throw new ThemeBuildError(themeId, `manifest.json is not valid JSON: ${(err as Error).message}`);
  }

  const { valid, errors } = validateManifestAgainstSchema(manifest);
  if (!valid) {
    throw new ThemeBuildError(
      themeId,
      `manifest.json failed registry/schemas/manifest.schema.json validation -- refusing to build (fail closed):\n${errors.join("\n")}`
    );
  }

  if (manifest.id !== themeId) {
    throw new ThemeBuildError(
      themeId,
      `manifest.id "${manifest.id}" does not match its directory name "${themeId}" (Contract §4.1)`
    );
  }

  // Compute the deterministic, sorted set of package-relative files.
  const relFiles = new Set<string>();
  relFiles.add("manifest.json");

  for (const compositionKey of COMPOSITION_KEYS) {
    const composition = manifest.compositions?.[compositionKey];
    if (!composition || composition.supported !== true) continue;

    const dir = composition.dir as string;
    const dirAbs = path.join(themeDir, ...dir.split("/"));
    if (!fs.existsSync(dirAbs) || !fs.statSync(dirAbs).isDirectory()) {
      throw new ThemeBuildError(
        themeId,
        `composition "${compositionKey}" is supported:true but its dir "${dir}" does not exist under ${themeDir} (Contract §2.2 rule 2)`
      );
    }
    for (const rel of listFilesRecursive(dirAbs)) {
      relFiles.add(`${dir}/${rel}`);
    }
  }

  for (const dirName of OPTIONAL_ROOT_DIRS) {
    const dirAbs = path.join(themeDir, dirName);
    if (!fs.existsSync(dirAbs)) continue;
    for (const rel of listFilesRecursive(dirAbs)) {
      relFiles.add(`${dirName}/${rel}`);
    }
  }

  // Missing-asset detection (primary owner -- see file header comment):
  // every entrypoint file a supported composition references must be among
  // the files just collected.
  for (const compositionKey of COMPOSITION_KEYS) {
    const composition = manifest.compositions?.[compositionKey];
    if (!composition || composition.supported !== true) continue;

    const entrypoint = manifest.entrypoints?.[compositionKey];
    if (!entrypoint) {
      throw new ThemeBuildError(
        themeId,
        `composition "${compositionKey}" is supported:true but has no matching entrypoints["${compositionKey}"] entry`
      );
    }
    const referenced: string[] = [
      entrypoint.markup,
      ...(entrypoint.styles ?? []),
      ...(entrypoint.scripts ?? [])
    ];
    for (const rel of referenced) {
      if (!relFiles.has(rel)) {
        throw new ThemeBuildError(
          themeId,
          `entrypoints["${compositionKey}"] references "${rel}", which does not exist under ${themeDir} (missing-asset detection) -- refusing to build an incomplete package`
        );
      }
    }
  }

  const version = manifest.version as string;
  const outputDir = path.join(distRoot, "themes", themeId, version);
  const sortedFiles = [...relFiles].sort();

  buildIntoDirAtomically(outputDir, (stagingDir) => {
    for (const rel of sortedFiles) {
      const srcAbs = path.join(themeDir, ...rel.split("/"));
      const destAbs = path.join(stagingDir, ...rel.split("/"));
      // Byte-for-byte copy -- no filesystem timestamps or other
      // machine-specific metadata is carried into any file's *content*,
      // which is what makes re-running this against unchanged source
      // produce byte-identical output (this Story's determinism AC).
      writeFileEnsuringDir(destAbs, fs.readFileSync(srcAbs));
    }
  });

  return { id: themeId, version, themeSourceDir: themeDir, outputDir, files: sortedFiles };
}

function isMainModule(): boolean {
  return Boolean(process.argv[1]) && path.resolve(process.argv[1] as string) === fileURLToPath(import.meta.url);
}

/**
 * Pulls an optional `--repo-root=<path>` flag out of `args`, returning the
 * remaining args and the resolved repo root (or `undefined` to use
 * `DEFAULT_REPO_ROOT`). Exists mainly so this CLI is exercisable
 * end-to-end (real process, real exit code) against a throwaway fixture
 * repo in tests, without mutating this actual repo's own `dist/` --
 * `tests/unit/build-theme.test.js`'s fail-closed CLI test uses it.
 */
function extractRepoRootFlag(args: string[]): { rest: string[]; repoRoot?: string } {
  const rest: string[] = [];
  let repoRoot: string | undefined;
  for (const arg of args) {
    if (arg.startsWith("--repo-root=")) {
      repoRoot = arg.slice("--repo-root=".length);
    } else {
      rest.push(arg);
    }
  }
  return { rest, repoRoot };
}

function main(): void {
  const { rest: args, repoRoot } = extractRepoRootFlag(process.argv.slice(2));
  let ids: string[];

  if (args.includes("--all")) {
    ids = discoverThemeIds(repoRoot);
  } else if (args.length > 0) {
    ids = args;
  } else {
    console.error("Usage: node scripts/build/build-theme.ts [--repo-root=<path>] <themeId> [<themeId> ...] | --all");
    process.exitCode = 1;
    return;
  }

  let failed = false;
  for (const id of ids) {
    try {
      const result = buildTheme(id, { repoRoot });
      console.log(
        `[build-theme] ${result.id}@${result.version} -> ${path.relative(process.cwd(), result.outputDir)} (${result.files.length} files)`
      );
    } catch (err) {
      failed = true;
      console.error((err as Error).message);
    }
  }
  if (failed) process.exitCode = 1;
}

if (isMainModule()) {
  main();
}
