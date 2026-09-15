/**
 * Test-only helpers for `tests/unit/deploy-registry.test.js` -- builds a
 * throwaway fixture repo root that stands in for this repo's own layout
 * (package.json with a `build:all` script, `dist/`, repo-root
 * `registry/index.json`) so `deploy-registry.sh` can be run end-to-end via
 * `--repo-root=` against a scratch directory, never against this actual
 * repo's real `dist/`/`registry/index.json` or the real `assets-4gy`
 * Cloudflare project.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function makeTempRepoRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "hud-story7-"));
}

export function rmTempRepoRoot(repoRoot) {
  fs.rmSync(repoRoot, { recursive: true, force: true });
}

/**
 * A minimal Theme entry as it would appear in a real
 * `registry/index.json` (Arch §28), for one fixture theme.
 */
export function fixtureThemeManifestRelPath(id, version) {
  return `themes/${id}/${version}/manifest.json`;
}

/**
 * Writes a fixture repo root that `deploy-registry.sh --repo-root=<root>`
 * can operate on:
 *
 *   - `package.json` with a `build:all` npm script that runs
 *     `build.mjs` (also written here).
 *   - `build.mjs`: on success, writes `dist/themes/<id>/<version>/manifest.json`
 *     for each of `themes`, `dist/runtime/index.js`, and a matching
 *     repo-root `registry/index.json` -- the same three-part shape
 *     `deploy-registry.sh` is supposed to stage. On failure
 *     (`buildShouldSucceed: false`), it exits 1 without writing anything,
 *     simulating a Theme that fails validation (Story #1's own
 *     `build-theme.ts` behaviour, which this fixture stands in for rather
 *     than re-implements).
 *   - `strayDistFiles`: extra files written directly under `dist/` (NOT
 *     under `dist/themes/` or `dist/runtime/`) by the fixture build, to
 *     prove the staging step's allowlist excludes them -- e.g. a leaked
 *     `.env`, a stray local-artifact file.
 *
 * Returns the manifest content (string) written for the first theme and
 * the registry index content (object), so tests can assert staged file
 * *contents* match, not just presence.
 */
export function writeFixtureRepo(
  repoRoot,
  {
    buildShouldSucceed = true,
    themes = [{ id: "hud-01", version: "0.1.0" }],
    strayDistFiles = {},
    runtimeContent = "console.log('fixture runtime');\n"
  } = {}
) {
  fs.writeFileSync(
    path.join(repoRoot, "package.json"),
    JSON.stringify(
      {
        name: "fixture-repo",
        private: true,
        type: "module",
        scripts: { "build:all": "node build.mjs" }
      },
      null,
      2
    )
  );

  const manifestContents = {};
  for (const theme of themes) {
    manifestContents[theme.id] = JSON.stringify({ id: theme.id, version: theme.version, fixture: true });
  }

  const registryIndex = {
    schemaVersion: "1.0",
    themes: themes.map((t) => ({
      id: t.id,
      latest: t.version,
      manifest: `/${fixtureThemeManifestRelPath(t.id, t.version)}`,
      versions: [
        {
          version: t.version,
          manifest: `/${fixtureThemeManifestRelPath(t.id, t.version)}`,
          package: `/themes/${t.id}/${t.version}/`
        }
      ]
    }))
  };

  const buildScriptLines = [
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    "const root = process.cwd();"
  ];

  if (!buildShouldSucceed) {
    buildScriptLines.push(
      "console.error('[fixture-build] simulated failure -- a theme failed validation');",
      "process.exit(1);"
    );
  } else {
    for (const theme of themes) {
      const dir = `dist/themes/${theme.id}/${theme.version}`;
      buildScriptLines.push(
        `fs.mkdirSync(path.join(root, ${JSON.stringify(dir)}), { recursive: true });`,
        `fs.writeFileSync(path.join(root, ${JSON.stringify(`${dir}/manifest.json`)}), ${JSON.stringify(
          manifestContents[theme.id]
        )});`
      );
    }
    buildScriptLines.push(
      "fs.mkdirSync(path.join(root, 'dist/runtime'), { recursive: true });",
      `fs.writeFileSync(path.join(root, 'dist/runtime/index.js'), ${JSON.stringify(runtimeContent)});`
    );
    for (const [relPath, content] of Object.entries(strayDistFiles)) {
      buildScriptLines.push(
        `fs.mkdirSync(path.dirname(path.join(root, 'dist', ${JSON.stringify(relPath)})), { recursive: true });`,
        `fs.writeFileSync(path.join(root, 'dist', ${JSON.stringify(relPath)}), ${JSON.stringify(content)});`
      );
    }
    buildScriptLines.push(
      "fs.mkdirSync(path.join(root, 'registry'), { recursive: true });",
      `fs.writeFileSync(path.join(root, 'registry/index.json'), ${JSON.stringify(
        JSON.stringify(registryIndex, null, 2)
      )});`,
      "console.log('[fixture-build] ok');"
    );
  }

  fs.writeFileSync(path.join(repoRoot, "build.mjs"), buildScriptLines.join("\n") + "\n");

  return { manifestContents, registryIndex, runtimeContent };
}

/**
 * Writes a fake `wrangler` executable into `binDir` that records every
 * invocation (one line of space-joined argv per call) to `logFile` and
 * exits 0 -- used to prove `deploy-registry.sh` either does or does not
 * reach the real `wrangler pages deploy` call, without ever touching a
 * real `wrangler` binary or Cloudflare.
 */
export function writeFakeWrangler(binDir, logFile) {
  fs.mkdirSync(binDir, { recursive: true });
  const scriptPath = path.join(binDir, "wrangler");
  fs.writeFileSync(
    scriptPath,
    [
      "#!/usr/bin/env bash",
      `printf '%s\\n' "$*" >> ${JSON.stringify(logFile)}`,
      "exit 0",
      ""
    ].join("\n")
  );
  fs.chmodSync(scriptPath, 0o755);
  return scriptPath;
}
