import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { validateManifest, formatErrors } from "../helpers/validator.js";
import { semanticCheck } from "../helpers/semantics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeDir = path.resolve(__dirname, "..", "..", "library", "themes", "fixture-css-hud");

function loadManifest() {
  const p = path.join(themeDir, "manifest.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

describe("library/themes/fixture-css-hud -- CSS-engine fixture Theme (Story #10 AC)", () => {
  it("its manifest.json validates against registry/schemas/manifest.schema.json", () => {
    const manifest = loadManifest();
    const ok = validateManifest(manifest);
    expect(ok, formatErrors(validateManifest.errors)).toBe(true);
  });

  it("its manifest.json produces no semantic (cross-field) errors", () => {
    const manifest = loadManifest();
    const { errors } = semanticCheck(manifest);
    expect(errors, errors.join("\n")).toEqual([]);
  });

  it("declares engine: \"css\" and isolation: \"shadow-dom-preferred\" (Plan §2 decision 8)", () => {
    const manifest = loadManifest();
    expect(manifest.engine).toBe("css");
    expect(manifest.isolation).toBe("shadow-dom-preferred");
  });

  it("its capabilities.mediaEmbed.hosts are on the Contract §16.2 allowlist", () => {
    const manifest = loadManifest();
    expect(manifest.capabilities.mediaEmbed.hosts).toContain("app.heygen.com");
  });

  it("id is not one of the reserved hud-NN baseline IDs (those are #11-#15's job)", () => {
    const manifest = loadManifest();
    expect(manifest.id).not.toMatch(/^hud-\d{2}$/);
  });

  it("ships the three 1.0-required compositions with real markup + styles on disk", () => {
    const manifest = loadManifest();
    for (const [key, entrypoint] of Object.entries(manifest.entrypoints)) {
      const markupPath = path.join(themeDir, entrypoint.markup);
      expect(fs.existsSync(markupPath), `${key}: markup "${entrypoint.markup}" missing`).toBe(true);
      for (const stylePath of entrypoint.styles) {
        expect(
          fs.existsSync(path.join(themeDir, stylePath)),
          `${key}: style "${stylePath}" missing`
        ).toBe(true);
      }
    }
  });

  it("every composition marked supported:true has a matching <variant>/<orientation>/ directory (Contract §2.2 rule 2)", () => {
    const manifest = loadManifest();
    for (const [compositionKey, composition] of Object.entries(manifest.compositions)) {
      if (!composition.supported) continue;
      const dirPath = path.join(themeDir, composition.dir);
      expect(
        fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory(),
        `${compositionKey}: composition dir "${composition.dir}" does not exist`
      ).toBe(true);
    }
  });

  it("no shipped CSS file contains a host-wide body/html/:root/bare-* selector (Contract §15.4, Arch §42)", () => {
    const manifest = loadManifest();
    const cssFiles = new Set();
    for (const entrypoint of Object.values(manifest.entrypoints)) {
      for (const stylePath of entrypoint.styles) cssFiles.add(stylePath);
    }
    // Matches a bare `body {`, `html {`, `:root {`, or `* {` selector --
    // i.e. one of those tokens as its own compound selector, not merely
    // appearing as a descendant (`.fixture-css-hud * { ... }` is fine and
    // MUST NOT match; a leading, unscoped `* {` MUST).
    const forbidden = /(^|\}|,)\s*(body|html|:root|\*)\s*\{/m;
    for (const relPath of cssFiles) {
      const text = fs.readFileSync(path.join(themeDir, relPath), "utf8");
      expect(forbidden.test(text), `${relPath} contains a host-wide selector`).toBe(false);
    }
  });
});
