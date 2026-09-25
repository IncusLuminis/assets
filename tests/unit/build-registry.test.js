import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { describe, it, expect, afterEach } from "vitest";
import {
  buildRegistryIndex,
  buildRegistry,
  writeRegistryIndex,
  RegistryBuildError
} from "../../scripts/build/build-registry.ts";
import { buildTheme } from "../../scripts/build/build-theme.ts";
import { validateRegistryIndex } from "../../scripts/build/lib/registry-index-validator.ts";
import {
  makeTempRepoRoot,
  rmTempRepoRoot,
  minimalValidManifest,
  minimalValidFiles,
  writeThemeSource,
  writeDistThemePackage
} from "../helpers/build-fixtures.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const BUILD_REGISTRY_SCRIPT = path.join(REPO_ROOT, "scripts", "build", "build-registry.ts");

const REAL_THEME_IDS = ["hud-01", "hud-02", "hud-03", "hud-04"];

const tempRoots = [];
function newTempRepoRoot() {
  const root = makeTempRepoRoot();
  tempRoots.push(root);
  return root;
}
afterEach(() => {
  while (tempRoots.length > 0) rmTempRepoRoot(tempRoots.pop());
});

describe("build-registry.ts -- buildRegistryIndex()/buildRegistry() (issue #1 AC)", () => {
  it("happy path: scans dist/themes/**, produces the documented shape, and its own output validates against registry-index.schema.json", () => {
    const repoRoot = newTempRepoRoot();
    writeDistThemePackage(repoRoot, "fixture-a", "0.1.0", {
      manifest: minimalValidManifest({ id: "fixture-a", version: "0.1.0" }),
      files: minimalValidFiles("fixture-a")
    });
    writeDistThemePackage(repoRoot, "fixture-b", "2.3.1", {
      manifest: minimalValidManifest({ id: "fixture-b", version: "2.3.1" }),
      files: minimalValidFiles("fixture-b")
    });

    const index = buildRegistryIndex({ repoRoot });

    expect(index).toEqual({
      schemaVersion: "1.0",
      themes: [
        {
          id: "fixture-a",
          latest: "0.1.0",
          manifest: "/themes/fixture-a/0.1.0/manifest.json",
          versions: [
            { version: "0.1.0", manifest: "/themes/fixture-a/0.1.0/manifest.json", package: "/themes/fixture-a/0.1.0/" }
          ]
        },
        {
          id: "fixture-b",
          latest: "2.3.1",
          manifest: "/themes/fixture-b/2.3.1/manifest.json",
          versions: [
            { version: "2.3.1", manifest: "/themes/fixture-b/2.3.1/manifest.json", package: "/themes/fixture-b/2.3.1/" }
          ]
        }
      ]
    });

    const { valid, errors } = validateRegistryIndex(index);
    expect(valid, errors.join("\n")).toBe(true);
  });

  it("fails closed with no dist/themes/ directory at all", () => {
    const repoRoot = newTempRepoRoot();
    expect(() => buildRegistryIndex({ repoRoot })).toThrow(RegistryBuildError);
    expect(() => buildRegistryIndex({ repoRoot })).toThrow(/Registry metadata is written only after/);
  });

  it("fails closed (throws, no output written) when a dist/ manifest fails schema validation -- never a partial index", () => {
    const repoRoot = newTempRepoRoot();
    writeDistThemePackage(repoRoot, "fixture-good", "0.1.0", {
      manifest: minimalValidManifest({ id: "fixture-good", version: "0.1.0" }),
      files: minimalValidFiles("fixture-good")
    });
    const badManifest = minimalValidManifest({ id: "fixture-bad", version: "0.1.0" });
    delete badManifest.isolation;
    writeDistThemePackage(repoRoot, "fixture-bad", "0.1.0", {
      manifest: badManifest,
      files: minimalValidFiles("fixture-bad")
    });

    expect(() => buildRegistryIndex({ repoRoot })).toThrow(/manifest.schema.json validation/);
    // The one good Theme must NOT be indexed either -- no partial index.
    expect(fs.existsSync(path.join(repoRoot, "registry", "index.json"))).toBe(false);
  });

  it("fails closed (secondary check) when a dist/ package is missing a file its own entrypoints reference", () => {
    const repoRoot = newTempRepoRoot();
    const manifest = minimalValidManifest({ id: "fixture-incomplete", version: "0.1.0" });
    const files = minimalValidFiles("fixture-incomplete");
    delete files["mini/landscape/hud.html"]; // manifest still references it
    writeDistThemePackage(repoRoot, "fixture-incomplete", "0.1.0", { manifest, files });

    expect(() => buildRegistryIndex({ repoRoot })).toThrow(/missing from the built package/);
  });

  it("fails closed when a supported composition's dir is entirely missing from the dist/ package", () => {
    const repoRoot = newTempRepoRoot();
    const manifest = minimalValidManifest({ id: "fixture-nodir", version: "0.1.0" });
    const files = minimalValidFiles("fixture-nodir");
    delete files["micro/portrait/hud.html"];
    writeDistThemePackage(repoRoot, "fixture-nodir", "0.1.0", { manifest, files });

    expect(() => buildRegistryIndex({ repoRoot })).toThrow(/is missing from the built package/);
  });

  it("version ordering: versions[] is semver-sorted (not lexicographic) and latest is the true max", () => {
    const repoRoot = newTempRepoRoot();
    // Lexicographic sort would put "1.10.0" before "1.2.0" and "0.1.0" last --
    // wrong on both counts. This also proves the dir-iteration order (here,
    // "0.1.0" then "1.10.0" then "1.2.0" alphabetically on disk) does not
    // leak into the result.
    for (const version of ["1.2.0", "0.1.0", "1.10.0"]) {
      writeDistThemePackage(repoRoot, "fixture-versions", version, {
        manifest: minimalValidManifest({ id: "fixture-versions", version }),
        files: minimalValidFiles("fixture-versions")
      });
    }

    const index = buildRegistryIndex({ repoRoot });
    const theme = index.themes.find((t) => t.id === "fixture-versions");

    expect(theme.versions.map((v) => v.version)).toEqual(["0.1.0", "1.2.0", "1.10.0"]);
    expect(theme.latest).toBe("1.10.0");
    expect(theme.manifest).toBe("/themes/fixture-versions/1.10.0/manifest.json");
  });

  it("themes[] is sorted by id", () => {
    const repoRoot = newTempRepoRoot();
    for (const id of ["zzz-theme", "aaa-theme", "mmm-theme"]) {
      writeDistThemePackage(repoRoot, id, "0.1.0", {
        manifest: minimalValidManifest({ id, version: "0.1.0" }),
        files: minimalValidFiles(id)
      });
    }
    const index = buildRegistryIndex({ repoRoot });
    expect(index.themes.map((t) => t.id)).toEqual(["aaa-theme", "mmm-theme", "zzz-theme"]);
  });

  it("determinism: building the index twice from unchanged dist/ produces byte-identical serialized JSON", () => {
    const repoRoot = newTempRepoRoot();
    for (const id of ["fixture-p", "fixture-q"]) {
      writeDistThemePackage(repoRoot, id, "0.1.0", {
        manifest: minimalValidManifest({ id, version: "0.1.0" }),
        files: minimalValidFiles(id)
      });
    }

    const first = buildRegistry({ repoRoot });
    const firstPath = writeRegistryIndex(first, { repoRoot });
    const firstBytes = fs.readFileSync(firstPath);

    fs.rmSync(firstPath);
    const second = buildRegistry({ repoRoot });
    const secondPath = writeRegistryIndex(second, { repoRoot });
    const secondBytes = fs.readFileSync(secondPath);

    expect(secondBytes.equals(firstBytes)).toBe(true);
  });

  it("real Themes: builds all four real Themes end-to-end and generates a real registry index from them", () => {
    const tempOut = newTempRepoRoot();
    const distRoot = path.join(tempOut, "dist");
    const registryRoot = path.join(tempOut, "registry");

    for (const id of REAL_THEME_IDS) {
      buildTheme(id, { repoRoot: REPO_ROOT, distRoot });
    }

    const index = buildRegistry({ distRoot });
    const { valid, errors } = validateRegistryIndex(index);
    expect(valid, errors.join("\n")).toBe(true);

    expect(index.themes.map((t) => t.id)).toEqual(["hud-01", "hud-02", "hud-03", "hud-04"]);
    expect(index.themes.find((t) => t.id === "hud-01").latest).toBe("0.1.1");
    expect(index.themes.find((t) => t.id === "hud-04").latest).toBe("1.0.0");

    const outputPath = writeRegistryIndex(index, { registryRoot });
    expect(fs.existsSync(outputPath)).toBe(true);
    const written = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    expect(written).toEqual(index);
  });

  describe("CLI (real process, `node scripts/build/build-registry.ts`)", () => {
    it("fails closed with a non-zero exit code and writes no registry/index.json when dist/ has no Theme assets yet", () => {
      const repoRoot = newTempRepoRoot();

      let error;
      try {
        execFileSync(process.execPath, [BUILD_REGISTRY_SCRIPT, `--repo-root=${repoRoot}`], {
          encoding: "utf8",
          stdio: "pipe"
        });
      } catch (err) {
        error = err;
      }

      expect(error, "CLI should have exited non-zero").toBeDefined();
      expect(error.status).not.toBe(0);
      expect(error.stderr).toMatch(/Registry metadata is written only after/);
      expect(fs.existsSync(path.join(repoRoot, "registry", "index.json"))).toBe(false);
    });

    it("exits 0 and writes registry/index.json once dist/themes/** exists", () => {
      const repoRoot = newTempRepoRoot();
      writeThemeSource(repoRoot, "fixture-cli", {
        manifest: minimalValidManifest({ id: "fixture-cli" }),
        files: minimalValidFiles("fixture-cli")
      });
      buildTheme("fixture-cli", { repoRoot });

      const stdout = execFileSync(process.execPath, [BUILD_REGISTRY_SCRIPT, `--repo-root=${repoRoot}`], {
        encoding: "utf8"
      });

      expect(stdout).toMatch(/1 themes/);
      const indexPath = path.join(repoRoot, "registry", "index.json");
      expect(fs.existsSync(indexPath)).toBe(true);
      const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      expect(index.themes[0].id).toBe("fixture-cli");
    });
  });
});
