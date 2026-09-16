/**
 * End-to-end tests of `scripts/deploy/deploy-registry.sh`, run as a real
 * subprocess against a throwaway fixture repo root (`--repo-root=`, never
 * this actual repo's `dist/`/`registry/index.json`). `wrangler` is fully
 * mocked -- a fake executable placed first on the child process's `PATH`
 * that only records its argv and exits 0 (see
 * `tests/helpers/deploy-fixtures.js#writeFakeWrangler`) -- so even a test
 * that exercises the *real* (non `--dry-run`) code path never invokes an
 * actual `wrangler` binary, never authenticates, and never makes a
 * Cloudflare network call (issue #7 AC; this Story's hard boundary).
 *
 * The one real `fetch()` in play is the post-deploy verify step
 * (`verify.mjs`, exercised end-to-end in the "full pipeline" tests below)
 * -- pointed at a `127.0.0.1` loopback HTTP server this test process
 * starts and fully controls, never the public internet.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { describe, it, expect, afterEach } from "vitest";
import {
  makeTempRepoRoot,
  rmTempRepoRoot,
  writeFixtureRepo,
  writeFakeWrangler,
  fixtureThemeManifestRelPath,
  plantStaleThemeDir
} from "../helpers/deploy-fixtures.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DEPLOY_SCRIPT = path.join(REPO_ROOT, "scripts", "deploy", "deploy-registry.sh");

const cleanups = [];
afterEach(async () => {
  while (cleanups.length > 0) {
    await cleanups.pop()();
  }
});

function newFixtureRoot() {
  const root = makeTempRepoRoot();
  cleanups.push(() => rmTempRepoRoot(root));
  return root;
}

function newFakeWranglerBin() {
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), "hud-story7-fake-wrangler-"));
  const logFile = path.join(binDir, "wrangler.log");
  writeFakeWrangler(binDir, logFile);
  cleanups.push(() => fs.rmSync(binDir, { recursive: true, force: true }));
  return { binDir, logFile };
}

/**
 * Runs deploy-registry.sh, never throwing on non-zero exit -- resolves
 * {status, stdout, stderr}.
 *
 * Deliberately ASYNC (`execFile`, not `execFileSync`): the "full pipeline"
 * tests below run an in-process (same event loop) loopback HTTP server that
 * the child process's post-deploy verify step must be able to reach WHILE
 * the child is still running. `execFileSync` blocks the whole Node.js
 * event loop for as long as the child runs, which would starve that
 * in-process server of the ability to accept/respond to the very request
 * the child is waiting on -- a self-deadlock. `execFile` keeps the event
 * loop free.
 */
function runDeployScript(args, { fakeWranglerBinDir } = {}) {
  const env = {
    ...process.env,
    PATH: fakeWranglerBinDir ? `${fakeWranglerBinDir}:${process.env.PATH}` : process.env.PATH,
    // Belt-and-braces: even though the fake wrangler never talks to
    // Cloudflare, make sure no real credentials are visible to the
    // subprocess tree at all during these tests.
    CLOUDFLARE_API_TOKEN: "",
    CLOUDFLARE_ACCOUNT_ID: ""
  };
  return new Promise((resolve) => {
    execFile(DEPLOY_SCRIPT, args, { env, encoding: "utf8", timeout: 20000 }, (err, stdout, stderr) => {
      resolve({ status: err ? (typeof err.code === "number" ? err.code : 1) : 0, stdout, stderr });
    });
  });
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(abs));
    else out.push(abs);
  }
  return out;
}

