#!/usr/bin/env node
/**
 * Generates `registry/index.json` from the **already-built**
 * `dist/themes/<id>/<version>/manifest.json` packages -- never from
 * `library/themes/` source directly (Story #1 AC: "Registry metadata is
 * written only after the referenced Theme assets exist in dist/", Arch
 * §49). Run `build-theme.ts` (or `build-all.ts`) first.
 *
 * Usage:
 *   node scripts/build/build-registry.ts
 *
 * Pipeline position (Arch §32): this script's *input* is the output of
 * `build-theme.ts` ("build"); the manifest-schema check it runs on every
 * `dist/themes/**` manifest before indexing is "validation"; writing
 * `registry/index.json` is "Registry generation". Arch §32's diagram lists
 * a further "dist generation" step after Registry generation -- that is
 * read here as the later, out-of-scope (#6/#7) step that assembles a
 * CDN-ready `dist/registry/` copy for Wrangler deployment, distinct from
 * this Story's checked-in `registry/index.json` at the repo root (the AC's
 * literal "written only after ... assets exist in dist/" wins over the
 * diagram's step *labels* where the two read as being in tension -- see
 * the Coder report on this Story).
 *
 * Fail-closed (this Story's AC): if ANY `dist/themes/**` manifest fails
 * `registry/schemas/manifest.schema.json` validation, or references an
 * entrypoint/composition asset missing from its own package, this script
 * throws and writes NOTHING -- never a partial index covering only the
 * Themes/versions that happened to validate.
 *
 * Missing-asset detection split with `build-theme.ts` (documented per this
 * Story's brief): `build-theme.ts` is the PRIMARY owner -- it refuses to
 * produce an incomplete `dist/themes/<id>/<version>/` package in the first
 * place. This script performs a SECONDARY, defense-in-depth check
 * (`assertPackageAssetsExist`) against whatever it actually finds in
 * `dist/`, because it must not assume every package under `dist/themes/**`
 * was necessarily produced by this repo's own `build-theme.ts` run (e.g. a
 * stale/partially-cleaned `dist/`, or a manually-assembled package) --
 * Arch §49's fail-closed principle applies to this script independently.
 *
 * Determinism (this Story's AC): Theme ids and version directories are read
 * from disk and explicitly sorted (never relied on for iteration order);
 * `versions[]` is sorted by real SemVer comparison, not lexicographically
 * (`lib/semver.ts`); `latest` is computed as the true max, not "last
 * processed"; the written JSON has fixed key order (object literals below)
 * and carries no timestamp or other run-specific data. Re-running against
 * an unchanged `dist/themes/**` therefore produces byte-identical bytes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateManifestAgainstSchema } from "./lib/manifest-validator.ts";
import { validateRegistryIndex } from "./lib/registry-index-validator.ts";
import { sortSemVerAscending, maxSemVer } from "./lib/semver.ts";
import { writeFileEnsuringDir } from "./lib/fs-utils.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = path.resolve(__dirname, "..", "..");

const COMPOSITION_KEYS = [
  "maxi:landscape",
  "maxi:portrait",
  "mini:landscape",
  "mini:portrait",
  "micro:landscape",
  "micro:portrait"
] as const;

export class RegistryBuildError extends Error {
  constructor(message: string) {
    super(`[build-registry] ${message}`);
    this.name = "RegistryBuildError";
  }
}

export interface BuildRegistryOptions {
  repoRoot?: string;
  /** Where `themes/<id>/<version>/` are read from -- defaults to `<repoRoot>/dist`. */
  distRoot?: string;
  /** Where `index.json` is written -- defaults to `<repoRoot>/registry`. Only used by `writeRegistryIndex`. */
  registryRoot?: string;
}

export interface ThemeVersionEntry {
  version: string;
  manifest: string;
  package: string;
}

export interface ThemeIndexEntry {
  id: string;
  latest: string;
  manifest: string;
  versions: ThemeVersionEntry[];
}

export interface RegistryIndex {
  schemaVersion: string;
  themes: ThemeIndexEntry[];
}

