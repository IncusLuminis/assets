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

/** Same string-sort order `fs.readdirSync(...).sort()` produces. */
function byId(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Writes a fixture repo root that `deploy-registry.sh --repo-root=<root>`
 * can operate on:
 *
 *   - `package.json` with a `build:all` npm script that runs
 *     `build.mjs` (also written here).
 *   - `build.mjs`, on success (`buildShouldSucceed: true`, the default):
 *     writes `dist/themes/<id>/<version>/manifest.json` for each of
 *     `themes` and `dist/runtime/index.js`, then -- deliberately -- does
 *     an UNRESTRICTED scan of whatever ends up under `dist/themes/**`
 *     (mirroring the real `build-registry.ts`'s own directory-discovery,
 *     which is not scoped to a known-theme-id allowlist) to generate
 *     `registry/index.json`. This means anything already sitting under
 *     `dist/themes/` *before* `writeFixtureRepo`/the build ran -- e.g. a
 *     test that plants a stale directory there first -- gets swept into
 *     the generated registry index exactly like the real pipeline does,
 *     so tests against this fixture faithfully reproduce (or prove fixed)
 *     the "stale dist/ survives an incremental build" failure mode.
 *   - `buildProducesNothing: true`: the build script exits 0 (reports
 *     success) but writes no `dist/`/`registry/` output at all --
 *     simulates a build tool that lies about success, for testing
 *     `deploy-registry.sh`'s own "build output missing" guard.
 *   - `buildShouldSucceed: false`: exits 1 without writing anything,
 *     simulating a Theme that fails validation (Story #1's own
 *     `build-theme.ts` behaviour, which this fixture stands in for rather
 *     than re-implements).
 *   - `strayDistFiles`: extra files written directly under `dist/` (NOT
 *     under `dist/themes/` or `dist/runtime/`) by the fixture build, to
 *     prove the staging step's allowlist excludes them -- e.g. a leaked
 *     `.env`, a stray local-artifact file.
 *
 * Returns the manifest content (string, per theme id) and the registry
 * index content this build produces WHEN NOTHING is pre-planted under
 * `dist/themes/` beforehand -- i.e. the normal case. A test that
 * pre-plants a stray directory before calling the deploy script must
 * assert that stray's absence directly rather than relying on this
 * return value (which intentionally does not know about it).
 */
export function writeFixtureRepo(
  repoRoot,
  {
    buildShouldSucceed = true,
    buildProducesNothing = false,
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

  const sortedThemes = [...themes].sort(byId);
  const registryIndex = {
    schemaVersion: "1.0",
    themes: sortedThemes.map((t) => ({
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
  } else if (buildProducesNothing) {
    buildScriptLines.push(
      "console.log('[fixture-build] simulated: reports success but writes no output at all');"
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
    // Deliberately UNRESTRICTED discovery over dist/themes/** -- mirrors
    // build-registry.ts's real behaviour (not scoped to a known-id
    // allowlist), so anything already present under dist/themes/ before
    // this build ran (e.g. a test-planted stale directory) is picked up
    // here exactly as it would be by the real pipeline.
    buildScriptLines.push(
      "const themesRoot = path.join(root, 'dist', 'themes');",
      "const discovered = [];",
      "if (fs.existsSync(themesRoot)) {",
      "  for (const idDir of fs.readdirSync(themesRoot).sort()) {",
      "    const idPath = path.join(themesRoot, idDir);",
      "    if (!fs.statSync(idPath).isDirectory()) continue;",
      "    for (const versionDir of fs.readdirSync(idPath).sort()) {",
      "      const versionPath = path.join(idPath, versionDir);",
      "      const manifestPath = path.join(versionPath, 'manifest.json');",
      "      if (!fs.existsSync(manifestPath)) continue;",
      "      const manifestRel = '/themes/' + idDir + '/' + versionDir + '/manifest.json';",
      "      discovered.push({",
      "        id: idDir,",
      "        latest: versionDir,",
      "        manifest: manifestRel,",
      "        versions: [{ version: versionDir, manifest: manifestRel, package: '/themes/' + idDir + '/' + versionDir + '/' }]",
      "      });",
      "    }",
      "  }",
      "}",
      "fs.mkdirSync(path.join(root, 'registry'), { recursive: true });",
      "fs.writeFileSync(path.join(root, 'registry', 'index.json'), JSON.stringify({ schemaVersion: '1.0', themes: discovered }, null, 2));",
      "console.log('[fixture-build] ok, discovered ' + discovered.length + ' theme package(s) under dist/themes/');"
    );
  }

  fs.writeFileSync(path.join(repoRoot, "build.mjs"), buildScriptLines.join("\n") + "\n");

  return { manifestContents, registryIndex, runtimeContent };
}

/**
 * Plants a directory directly under `<repoRoot>/dist/themes/<id>/<version>/`
 * with a `manifest.json`, BEFORE `deploy-registry.sh` (or its fixture
 * `build:all`) ever runs -- simulating stale/bogus build output already
 * sitting on a dev machine (a half-finished experiment, a renamed/removed
 * Theme's leftover package) that predates the current deploy run.
 */
export function plantStaleThemeDir(repoRoot, id = "hud-99-stale", version = "9.9.9", manifestContent = '{"id":"hud-99-stale","stale":true}') {
  const dir = path.join(repoRoot, "dist", "themes", id, version);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "manifest.json"), manifestContent);
  return dir;
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
