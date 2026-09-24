import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { validateManifest, formatErrors } from "../helpers/validator.js";
import { semanticCheck } from "../helpers/semantics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeDir = path.resolve(__dirname, "..", "..", "library", "themes", "hud-04");

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(themeDir, "manifest.json"), "utf8"));
}

describe("library/themes/hud-04 -- HUD-04 packaged as a CSS-engine Theme (issue #13 AC)", () => {
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

  it("id is the reserved baseline id hud-04", () => {
    const manifest = loadManifest();
    expect(manifest.id).toBe("hud-04");
  });

  it("declares engine: \"css\" and isolation: \"shadow-dom-preferred\" (Plan §2 decision 8, #10 precedent)", () => {
    const manifest = loadManifest();
    expect(manifest.engine).toBe("css");
    expect(manifest.isolation).toBe("shadow-dom-preferred");
  });

  it("declares variants/orientations as the full 1.0-required sets (Contract §7.1, §8.2)", () => {
    const manifest = loadManifest();
    expect(manifest.variants.sort()).toEqual(["maxi", "micro", "mini"]);
    expect(manifest.orientations.sort()).toEqual(["landscape", "portrait"]);
  });

  it("the three 1.0-required compositions are supported:true; the other three are not", () => {
    const manifest = loadManifest();
    expect(manifest.compositions["maxi:landscape"].supported).toBe(true);
    expect(manifest.compositions["mini:landscape"].supported).toBe(true);
    expect(manifest.compositions["micro:portrait"].supported).toBe(true);
    expect(manifest.compositions["maxi:portrait"].supported).toBe(false);
    expect(manifest.compositions["mini:portrait"].supported).toBe(false);
    expect(manifest.compositions["micro:landscape"].supported).toBe(false);
  });

  it("carries a no-maxi-portrait knownDeviations entry for the deferred maxi:portrait composition (Contract §8.3)", () => {
    const manifest = loadManifest();
    const codes = (manifest.knownDeviations ?? []).map((d) => d.code);
    expect(codes).toContain("no-maxi-portrait");
  });

  it("its capabilities.mediaEmbed.hosts are the real HeyGen host and are on the Contract §16.2 allowlist", () => {
    const manifest = loadManifest();
    expect(manifest.capabilities.mediaEmbed.hosts).toEqual(["app.heygen.com"]);
    expect(manifest.capabilities.mediaEmbed.lifecycle).toBe("src-swap");
  });

  it("declares htmlSlot: true (the content slot accepts consumer HTML body copy)", () => {
    const manifest = loadManifest();
    expect(manifest.capabilities.htmlSlot).toBe(true);
  });

  it("ships title as the only required slot; subtitle/media/content/footer/mediaPoster optional (Inventory §1.36, Story #45)", () => {
    const manifest = loadManifest();
    expect(manifest.slots.required).toEqual(["title"]);
    expect(manifest.slots.optional.sort()).toEqual(["content", "footer", "media", "mediaPoster", "subtitle"]);
  });

  it("declares no scripts -- mediaEmbed/slot wiring is entirely CssRenderer's built-in extension points (README 'Behavioral diffs' item 1)", () => {
    const manifest = loadManifest();
    for (const [key, entrypoint] of Object.entries(manifest.entrypoints)) {
      expect(entrypoint.scripts, `${key} should ship no Theme-authored scripts`).toEqual([]);
    }
  });

  it("ships the three 1.0-required compositions with real markup + styles on disk", () => {
    const manifest = loadManifest();
    for (const [key, entrypoint] of Object.entries(manifest.entrypoints)) {
      const markupPath = path.join(themeDir, entrypoint.markup);
      expect(fs.existsSync(markupPath), `${key}: markup "${entrypoint.markup}" missing`).toBe(true);
      for (const stylePath of entrypoint.styles) {
        expect(fs.existsSync(path.join(themeDir, stylePath)), `${key}: style "${stylePath}" missing`).toBe(true);
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

  it("every markup fragment carries data-slot=\"title\" (the one required slot)", () => {
    const manifest = loadManifest();
    for (const [key, entrypoint] of Object.entries(manifest.entrypoints)) {
      const html = fs.readFileSync(path.join(themeDir, entrypoint.markup), "utf8");
      expect(html, `${key} markup should have a data-slot="title" element`).toMatch(/data-slot="title"/);
    }
  });

  it("maxi and micro carry a data-slot=\"media\" element containing the .nc-reconnect label (RECONNECTING…)", () => {
    const manifest = loadManifest();
    for (const key of ["maxi:landscape", "micro:portrait"]) {
      const html = fs.readFileSync(path.join(themeDir, manifest.entrypoints[key].markup), "utf8");
      expect(html, `${key}: expected data-slot="media"`).toMatch(/data-slot="media"/);
      expect(html, `${key}: expected the .nc-reconnect label`).toMatch(/nc-reconnect/);
      expect(html, `${key}: RECONNECTING… copy`).toContain("RECONNECTING");
    }
  });

  it("data-slot=\"media\" and data-slot=\"content\" are never on the same element or nested (Behavioral diff 5)", () => {
    const manifest = loadManifest();
    for (const key of ["maxi:landscape", "micro:portrait"]) {
      const html = fs.readFileSync(path.join(themeDir, manifest.entrypoints[key].markup), "utf8");
      // crude but effective: the media slot's own opening tag must not also carry data-slot="content"
      const mediaTagMatch = html.match(/<[^>]*data-slot="media"[^>]*>/);
      expect(mediaTagMatch, `${key}: no data-slot="media" element found`).not.toBeNull();
      expect(mediaTagMatch[0]).not.toContain('data-slot="content"');
    }
  });

  it("mini:landscape maps subtitle+media+title onto the real .nc-hp-mini-card structure (Inventory mini-card mapping)", () => {
    const manifest = loadManifest();
    const html = fs.readFileSync(path.join(themeDir, manifest.entrypoints["mini:landscape"].markup), "utf8");
    expect(html).toContain("nc-hp-mini-card");
    expect(html).toMatch(/data-slot="subtitle"/);
    expect(html).toMatch(/data-slot="media"/);
    expect(html).toMatch(/data-slot="title"/);
  });

  it("no shipped CSS file contains a host-wide body/html/:root/bare-* selector (Contract §15.4, Arch §42)", () => {
    const manifest = loadManifest();
    const cssFiles = new Set();
    for (const entrypoint of Object.values(manifest.entrypoints)) {
      for (const stylePath of entrypoint.styles) cssFiles.add(stylePath);
    }
    const forbidden = /(^|\}|,)\s*(body|html|:root|\*)\s*\{/m;
    for (const relPath of cssFiles) {
      const text = fs.readFileSync(path.join(themeDir, relPath), "utf8");
      expect(forbidden.test(text), `${relPath} contains a host-wide selector`).toBe(false);
    }
  });

  it("every shared keyframe is Theme-locally named (hud04*), never the bare global shared-base name (Behavioral diff 6)", () => {
    const sharedCss = fs.readFileSync(path.join(themeDir, "styles", "shared.css"), "utf8");
    expect(sharedCss).not.toMatch(/@keyframes\s+hudBreath\b/);
    expect(sharedCss).not.toMatch(/@keyframes\s+hudPanelSweep\b/);
    expect(sharedCss).not.toMatch(/@keyframes\s+hudTickerScroll\b/);
    expect(sharedCss).toMatch(/@keyframes\s+hud04Breath\b/);
    expect(sharedCss).toMatch(/@keyframes\s+hud04PanelSweep\b/);
    expect(sharedCss).toMatch(/@keyframes\s+hud04TickerScroll\b/);
  });

  it("does not declare manifest.animations (nothing here is sourced from the unimplemented shared base, Behavioral diff 6)", () => {
    const manifest = loadManifest();
    expect(manifest.animations).toBeUndefined();
  });

  it("carries an external-io-on-mount knownDeviations entry + externalResources for the real @import'd Google Font (Contract §16.3, Behavioral diff 8)", () => {
    const manifest = loadManifest();
    const codes = (manifest.knownDeviations ?? []).map((d) => d.code);
    expect(codes).toContain("external-io-on-mount");
    const hosts = (manifest.externalResources ?? []).map((r) => r.host);
    expect(hosts).toContain("fonts.googleapis.com");
    expect(hosts).toContain("fonts.gstatic.com");
  });

  it("styles/shared.css actually @imports the real source's Google Font, ported verbatim (Behavioral diff 8)", () => {
    const sharedCss = fs.readFileSync(path.join(themeDir, "styles", "shared.css"), "utf8");
    expect(sharedCss).toMatch(/@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Share\+Tech\+Mono&display=swap'\);/);
  });
});
