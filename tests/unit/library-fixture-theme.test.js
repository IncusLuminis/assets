import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { validateManifest, formatErrors } from "../helpers/validator.js";
import { semanticCheck } from "../helpers/semantics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeDir = path.resolve(__dirname, "..", "..", "library", "themes", "fixture-hud");

function loadManifest() {
  const p = path.join(themeDir, "manifest.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

describe("library/themes/fixture-hud -- fixture Theme (Story #5 AC)", () => {
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

  it("id is not one of the reserved hud-NN baseline IDs (those are #11-#15's job)", () => {
    const manifest = loadManifest();
    expect(manifest.id).not.toMatch(/^hud-\d{2}$/);
  });

  it("every entrypoints.markup path resolves to a real file inside the package", () => {
    const manifest = loadManifest();
    for (const [compositionKey, entrypoint] of Object.entries(manifest.entrypoints)) {
      const markupPath = path.join(themeDir, entrypoint.markup);
      expect(
        fs.existsSync(markupPath),
        `${compositionKey}: entrypoints.markup "${entrypoint.markup}" does not exist on disk`
      ).toBe(true);
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
});
