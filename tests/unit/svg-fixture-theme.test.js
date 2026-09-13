import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { validateManifest, formatErrors } from "../helpers/validator.js";
import { semanticCheck } from "../helpers/semantics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeDir = path.resolve(__dirname, "..", "..", "library", "themes", "fixture-svg-hud");

function loadManifest() {
  const p = path.join(themeDir, "manifest.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

describe("library/themes/fixture-svg-hud -- SVG-engine fixture Theme (Story #9 AC)", () => {
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

  it("engine is svg and isolation is scoped-root (Contract §27.8 rule 9: svg + skyViewer/dataSource => scoped-root)", () => {
    const manifest = loadManifest();
    expect(manifest.engine).toBe("svg");
    expect(manifest.isolation).toBe("scoped-root");
  });

  it("declares overflowVisible: true (the glow-runner layer paints outside its box, Contract §15.5)", () => {
    const manifest = loadManifest();
    expect(manifest.overflowVisible).toBe(true);
  });

  it("declares skyViewer + a dataSource provider so the lazy external-resource hook is exercised (Contract §10)", () => {
    const manifest = loadManifest();
    expect(manifest.capabilities.skyViewer).toBe(true);
    expect(manifest.capabilities.dataSource.providers).toContain("simbad");
    expect(manifest.capabilities.dataSource.hosts).toContain("simbad.cds.unistra.fr");
  });

  it("every entrypoints.markup / styles / scripts path resolves to a real file inside the package", () => {
    const manifest = loadManifest();
    for (const [compositionKey, entrypoint] of Object.entries(manifest.entrypoints)) {
      const markupPath = path.join(themeDir, entrypoint.markup);
      expect(fs.existsSync(markupPath), `${compositionKey}: markup "${entrypoint.markup}" does not exist`).toBe(true);
      for (const stylePath of entrypoint.styles) {
        expect(
          fs.existsSync(path.join(themeDir, stylePath)),
          `${compositionKey}: style "${stylePath}" does not exist`
        ).toBe(true);
      }
      for (const scriptPath of entrypoint.scripts) {
        expect(
          fs.existsSync(path.join(themeDir, scriptPath)),
          `${compositionKey}: script "${scriptPath}" does not exist`
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

  it("every mounted composition's markup carries at least one [data-slot] attribute (proves slot mapping has something to map onto)", () => {
    const manifest = loadManifest();
    for (const [compositionKey, entrypoint] of Object.entries(manifest.entrypoints)) {
      const html = fs.readFileSync(path.join(themeDir, entrypoint.markup), "utf8");
      expect(html, `${compositionKey}: no data-slot attribute found`).toMatch(/data-slot="/);
    }
  });
});
