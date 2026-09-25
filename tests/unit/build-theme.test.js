import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { describe, it, expect, afterEach } from "vitest";
import { buildTheme, discoverThemeIds, ThemeBuildError } from "../../scripts/build/build-theme.ts";
import {
  makeTempRepoRoot,
  rmTempRepoRoot,
  minimalValidManifest,
  minimalValidFiles,
  writeThemeSource,
  readDirAsBufferMap
} from "../helpers/build-fixtures.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const BUILD_THEME_SCRIPT = path.join(REPO_ROOT, "scripts", "build", "build-theme.ts");

const tempRoots = [];
function newTempRepoRoot() {
  const root = makeTempRepoRoot();
  tempRoots.push(root);
  return root;
}
afterEach(() => {
  while (tempRoots.length > 0) rmTempRepoRoot(tempRoots.pop());
});

describe("build-theme.ts -- buildTheme() (issue #1 AC, prerequisite Theme-packaging step)", () => {
  it("happy path: packages a valid Theme source into dist/themes/<id>/<version>/ with the Contract §2.2 layout", () => {
    const repoRoot = newTempRepoRoot();
    writeThemeSource(repoRoot, "fixture-x", {
      manifest: minimalValidManifest({ id: "fixture-x", version: "0.1.0" }),
      files: minimalValidFiles("fixture-x")
    });

    const result = buildTheme("fixture-x", { repoRoot });

    expect(result.id).toBe("fixture-x");
    expect(result.version).toBe("0.1.0");
    expect(result.outputDir).toBe(path.join(repoRoot, "dist", "themes", "fixture-x", "0.1.0"));
    expect(result.files).toEqual([
      "manifest.json",
      "maxi/landscape/hud.html",
      "micro/portrait/hud.html",
      "mini/landscape/hud.html"
    ]);

    for (const rel of result.files) {
      expect(fs.existsSync(path.join(result.outputDir, ...rel.split("/"))), rel).toBe(true);
    }
    const writtenManifest = JSON.parse(fs.readFileSync(path.join(result.outputDir, "manifest.json"), "utf8"));
    expect(writtenManifest.id).toBe("fixture-x");
  });

  it("copies optional root dirs (assets/styles/scripts/preview) when present, and never copies sources/ or README.md", () => {
    const repoRoot = newTempRepoRoot();
    const manifest = minimalValidManifest({ id: "fixture-optdirs" });
    manifest.entrypoints["maxi:landscape"].styles = ["styles/shared.css"];
    manifest.entrypoints["maxi:landscape"].scripts = ["scripts/main.js"];
    writeThemeSource(repoRoot, "fixture-optdirs", {
      manifest,
      files: {
        ...minimalValidFiles("fixture-optdirs"),
        "styles/shared.css": "/* shared */\n",
        "scripts/main.js": "// main\n",
        "assets/images/logo.svg": "<svg/>\n",
        "preview/maxi-landscape.txt": "preview placeholder\n",
        "sources/original.psd.txt": "not a real package file\n",
        "README.md": "# not part of the published package\n"
      }
    });

    const result = buildTheme("fixture-optdirs", { repoRoot });

    expect(result.files).toContain("styles/shared.css");
    expect(result.files).toContain("scripts/main.js");
    expect(result.files).toContain("assets/images/logo.svg");
    expect(result.files).toContain("preview/maxi-landscape.txt");
    expect(result.files).not.toContain("sources/original.psd.txt");
    expect(result.files).not.toContain("README.md");
    expect(fs.existsSync(path.join(result.outputDir, "sources"))).toBe(false);
    expect(fs.existsSync(path.join(result.outputDir, "README.md"))).toBe(false);
  });

  it("fails closed (throws, writes nothing) when the manifest fails schema validation", () => {
    const repoRoot = newTempRepoRoot();
    const manifest = minimalValidManifest({ id: "fixture-bad" });
    delete manifest.isolation; // required field -- schema violation

    writeThemeSource(repoRoot, "fixture-bad", { manifest, files: minimalValidFiles("fixture-bad") });

    expect(() => buildTheme("fixture-bad", { repoRoot })).toThrow(ThemeBuildError);
    expect(() => buildTheme("fixture-bad", { repoRoot })).toThrow(/manifest.schema.json validation/);
    expect(fs.existsSync(path.join(repoRoot, "dist"))).toBe(false);
  });

  it("fails closed (throws, writes nothing) when an entrypoint references a file that does not exist (missing-asset detection)", () => {
    const repoRoot = newTempRepoRoot();
    const manifest = minimalValidManifest({ id: "fixture-missing" });
    manifest.entrypoints["maxi:landscape"].scripts = ["scripts/does-not-exist.js"];
    writeThemeSource(repoRoot, "fixture-missing", { manifest, files: minimalValidFiles("fixture-missing") });

    let thrown;
    try {
      buildTheme("fixture-missing", { repoRoot });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(ThemeBuildError);
    expect(thrown.message).toMatch(/does not exist/);
    expect(thrown.message).toMatch(/missing-asset detection/);
    expect(fs.existsSync(path.join(repoRoot, "dist"))).toBe(false);
  });

  it("fails closed when a composition marked supported:true has no directory on disk", () => {
    const repoRoot = newTempRepoRoot();
    const manifest = minimalValidManifest({ id: "fixture-nodir" });
    writeThemeSource(repoRoot, "fixture-nodir", {
      manifest,
      // Deliberately omit maxi/landscape/hud.html + its directory.
      files: {
        "mini/landscape/hud.html": minimalValidFiles("fixture-nodir")["mini/landscape/hud.html"],
        "micro/portrait/hud.html": minimalValidFiles("fixture-nodir")["micro/portrait/hud.html"]
      }
    });

    expect(() => buildTheme("fixture-nodir", { repoRoot })).toThrow(/does not exist/);
    expect(fs.existsSync(path.join(repoRoot, "dist"))).toBe(false);
  });

  it("fails closed when manifest.json is not valid JSON", () => {
    const repoRoot = newTempRepoRoot();
    const themeDir = path.join(repoRoot, "library", "themes", "fixture-badjson");
    fs.mkdirSync(themeDir, { recursive: true });
    fs.writeFileSync(path.join(themeDir, "manifest.json"), "{ not json");

    expect(() => buildTheme("fixture-badjson", { repoRoot })).toThrow(/not valid JSON/);
  });

  it("fails closed when manifest.id does not match its directory name", () => {
    const repoRoot = newTempRepoRoot();
    const manifest = minimalValidManifest({ id: "wrong-id" });
    writeThemeSource(repoRoot, "fixture-dirname", { manifest, files: minimalValidFiles("wrong-id") });

    expect(() => buildTheme("fixture-dirname", { repoRoot })).toThrow(/does not match its directory name/);
  });

  it("throws (no crash) for a Theme id with no manifest.json at all", () => {
    const repoRoot = newTempRepoRoot();
    fs.mkdirSync(path.join(repoRoot, "library", "themes"), { recursive: true });
    expect(() => buildTheme("nonexistent", { repoRoot })).toThrow(/no manifest.json/);
  });

  it("determinism: building the same source twice produces byte-identical output (not just claimed)", () => {
    const repoRoot = newTempRepoRoot();
    const manifest = minimalValidManifest({ id: "fixture-det" });
    manifest.entrypoints["maxi:landscape"].styles = ["styles/shared.css"];
    writeThemeSource(repoRoot, "fixture-det", {
      manifest,
      files: {
        ...minimalValidFiles("fixture-det"),
        "styles/shared.css": "/* shared */\n",
        "assets/a.txt": "a\n",
        "assets/nested/b.txt": "b\n"
      }
    });

    const first = buildTheme("fixture-det", { repoRoot });
    const firstFiles = readDirAsBufferMap(first.outputDir);
    fs.rmSync(path.join(repoRoot, "dist"), { recursive: true, force: true });

    const second = buildTheme("fixture-det", { repoRoot });
    const secondFiles = readDirAsBufferMap(second.outputDir);

    expect(Object.keys(secondFiles).sort()).toEqual(Object.keys(firstFiles).sort());
    expect(first.files).toEqual(second.files); // same sorted file-list order too
    for (const rel of Object.keys(firstFiles)) {
      expect(secondFiles[rel].equals(firstFiles[rel]), `${rel} differs between runs`).toBe(true);
    }
  });

  it("discoverThemeIds() finds every library/themes/<id>/ with a manifest.json, sorted", () => {
    const repoRoot = newTempRepoRoot();
    writeThemeSource(repoRoot, "zzz-theme", { manifest: minimalValidManifest({ id: "zzz-theme" }), files: minimalValidFiles("zzz-theme") });
    writeThemeSource(repoRoot, "aaa-theme", { manifest: minimalValidManifest({ id: "aaa-theme" }), files: minimalValidFiles("aaa-theme") });
    fs.mkdirSync(path.join(repoRoot, "library", "themes", "no-manifest-here"), { recursive: true });

    expect(discoverThemeIds(repoRoot)).toEqual(["aaa-theme", "zzz-theme"]);
  });

  it("real Theme: builds hud-01 from this repo's actual library/themes/hud-01/ (proves the pipeline on real content)", () => {
    const tempOut = newTempRepoRoot();
    const distRoot = path.join(tempOut, "dist");

    const result = buildTheme("hud-01", { repoRoot: REPO_ROOT, distRoot });

    expect(result.version).toBe("0.1.1");
    expect(result.files).toContain("scripts/hud-01.js");
    expect(result.files).toContain("styles/shared.css");
    expect(result.files).toContain("maxi/landscape/hud.html");
    // Output landed under the temp distRoot, not wherever this repo's own
    // (gitignored, possibly already-populated from a real `npm run build`)
    // dist/ happens to be -- this test never writes there.
    expect(result.outputDir.startsWith(distRoot)).toBe(true);
  });

  describe("CLI (real process, `node scripts/build/build-theme.ts`)", () => {
    it("fails closed with a non-zero exit code and writes no output for an invalid manifest", () => {
      const repoRoot = newTempRepoRoot();
      const manifest = minimalValidManifest({ id: "fixture-cli-bad" });
      delete manifest.isolation;
      writeThemeSource(repoRoot, "fixture-cli-bad", { manifest, files: minimalValidFiles("fixture-cli-bad") });

      let error;
      try {
        execFileSync(
          process.execPath,
          [BUILD_THEME_SCRIPT, `--repo-root=${repoRoot}`, "fixture-cli-bad"],
          { encoding: "utf8", stdio: "pipe" }
        );
      } catch (err) {
        error = err;
      }

      expect(error, "CLI should have exited non-zero").toBeDefined();
      expect(error.status).not.toBe(0);
      expect(error.stderr).toMatch(/manifest.schema.json validation/);
      expect(fs.existsSync(path.join(repoRoot, "dist"))).toBe(false);
    });

    it("exits 0 and writes the package for a valid Theme", () => {
      const repoRoot = newTempRepoRoot();
      writeThemeSource(repoRoot, "fixture-cli-good", {
        manifest: minimalValidManifest({ id: "fixture-cli-good" }),
        files: minimalValidFiles("fixture-cli-good")
      });

      const stdout = execFileSync(
        process.execPath,
        [BUILD_THEME_SCRIPT, `--repo-root=${repoRoot}`, "fixture-cli-good"],
        { encoding: "utf8" }
      );

      expect(stdout).toMatch(/fixture-cli-good@0\.1\.0/);
      expect(fs.existsSync(path.join(repoRoot, "dist", "themes", "fixture-cli-good", "0.1.0", "manifest.json"))).toBe(true);
    });
  });
});
