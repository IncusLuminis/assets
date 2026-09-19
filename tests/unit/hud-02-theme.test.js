import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { validateManifest, formatErrors } from "../helpers/validator.js";
import { semanticCheck } from "../helpers/semantics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeDir = path.resolve(__dirname, "..", "..", "library", "themes", "hud-02");

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(themeDir, "manifest.json"), "utf8"));
}

describe("library/themes/hud-02 -- 'Object Report' (Story #12 AC)", () => {
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

  it("id is the reserved hud-02 baseline id, engine svg, isolation scoped-root (Contract §27.8 rule 9)", () => {
    const manifest = loadManifest();
    expect(manifest.id).toBe("hud-02");
    expect(manifest.engine).toBe("svg");
    expect(manifest.isolation).toBe("scoped-root");
  });

  it("declares overflowVisible: true (separate contour-runner overlay SVG paints outside its box, Contract §15.5)", () => {
    const manifest = loadManifest();
    expect(manifest.overflowVisible).toBe(true);
  });

  it("declares all three REQUIRED compositions supported:true, per Contract §8.2", () => {
    const manifest = loadManifest();
    expect(manifest.compositions["maxi:landscape"].supported).toBe(true);
    expect(manifest.compositions["mini:landscape"].supported).toBe(true);
    expect(manifest.compositions["micro:portrait"].supported).toBe(true);
  });

  it("declares maxi:portrait unsupported with a matching no-maxi-portrait knownDeviations entry (Contract §8.3)", () => {
    const manifest = loadManifest();
    expect(manifest.compositions["maxi:portrait"].supported).toBe(false);
    expect(manifest.knownDeviations.some((d) => d.code === "no-maxi-portrait")).toBe(true);
  });

  it("Story #36: honestly discloses the html-mode-from-first-mount network leak via a distinct external-io-on-mount knownDeviations entry, not an unqualified 'no network in html mode' claim", () => {
    const manifest = loadManifest();
    const htmlModeDeviation = manifest.knownDeviations.find(
      (d) => d.code === "external-io-on-mount" && d.scope === "html-mode-initial-mount"
    );
    expect(htmlModeDeviation).toBeDefined();
    expect(htmlModeDeviation.note.toLowerCase()).toContain("mountcontext");
    // Distinct from the pre-existing object-mode entry, not a replacement.
    expect(
      manifest.knownDeviations.filter((d) => d.code === "external-io-on-mount").length
    ).toBeGreaterThanOrEqual(2);
  });

  it("declares skyViewer + all three dataSource providers (Contract §10, matching §25.2's HUD-02 cross-check row)", () => {
    const manifest = loadManifest();
    expect(manifest.capabilities.skyViewer).toBe(true);
    expect(manifest.capabilities.dataSource.providers.sort()).toEqual(["ads", "simbad", "vizier"]);
    expect(manifest.capabilities.dataSource.input).toBe("objectName");
  });

  it("declares capabilities.modes {object,html} for the dual-personality switch (owner E)", () => {
    const manifest = loadManifest();
    expect(manifest.capabilities.modes.values.sort()).toEqual(["html", "object"]);
    expect(manifest.capabilities.modes.default).toBe("object");
  });

  it("declares multiInstance: true (per-widget factory, every DOM query scoped to root, Contract §16.5)", () => {
    const manifest = loadManifest();
    expect(manifest.capabilities.multiInstance).toBe(true);
  });

  it("Story #43: declares capabilities.mediaEmbed with the HeyGen/YouTube hosts and src-swap lifecycle, matching HUD-04's shape (Contract §10.5, §16.2)", () => {
    const manifest = loadManifest();
    expect(manifest.capabilities.mediaEmbed).toEqual({
      hosts: ["app.heygen.com", "www.youtube.com"],
      lifecycle: "src-swap"
    });
  });

  it("every entrypoints.markup / styles / scripts path resolves to a real file inside the package", () => {
    const manifest = loadManifest();
    for (const [compositionKey, entrypoint] of Object.entries(manifest.entrypoints)) {
      expect(fs.existsSync(path.join(themeDir, entrypoint.markup)), `${compositionKey}: markup missing`).toBe(true);
      for (const stylePath of entrypoint.styles) {
        expect(fs.existsSync(path.join(themeDir, stylePath)), `${compositionKey}: style "${stylePath}" missing`).toBe(true);
      }
      for (const scriptPath of entrypoint.scripts) {
        expect(fs.existsSync(path.join(themeDir, scriptPath)), `${compositionKey}: script "${scriptPath}" missing`).toBe(true);
      }
    }
  });

  it("every composition marked supported:true has a matching <variant>/<orientation>/ directory (Contract §2.2 rule 2)", () => {
    const manifest = loadManifest();
    for (const [compositionKey, composition] of Object.entries(manifest.compositions)) {
      if (!composition.supported) continue;
      const dirPath = path.join(themeDir, composition.dir);
      expect(fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory(), `${compositionKey}: dir missing`).toBe(true);
    }
  });

  it("only maxi:landscape declares a scripts entrypoint -- mini/micro are static (README 'Compositions vs. the real baseline')", () => {
    const manifest = loadManifest();
    expect(manifest.entrypoints["maxi:landscape"].scripts.length).toBeGreaterThan(0);
    expect(manifest.entrypoints["mini:landscape"].scripts).toEqual([]);
    expect(manifest.entrypoints["micro:portrait"].scripts).toEqual([]);
  });

  it("required slot 'title' has a [data-slot=\"title\"] element in every composition's markup", () => {
    const manifest = loadManifest();
    for (const [compositionKey, entrypoint] of Object.entries(manifest.entrypoints)) {
      const html = fs.readFileSync(path.join(themeDir, entrypoint.markup), "utf8");
      expect(html, `${compositionKey}: no [data-slot="title"]`).toMatch(/data-slot="title"/);
    }
  });

  it("maxi:landscape's markup carries a [data-slot] element for every declared optional slot except mode/objectName (which are hidden config inputs)", () => {
    const manifest = loadManifest();
    const html = fs.readFileSync(path.join(themeDir, manifest.entrypoints["maxi:landscape"].markup), "utf8");
    const visibleOptionalSlots = manifest.slots.optional.filter((s) => s !== "mode" && s !== "objectName");
    for (const slot of visibleOptionalSlots) {
      expect(html, `maxi:landscape: no [data-slot="${slot}"]`).toMatch(new RegExp(`data-slot="${slot}"`));
    }
    // mode/objectName are still present, just hidden (README "How mode/objectName reach the script").
    expect(html).toMatch(/data-slot="mode"/);
    expect(html).toMatch(/data-slot="objectName"/);
  });

  it("maxi:landscape's frame is a separate SVG from its runner overlay (Inv §1.14 'different z-index', distinct from hud-01's single-SVG frame+runner)", () => {
    const manifest = loadManifest();
    const html = fs.readFileSync(path.join(themeDir, manifest.entrypoints["maxi:landscape"].markup), "utf8");
    expect(html).toMatch(/<svg class="nc-or-frame-svg"/);
    expect(html).toMatch(/<svg class="nc-or-runner-svg"/);
    const css = fs.readFileSync(path.join(themeDir, "maxi", "landscape", "hud.css"), "utf8");
    expect(css).toMatch(/\.nc-or-frame-svg\s*{[^}]*z-index:\s*1;/);
    expect(css).toMatch(/\.nc-or-runner-svg\s*{[^}]*z-index:\s*40;/);
  });
});