describe("deploy-registry.sh -- build -> validate -> stage ordering (issue #7 AC)", () => {
  it("refuses to stage or deploy when the build/validate step fails, and never invokes wrangler", async () => {
    const repoRoot = newFixtureRoot();
    writeFixtureRepo(repoRoot, { buildShouldSucceed: false });
    const { binDir, logFile } = newFakeWranglerBin();

    const result = await runDeployScript([`--repo-root=${repoRoot}`], { fakeWranglerBinDir: binDir });

    expect(result.status).not.toBe(0);
    expect(fs.existsSync(path.join(repoRoot, ".deploy"))).toBe(false);
    expect(fs.existsSync(logFile)).toBe(false);
  });

  it("refuses to stage or deploy when the build reports success but produces no output at all", async () => {
    const repoRoot = newFixtureRoot();
    writeFixtureRepo(repoRoot, { buildProducesNothing: true });
    const { binDir, logFile } = newFakeWranglerBin();

    const result = await runDeployScript([`--repo-root=${repoRoot}`], { fakeWranglerBinDir: binDir });

    expect(result.status).not.toBe(0);
    expect((result.stdout + result.stderr)).toMatch(/expected build output missing/);
    expect(fs.existsSync(path.join(repoRoot, ".deploy"))).toBe(false);
    expect(fs.existsSync(logFile)).toBe(false); // wrangler never reached
  });

  it("REGRESSION: a stale theme directory already under dist/themes/ before the run does NOT survive into the staged output or registry index", async () => {
    const repoRoot = newFixtureRoot();
    writeFixtureRepo(repoRoot, { themes: [{ id: "hud-01", version: "0.1.0" }] });
    // Simulate cruft already sitting on the dev machine BEFORE this deploy
    // run -- a half-finished experiment, a renamed/removed Theme's leftover
    // package -- predating deploy-registry.sh's own build step entirely.
    plantStaleThemeDir(repoRoot, "hud-99-stale", "9.9.9");

    const result = await runDeployScript([`--repo-root=${repoRoot}`, "--dry-run"]);
    expect(result.status).toBe(0);

    const stage = path.join(repoRoot, ".deploy");
    const stagedThemeIds = fs.readdirSync(path.join(stage, "themes")).sort();
    expect(stagedThemeIds).toEqual(["hud-01"]); // NOT ["hud-01", "hud-99-stale"]

    const stagedRegistry = JSON.parse(fs.readFileSync(path.join(stage, "registry", "index.json"), "utf8"));
    expect(stagedRegistry.themes.map((t) => t.id)).toEqual(["hud-01"]);
  });
});

describe("deploy-registry.sh -- allowlist-oriented staging (Arch §44)", () => {
  it("stages exactly themes/, runtime/, registry/index.json, _headers -- stray dist/ files (e.g. a leaked .env) are never staged", async () => {
    const repoRoot = newFixtureRoot();
    const { manifestContents, registryIndex } = writeFixtureRepo(repoRoot, {
      themes: [{ id: "hud-01", version: "0.1.0" }],
      strayDistFiles: {
        ".env": "CLOUDFLARE_API_TOKEN=super-secret\n",
        "notes.txt": "local scratch notes, never meant to publish\n"
      }
    });

    const result = await runDeployScript([`--repo-root=${repoRoot}`, "--dry-run"]);
    expect(result.status).toBe(0);

    const stage = path.join(repoRoot, ".deploy");
    expect(fs.readdirSync(stage).sort()).toEqual(["_headers", "registry", "runtime", "themes"]);

    const stagedFiles = walkFiles(stage).map((f) => path.relative(stage, f));
    expect(stagedFiles).not.toContain(".env");
    expect(stagedFiles.some((f) => f.endsWith(".env"))).toBe(false);
    expect(stagedFiles.some((f) => f.endsWith("notes.txt"))).toBe(false);

    const manifestRel = fixtureThemeManifestRelPath("hud-01", "0.1.0");
    expect(fs.readFileSync(path.join(stage, manifestRel), "utf8")).toBe(manifestContents["hud-01"]);
    expect(JSON.parse(fs.readFileSync(path.join(stage, "registry", "index.json"), "utf8"))).toEqual(registryIndex);

    // The staged _headers file is the real scripts/deploy/_headers (cache
    // policy is a tool-level config, not something that varies with
    // --repo-root fixtures) and sets Cache-Control on the three published
    // path groups (Arch §34, issue #6 AC).
    const stagedHeaders = fs.readFileSync(path.join(stage, "_headers"), "utf8");
    expect(stagedHeaders).toContain("/themes/*");
    expect(stagedHeaders).toContain("immutable");
    expect(stagedHeaders).toContain("/registry/index.json");
    expect(stagedHeaders).toContain("/runtime/*");
  });
});

