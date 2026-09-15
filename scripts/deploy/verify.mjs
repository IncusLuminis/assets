#!/usr/bin/env node
/**
 * Post-deploy verification (issue #7 AC: "fetch registry/index.json + one
 * versioned asset, assert HTTP 200 + content-hash match", Arch §33/§49).
 *
 * Kept as a standalone Node module (not inline bash) because the check
 * itself -- HTTP fetch + sha256 content-hash compare -- is naturally
 * testable in isolation with a mocked `fetch`, per this Story's AC ("unit-
 * test it in isolation with a mocked HTTP fetch... success case... and at
 * least one failure case"). `deploy-registry.sh` shells out to this file's
 * CLI mode after a REAL `wrangler pages deploy`; it is never invoked in
 * `--dry-run` mode (there is nothing deployed yet to verify).
 *
 * Two layers, both exported so tests can exercise each independently:
 *   - `buildChecksFromStagedRegistry(stageDir)`   pure fs, no network --
 *     decides *what* to verify: registry/index.json + one versioned asset
 *     PER Theme (every theme's manifest.json, not just the first) per the
 *     staged registry/index.json -- see its own doc comment for why "every
 *     Theme" matters here.
 *   - `verifyDeployment({ baseUrl, checks, fetchImpl })`   pure fetch +
 *     hash-compare, no fs -- decides whether the *published* content
 *     matches. `fetchImpl` defaults to the global `fetch` but is injectable
 *     so tests never need real network access.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export class VerificationError extends Error {}

/** sha256 of a file's bytes, as a lowercase hex string. */
export function hashFile(absPath) {
  return createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
}

