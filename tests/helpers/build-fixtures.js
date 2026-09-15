/**
 * Test-only helpers for `tests/unit/build-theme.test.js` and
 * `tests/unit/build-registry.test.js` -- builds throwaway fixture repo
 * roots (`library/themes/<id>/...`, `dist/themes/<id>/<version>/...`) under
 * the OS temp dir, so these tests never touch this actual repo's own
 * `dist/` or `registry/index.json`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** A fresh, empty repo-root-shaped temp directory. Caller must `rmTempRepoRoot`. */
export function makeTempRepoRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "hud-story1-"));
}

export function rmTempRepoRoot(repoRoot) {
  fs.rmSync(repoRoot, { recursive: true, force: true });
}

/**
 * A minimal, schema-valid manifest for a synthetic Theme, covering the
 * three 1.0-required compositions (maxi:landscape, mini:landscape,
 * micro:portrait) with a plain HTML entrypoint each. Callers can override
 * (spread) individual fields.
 */
export function minimalValidManifest({ id, version = "0.1.0" } = {}) {
  return {
    schemaVersion: "1.0",
    contractVersion: "1.0",
    id,
    name: `Fixture ${id}`,
    version,
    engine: "css",
    baseVersion: "1.0.0",
    variants: ["maxi", "mini", "micro"],
    orientations: ["landscape", "portrait"],
    compositions: {
      "maxi:landscape": { dir: "maxi/landscape", supported: true },
      "maxi:portrait": { supported: false, reason: "not-authored" },
      "mini:landscape": { dir: "mini/landscape", supported: true },
      "mini:portrait": { supported: false, reason: "not-authored" },
      "micro:landscape": { supported: false, reason: "not-authored" },
      "micro:portrait": { dir: "micro/portrait", supported: true }
    },
    slots: { required: [], optional: ["title"] },
    capabilities: {},
    entrypoints: {
      "maxi:landscape": { styles: [], markup: "maxi/landscape/hud.html", scripts: [] },
      "mini:landscape": { styles: [], markup: "mini/landscape/hud.html", scripts: [] },
      "micro:portrait": { styles: [], markup: "micro/portrait/hud.html", scripts: [] }
    },
    isolation: "scoped-root",
    knownDeviations: [
      { code: "no-maxi-portrait", scope: "maxi:portrait", clause: "8.3", note: "fixture theme" }
    ]
  };
}

/** The composition markup files `minimalValidManifest`'s entrypoints reference. */
export function minimalValidFiles(id) {
  return {
    "maxi/landscape/hud.html": `<div data-slot="title">${id} maxi</div>\n`,
    "mini/landscape/hud.html": `<div data-slot="title">${id} mini</div>\n`,
    "micro/portrait/hud.html": `<div data-slot="title">${id} micro</div>\n`
  };
}

/**
 * Writes `library/themes/<id>/manifest.json` + `files` (a relPath -> string
 * content map) under `repoRoot`.
 */
export function writeThemeSource(repoRoot, id, { manifest, files = {} }) {
  const themeDir = path.join(repoRoot, "library", "themes", id);
  fs.mkdirSync(themeDir, { recursive: true });
  fs.writeFileSync(path.join(themeDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  for (const [relPath, content] of Object.entries(files)) {
    const abs = path.join(themeDir, ...relPath.split("/"));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return themeDir;
}

/**
 * Writes a `dist/themes/<id>/<version>/` package directly (bypassing
 * `build-theme.ts`) -- used by `build-registry.test.js` to construct
 * `dist/` fixtures (including deliberately broken ones) without needing a
 * valid source Theme to build from first.
 */
export function writeDistThemePackage(repoRoot, id, version, { manifest, files = {} }) {
  const versionDir = path.join(repoRoot, "dist", "themes", id, version);
  fs.mkdirSync(versionDir, { recursive: true });
  fs.writeFileSync(path.join(versionDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  for (const [relPath, content] of Object.entries(files)) {
    const abs = path.join(versionDir, ...relPath.split("/"));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return versionDir;
}

/** Recursively reads every file under `dir` into a `{relPath: Buffer}` map, sorted keys. */
export function readDirAsBufferMap(dir) {
  const out = {};
  function walk(current, rel) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
      const entryAbs = path.join(current, entry.name);
      if (entry.isDirectory()) walk(entryAbs, entryRel);
      else out[entryRel] = fs.readFileSync(entryAbs);
    }
  }
  if (fs.existsSync(dir)) walk(dir, "");
  return out;
}