describe("deploy-registry.sh -- --dry-run mode", () => {
  it("performs build + stage, prints the planned wrangler command, and never invokes wrangler", async () => {
    const repoRoot = newFixtureRoot();
    writeFixtureRepo(repoRoot);
    const { binDir, logFile } = newFakeWranglerBin();

    const result = await runDeployScript([`--repo-root=${repoRoot}`, "--dry-run"], { fakeWranglerBinDir: binDir });

    expect(result.status).toBe(0);
    expect(fs.existsSync(logFile)).toBe(false); // the fake wrangler was never called
    expect(result.stdout).toMatch(/\[dry-run]/);
    expect(result.stdout).toMatch(/wrangler pages deploy/);
    expect(result.stdout).toMatch(/--project-name assets/);
    expect(result.stdout).toMatch(/--commit-dirty=true/);
    // The stage directory is left behind for a human to inspect under dry-run.
    expect(fs.existsSync(path.join(repoRoot, ".deploy", "themes"))).toBe(true);
  });
});

describe("deploy-registry.sh -- full pipeline (mocked wrangler + loopback verify server)", () => {
  function startLoopbackServer(routes) {
    const server = http.createServer((req, res) => {
      const entry = routes[req.url];
      if (!entry) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(entry.status ?? 200, { "content-type": "application/octet-stream" });
      res.end(entry.body);
    });
    return new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve(server));
    });
  }

  it("deploys (via the fake wrangler) then verifies successfully against a matching loopback server, and cleans up .deploy/", async () => {
    const repoRoot = newFixtureRoot();
    const { manifestContents, registryIndex } = writeFixtureRepo(repoRoot, {
      themes: [{ id: "hud-01", version: "0.1.0" }]
    });
    const { binDir, logFile } = newFakeWranglerBin();

    const registryBody = JSON.stringify(registryIndex, null, 2);
    const manifestBody = manifestContents["hud-01"];
    const server = await startLoopbackServer({
      "/registry/index.json": { body: registryBody },
      [`/${fixtureThemeManifestRelPath("hud-01", "0.1.0")}`]: { body: manifestBody }
    });
    cleanups.push(() => new Promise((resolve) => server.close(resolve)));
    const { port } = server.address();

    const result = await runDeployScript(
      [`--repo-root=${repoRoot}`, `--base-url=http://127.0.0.1:${port}`],
      { fakeWranglerBinDir: binDir }
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/\[verify] OK/);

    const log = fs.readFileSync(logFile, "utf8").trim().split("\n");
    expect(log).toHaveLength(1); // wrangler invoked exactly once
    expect(log[0]).toMatch(/^pages deploy /);
    expect(log[0]).toMatch(/--project-name assets/);
    expect(log[0]).toMatch(/--commit-dirty=true/);
    expect(log[0]).toContain(path.join(repoRoot, ".deploy"));

    expect(fs.existsSync(path.join(repoRoot, ".deploy"))).toBe(false); // cleaned up after a successful run
  });

  it("surfaces a non-zero exit when post-deploy verification fails (published content doesn't match staged)", async () => {
    const repoRoot = newFixtureRoot();
    const { registryIndex } = writeFixtureRepo(repoRoot, { themes: [{ id: "hud-01", version: "0.1.0" }] });
    const { binDir, logFile } = newFakeWranglerBin();

    // Server up, but missing the theme manifest route entirely -> 404 there.
    const server = await startLoopbackServer({
      "/registry/index.json": { body: JSON.stringify(registryIndex, null, 2) }
    });
    cleanups.push(() => new Promise((resolve) => server.close(resolve)));
    const { port } = server.address();

    const result = await runDeployScript(
      [`--repo-root=${repoRoot}`, `--base-url=http://127.0.0.1:${port}`],
      { fakeWranglerBinDir: binDir }
    );

    expect(result.status).not.toBe(0);
    expect(fs.existsSync(logFile)).toBe(true); // wrangler (fake) WAS invoked -- the "deploy" itself succeeded
    expect((result.stdout + result.stderr)).toMatch(/verification FAILED/);
  });
});