/** sha256 of an in-memory buffer/string, as a lowercase hex string. */
export function hashContent(content) {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Decides what a post-deploy verification run should check, from an
 * already-staged directory (the same tree `deploy-registry.sh` hands to
 * `wrangler pages deploy`):
 *
 *   - `registry/index.json` itself (the mutable discovery metadata, Arch
 *     §34) -- always checked.
 *   - "one versioned asset" per Theme (the AC's wording, applied to EVERY
 *     Theme the staged registry index lists -- not only the first). Each
 *     Theme's own `manifest` path recorded in the staged
 *     `registry/index.json` (`themes[i].manifest`, e.g.
 *     "/themes/hud-01/0.1.0/manifest.json") is checked. Checking every
 *     Theme, not just `themes[0]`, matters: a post-deploy verification step
 *     that can only ever catch corruption in one Theme leaves the rest
 *     structurally unmonitored, defeating the point of the check (Arch §49
 *     "a Theme failing validation MUST NOT be partially published" --
 *     verify is the last line of defense that a *publish* didn't partially
 *     or incorrectly land, and it needs to actually look at every Theme to
 *     do that). Picking assets *from* the staged registry index (rather
 *     than hard-coding Theme ids) means this stays correct as Themes are
 *     added/removed/reordered -- and it doubles as an implicit check that
 *     every Theme's registry-index entry resolves to a real staged file
 *     (Arch §34 "immutable versioned assets" example path).
 *
 * Returns just the `registry/index.json` check (rather than throwing) if
 * the staged registry index has no themes -- `deploy-registry.sh` still
 * verifies `registry/index.json` alone in that (0.1-unrealistic) case.
 *
 * Throws `VerificationError` -- never an uncaught `SyntaxError` -- if the
 * staged registry index is missing, is not valid JSON, or references a
 * Theme asset that isn't actually staged.
 */
export function buildChecksFromStagedRegistry(stageDir) {
  const registryRelPath = "registry/index.json";
  const registryAbsPath = path.join(stageDir, "registry", "index.json");
  if (!fs.existsSync(registryAbsPath)) {
    throw new VerificationError(`staged registry index not found at ${registryAbsPath}`);
  }

  const checks = [
    { path: registryRelPath, absPath: registryAbsPath, expectedHash: hashFile(registryAbsPath) }
  ];

  let index;
  try {
    index = JSON.parse(fs.readFileSync(registryAbsPath, "utf8"));
  } catch (err) {
    throw new VerificationError(
      `staged registry index at ${registryAbsPath} is not valid JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const themes = Array.isArray(index.themes) ? index.themes : [];
  for (const theme of themes) {
    if (!theme?.manifest) continue;
    const assetRelPath = String(theme.manifest).replace(/^\/+/, ""); // "themes/hud-01/0.1.0/manifest.json"
    const assetAbsPath = path.join(stageDir, ...assetRelPath.split("/"));
    if (!fs.existsSync(assetAbsPath)) {
      throw new VerificationError(
        `staged registry index references "${theme.manifest}" for theme "${theme.id}" but it was not found at ${assetAbsPath}`
      );
    }
    checks.push({ path: assetRelPath, absPath: assetAbsPath, expectedHash: hashFile(assetAbsPath) });
  }

  return checks;
}

/**
 * Fetches each `check.path` under `baseUrl` and asserts HTTP 200 + a sha256
 * content-hash match against `check.expectedHash`. Never throws on a
 * verification failure (a failed deploy-verify is a reported result, not a
 * programming error) -- only on a transport-level throw from `fetchImpl`
 * itself, which is caught per-check and folded into that check's result.
 *
 * @param {{baseUrl: string, checks: Array<{path: string, expectedHash: string}>, fetchImpl?: typeof fetch}} opts
 * @returns {Promise<{ok: boolean, results: Array<{path: string, ok: boolean, status?: number, actualHash?: string, error?: string}>}>}
 */
export async function verifyDeployment({ baseUrl, checks, fetchImpl }) {
  const doFetch = fetchImpl ?? fetch;
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  const results = [];
  for (const check of checks) {
    const url = new URL(check.path.replace(/^\/+/, ""), base).toString();
    try {
      const res = await doFetch(url);
      if (res.status !== 200) {
        results.push({
          path: check.path,
          ok: false,
          status: res.status,
          error: `expected HTTP 200, got ${res.status}`
        });
        continue;
      }
      const body = Buffer.from(await res.arrayBuffer());
      const actualHash = hashContent(body);
      if (actualHash !== check.expectedHash) {
        results.push({
          path: check.path,
          ok: false,
          status: res.status,
          actualHash,
          error: `content-hash mismatch: expected ${check.expectedHash}, got ${actualHash}`
        });
        continue;
      }
      results.push({ path: check.path, ok: true, status: res.status, actualHash });
    } catch (err) {
      results.push({ path: check.path, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return { ok: results.every((r) => r.ok), results };
}

// --- CLI entry (invoked by deploy-registry.sh after a real deploy) --------

function parseCliArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const [, key, value] = arg.match(/^--([^=]+)=(.*)$/) ?? [];
    if (key) out[key] = value;
  }
  return out;
}

function isMainModule() {
  return Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

async function main() {
  const { "stage-dir": stageDir, "base-url": baseUrl } = parseCliArgs(process.argv.slice(2));
  if (!stageDir || !baseUrl) {
    console.error("verify.mjs: usage: node verify.mjs --stage-dir=<path> --base-url=<url>");
    process.exitCode = 2;
    return;
  }

  const checks = buildChecksFromStagedRegistry(stageDir);
  console.log(`[verify] checking ${checks.length} path(s) against ${baseUrl}`);
  const { ok, results } = await verifyDeployment({ baseUrl, checks });
  for (const r of results) {
    console.log(`  ${r.ok ? "OK  " : "FAIL"} ${r.path}${r.status ? ` (HTTP ${r.status})` : ""}${r.error ? ` -- ${r.error}` : ""}`);
  }
  if (!ok) {
    console.error("[verify] FAILED -- published content did not match what was staged.");
    process.exitCode = 1;
    return;
  }
  console.log("[verify] OK -- published content matches staged output.");
}

if (isMainModule()) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.stack : String(err));
    process.exitCode = 1;
  });
}
