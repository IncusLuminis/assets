/**
 * Unit tests for `scripts/deploy/verify.mjs` -- the post-deploy
 * verification step (issue #7 AC: fetch `registry/index.json` + one
 * versioned asset, assert HTTP 200 + content-hash match). Exercised
 * entirely in isolation: `verifyDeployment()` takes an injectable
 * `fetchImpl`, so these tests never make a real network call.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  hashFile,
  hashContent,
  buildChecksFromStagedRegistry,
  verifyDeployment,
  VerificationError
} from "../../scripts/deploy/verify.mjs";
import { makeTempRepoRoot, rmTempRepoRoot } from "../helpers/build-fixtures.js";

const tempDirs = [];
afterEach(() => {
  while (tempDirs.length > 0) rmTempRepoRoot(tempDirs.pop());
});

function newStageDir() {
  const dir = makeTempRepoRoot();
  tempDirs.push(dir);
  return dir;
}

function writeStagedFixture(stageDir, { themeManifest = '{"id":"hud-01","version":"0.1.0"}' } = {}) {
  const registryIndex = {
    schemaVersion: "1.0",
    themes: [
      {
        id: "hud-01",
        latest: "0.1.0",
        manifest: "/themes/hud-01/0.1.0/manifest.json",
        versions: [{ version: "0.1.0", manifest: "/themes/hud-01/0.1.0/manifest.json", package: "/themes/hud-01/0.1.0/" }]
      }
    ]
  };
  fs.mkdirSync(path.join(stageDir, "registry"), { recursive: true });
  fs.writeFileSync(path.join(stageDir, "registry", "index.json"), JSON.stringify(registryIndex, null, 2));
  fs.mkdirSync(path.join(stageDir, "themes", "hud-01", "0.1.0"), { recursive: true });
  fs.writeFileSync(path.join(stageDir, "themes", "hud-01", "0.1.0", "manifest.json"), themeManifest);
  return registryIndex;
}

describe("verify.mjs -- buildChecksFromStagedRegistry() (pure fs, no network)", () => {
  it("returns registry/index.json + the first theme's manifest.json, with correct sha256 hashes", () => {
    const stageDir = newStageDir();
    writeStagedFixture(stageDir);

    const checks = buildChecksFromStagedRegistry(stageDir);

    expect(checks.map((c) => c.path)).toEqual(["registry/index.json", "themes/hud-01/0.1.0/manifest.json"]);
    expect(checks[0].expectedHash).toBe(hashFile(path.join(stageDir, "registry", "index.json")));
    expect(checks[1].expectedHash).toBe(hashFile(path.join(stageDir, "themes", "hud-01", "0.1.0", "manifest.json")));
  });

  it("returns only registry/index.json when the staged registry index has no themes", () => {
    const stageDir = newStageDir();
    fs.mkdirSync(path.join(stageDir, "registry"), { recursive: true });
    fs.writeFileSync(path.join(stageDir, "registry", "index.json"), JSON.stringify({ schemaVersion: "1.0", themes: [] }));

    const checks = buildChecksFromStagedRegistry(stageDir);
    expect(checks.map((c) => c.path)).toEqual(["registry/index.json"]);
  });

  it("throws VerificationError when registry/index.json is missing from the staged dir", () => {
    const stageDir = newStageDir();
    expect(() => buildChecksFromStagedRegistry(stageDir)).toThrow(VerificationError);
  });

  it("throws VerificationError when the registry index references an asset that isn't actually staged", () => {
    const stageDir = newStageDir();
    fs.mkdirSync(path.join(stageDir, "registry"), { recursive: true });
    fs.writeFileSync(
      path.join(stageDir, "registry", "index.json"),
      JSON.stringify({ schemaVersion: "1.0", themes: [{ id: "hud-01", manifest: "/themes/hud-01/0.1.0/manifest.json" }] })
    );
    // deliberately do NOT write themes/hud-01/0.1.0/manifest.json
    expect(() => buildChecksFromStagedRegistry(stageDir)).toThrow(VerificationError);
  });
});

describe("verify.mjs -- verifyDeployment() (mocked fetch, no network)", () => {
  it("succeeds when every check returns HTTP 200 with matching content", async () => {
    const registryBody = '{"schemaVersion":"1.0","themes":[]}';
    const checks = [{ path: "registry/index.json", expectedHash: hashContent(registryBody) }];

    const fetchImpl = async (url) => {
      expect(url).toBe("https://assets-4gy.pages.dev/registry/index.json");
      return { status: 200, arrayBuffer: async () => Buffer.from(registryBody) };
    };

    const { ok, results } = await verifyDeployment({ baseUrl: "https://assets-4gy.pages.dev", checks, fetchImpl });
    expect(ok).toBe(true);
    expect(results).toEqual([{ path: "registry/index.json", ok: true, status: 200, actualHash: hashContent(registryBody) }]);
  });

  it("fails and reports a non-200 status", async () => {
    const checks = [{ path: "registry/index.json", expectedHash: "deadbeef" }];
    const fetchImpl = async () => ({ status: 404, arrayBuffer: async () => Buffer.from("") });

    const { ok, results } = await verifyDeployment({ baseUrl: "https://assets-4gy.pages.dev", checks, fetchImpl });
    expect(ok).toBe(false);
    expect(results[0].ok).toBe(false);
    expect(results[0].status).toBe(404);
    expect(results[0].error).toMatch(/expected HTTP 200, got 404/);
  });

  it("fails and reports a content-hash mismatch when the body doesn't match what was staged", async () => {
    const staged = "staged-content";
    const publishedButDifferent = "published-content-that-drifted";
    const checks = [{ path: "themes/hud-01/0.1.0/manifest.json", expectedHash: hashContent(staged) }];
    const fetchImpl = async () => ({ status: 200, arrayBuffer: async () => Buffer.from(publishedButDifferent) });

    const { ok, results } = await verifyDeployment({ baseUrl: "https://assets-4gy.pages.dev", checks, fetchImpl });
    expect(ok).toBe(false);
    expect(results[0].ok).toBe(false);
    expect(results[0].status).toBe(200);
    expect(results[0].error).toMatch(/content-hash mismatch/);
    expect(results[0].actualHash).toBe(hashContent(publishedButDifferent));
  });

  it("catches a transport-level fetch throw and folds it into that check's result rather than throwing", async () => {
    const checks = [{ path: "registry/index.json", expectedHash: "deadbeef" }];
    const fetchImpl = async () => {
      throw new Error("ECONNREFUSED (simulated)");
    };

    const { ok, results } = await verifyDeployment({ baseUrl: "https://assets-4gy.pages.dev", checks, fetchImpl });
    expect(ok).toBe(false);
    expect(results[0].error).toMatch(/ECONNREFUSED/);
  });

  it("checks every entry independently -- one failing check doesn't stop the others from being reported", async () => {
    const goodBody = "good";
    const checks = [
      { path: "registry/index.json", expectedHash: hashContent(goodBody) },
      { path: "themes/hud-01/0.1.0/manifest.json", expectedHash: "deadbeef" }
    ];
    const fetchImpl = async (url) => {
      if (url.endsWith("registry/index.json")) return { status: 200, arrayBuffer: async () => Buffer.from(goodBody) };
      return { status: 200, arrayBuffer: async () => Buffer.from("mismatched") };
    };

    const { ok, results } = await verifyDeployment({ baseUrl: "https://assets-4gy.pages.dev/", checks, fetchImpl });
    expect(ok).toBe(false);
    expect(results).toHaveLength(2);
    expect(results[0].ok).toBe(true);
    expect(results[1].ok).toBe(false);
  });
});