function listSubdirNames(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/**
 * Secondary, defense-in-depth check (see file header): every composition
 * marked `supported: true` in the manifest must have its `dir` present in
 * the built package, and every file its `entrypoints` entry references
 * must exist too.
 */
function assertPackageAssetsExist(
  versionDir: string,
  manifest: any,
  themeId: string,
  version: string
): void {
  for (const key of COMPOSITION_KEYS) {
    const composition = manifest.compositions?.[key];
    if (!composition || composition.supported !== true) continue;

    const dirAbs = path.join(versionDir, ...String(composition.dir).split("/"));
    if (!fs.existsSync(dirAbs)) {
      throw new RegistryBuildError(
        `dist/themes/${themeId}/${version}: composition "${key}" is supported:true but its dir "${composition.dir}" is missing from the built package -- refusing to index (fail closed)`
      );
    }

    const entrypoint = manifest.entrypoints?.[key];
    if (!entrypoint) continue; // build-theme.ts / the manifest schema already enforce this pairing.

    const referenced: string[] = [
      entrypoint.markup,
      ...(entrypoint.styles ?? []),
      ...(entrypoint.scripts ?? [])
    ];
    for (const rel of referenced) {
      const abs = path.join(versionDir, ...String(rel).split("/"));
      if (!fs.existsSync(abs)) {
        throw new RegistryBuildError(
          `dist/themes/${themeId}/${version}: entrypoints["${key}"] references "${rel}", which is missing from the built package -- refusing to index (fail closed)`
        );
      }
    }
  }
}

/**
 * Scans `dist/themes/**`, validates every manifest found, and computes the
 * registry index in memory. Throws `RegistryBuildError` (no partial result)
 * on any invalid or incomplete Theme package. Does not touch
 * `registry/index.json` on disk -- see `buildRegistry`/`writeRegistryIndex`.
 */
export function buildRegistryIndex(options: BuildRegistryOptions = {}): RegistryIndex {
  const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
  const distThemesDir = path.join(options.distRoot ?? path.join(repoRoot, "dist"), "themes");

  if (!fs.existsSync(distThemesDir)) {
    throw new RegistryBuildError(
      `no dist/themes/ directory found at ${distThemesDir} -- run build-theme.ts (or build-all.ts) first. Registry metadata is written only after the referenced Theme assets exist in dist/ (Arch §49).`
    );
  }

  const themeIds = listSubdirNames(distThemesDir);
  if (themeIds.length === 0) {
    throw new RegistryBuildError(`dist/themes/ at ${distThemesDir} contains no Theme packages`);
  }

  const themeEntries: ThemeIndexEntry[] = [];

  for (const themeId of themeIds) {
    const themeVersionsDir = path.join(distThemesDir, themeId);
    const versionDirNames = listSubdirNames(themeVersionsDir);
    if (versionDirNames.length === 0) {
      throw new RegistryBuildError(`dist/themes/${themeId}/ has no built version directories`);
    }

    const versionEntries: ThemeVersionEntry[] = [];

    for (const version of versionDirNames) {
      const versionDir = path.join(themeVersionsDir, version);
      const manifestPath = path.join(versionDir, "manifest.json");

      if (!fs.existsSync(manifestPath)) {
        throw new RegistryBuildError(`dist/themes/${themeId}/${version}/manifest.json is missing`);
      }

      let manifest: any;
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      } catch (err) {
        throw new RegistryBuildError(
          `dist/themes/${themeId}/${version}/manifest.json is not valid JSON: ${(err as Error).message}`
        );
      }

      const { valid, errors } = validateManifestAgainstSchema(manifest);
      if (!valid) {
        throw new RegistryBuildError(
          `dist/themes/${themeId}/${version}/manifest.json failed registry/schemas/manifest.schema.json validation -- refusing to generate a partial index (Arch §49):\n${errors.join("\n")}`
        );
      }

      if (manifest.id !== themeId || manifest.version !== version) {
        throw new RegistryBuildError(
          `dist/themes/${themeId}/${version}/manifest.json declares id="${manifest.id}" version="${manifest.version}", which does not match its own package path`
        );
      }

      assertPackageAssetsExist(versionDir, manifest, themeId, version);

      versionEntries.push({
        version,
        manifest: `/themes/${themeId}/${version}/manifest.json`,
        package: `/themes/${themeId}/${version}/`
      });
    }

    const sortedVersionStrings = sortSemVerAscending(versionEntries.map((v) => v.version));
    const latest = maxSemVer(sortedVersionStrings);
    const versionByString = new Map(versionEntries.map((v) => [v.version, v]));
    const orderedVersions = sortedVersionStrings.map((v) => versionByString.get(v) as ThemeVersionEntry);

    themeEntries.push({
      id: themeId,
      latest,
      manifest: `/themes/${themeId}/${latest}/manifest.json`,
      versions: orderedVersions
    });
  }

  themeEntries.sort((a, b) => a.id.localeCompare(b.id));

  return { schemaVersion: "1.0", themes: themeEntries };
}

/** `buildRegistryIndex` plus a validate-before-write pass against this Story's own schema. */
export function buildRegistry(options: BuildRegistryOptions = {}): RegistryIndex {
  const index = buildRegistryIndex(options);
  const { valid, errors } = validateRegistryIndex(index);
  if (!valid) {
    throw new RegistryBuildError(
      `generated registry/index.json failed its own registry/schemas/registry-index.schema.json validation -- refusing to write (fail closed):\n${errors.join("\n")}`
    );
  }
  return index;
}

/** Serializes `index` deterministically and writes it to `registry/index.json`. */
export function writeRegistryIndex(index: RegistryIndex, options: BuildRegistryOptions = {}): string {
  const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
  const outputPath = path.join(options.registryRoot ?? path.join(repoRoot, "registry"), "index.json");
  // Fixed key order (the object literals built above), 2-space indent, one
  // trailing newline -- no timestamp or other non-deterministic content.
  const json = `${JSON.stringify(index, null, 2)}\n`;
  writeFileEnsuringDir(outputPath, json);
  return outputPath;
}

function isMainModule(): boolean {
  return Boolean(process.argv[1]) && path.resolve(process.argv[1] as string) === fileURLToPath(import.meta.url);
}

/**
 * Pulls an optional `--repo-root=<path>` flag out of argv. See
 * `build-theme.ts`'s identical helper for why this exists (testing this
 * CLI end-to-end, as a real process with a real exit code, against a
 * throwaway fixture repo).
 */
function extractRepoRootFlag(args: string[]): string | undefined {
  const flag = args.find((arg) => arg.startsWith("--repo-root="));
  return flag ? flag.slice("--repo-root=".length) : undefined;
}

function main(): void {
  const repoRoot = extractRepoRootFlag(process.argv.slice(2));
  try {
    const index = buildRegistry({ repoRoot });
    const outputPath = writeRegistryIndex(index, { repoRoot });
    console.log(
      `[build-registry] wrote ${path.relative(process.cwd(), outputPath)} (${index.themes.length} themes)`
    );
  } catch (err) {
    console.error((err as Error).message);
    process.exitCode = 1;
  }
}

if (isMainModule()) {
  main();
}
