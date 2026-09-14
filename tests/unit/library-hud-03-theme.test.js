import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { validateManifest, formatErrors } from "../helpers/validator.js";
import { semanticCheck } from "../helpers/semantics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeDir = path.resolve(__dirname, "..", "..", "library", "themes", "hud-03");

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(themeDir, "manifest.json"), "utf8"));
}

describe("library/themes/hud-03 -- HUD-03 packaged as a CSS-engine Theme (issue #15 AC)", () => {
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

  it("id is the reserved baseline id hud-03", () => {
    const manifest = loadManifest();
    expect(manifest.id).toBe("hud-03");
  });

  it("declares engine: \"css\" and isolation: \"shadow-dom-preferred\" (Plan §2 decision 8, #10 precedent, Contract §25.3)", () => {
    const manifest = loadManifest();
    expect(manifest.engine).toBe("css");
    expect(manifest.isolation).toBe("shadow-dom-preferred");
  });

  it("declares variants/orientations as the full 1.0-required sets (Contract §7.1, §8.2) -- not the stale issue wording", () => {
    const manifest = loadManifest();
    expect(manifest.variants.sort()).toEqual(["maxi", "micro", "mini"]);
    expect(manifest.orientations.sort()).toEqual(["landscape", "portrait"]);
  });

  it("does not declare the removed aspectRatios/ratios field (Contract §3.3)", () => {
    const manifest = loadManifest();
    expect(manifest.aspectRatios).toBeUndefined();
    expect(manifest.ratios).toBeUndefined();
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

  it("declares no mediaEmbed capability -- HUD-03's media is a plain floated <img>, confirmed against the real source", () => {
    const manifest = loadManifest();
    expect(manifest.capabilities.mediaEmbed).toBeUndefined();
  });

  it("declares htmlSlot: true (the content slot accepts consumer HTML body copy)", () => {
    const manifest = loadManifest();
    expect(manifest.capabilities.htmlSlot).toBe(true);
  });

  it("ships title as the only required slot; subtitle/media/content/footer optional (Inventory §1.29)", () => {
    const manifest = loadManifest();
    expect(manifest.slots.required).toEqual(["title"]);
    expect(manifest.slots.optional.sort()).toEqual(["content", "footer", "media", "subtitle"]);
  });

  it("declares no scripts -- the real blogger-hud03-template.js is only the NcHudMini toggle, replaced by Hud.setVariant() (README 'Behavioral diffs' item 1)", () => {
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

  it("maxi and micro carry a plain <img data-slot=\"media\"> element (no iframe, no mediaEmbed wrapper)", () => {
    const manifest = loadManifest();
    for (const key of ["maxi:landscape", "micro:portrait"]) {
      const html = fs.readFileSync(path.join(themeDir, manifest.entrypoints[key].markup), "utf8");
      expect(html, `${key}: expected an <img data-slot="media"> element`).toMatch(/<img\s+class="nc-hud-float-image"\s+data-slot="media"/);
      expect(html).not.toContain("nc-hud-media");
      expect(html).not.toContain("nc-reconnect");
      expect(html).not.toContain("<iframe");
    }
  });

  it("data-slot=\"media\" and data-slot=\"content\" are never on the same element or nested (Behavioral diff 3)", () => {
    const manifest = loadManifest();
    for (const key of ["maxi:landscape", "micro:portrait"]) {
      const html = fs.readFileSync(path.join(themeDir, manifest.entrypoints[key].markup), "utf8");
      const mediaTagMatch = html.match(/<[^>]*data-slot="media"[^>]*>/);
      expect(mediaTagMatch, `${key}: no data-slot="media" element found`).not.toBeNull();
      expect(mediaTagMatch[0]).not.toContain('data-slot="content"');
    }
  });

  it("mini:landscape maps subtitle+media+title onto the real .nc-hp-mini-card structure, media as a plain <img> (Inventory §1.26/§1.29)", () => {
    const manifest = loadManifest();
    const html = fs.readFileSync(path.join(themeDir, manifest.entrypoints["mini:landscape"].markup), "utf8");
    expect(html).toContain("nc-hp-mini-card");
    expect(html).toMatch(/data-slot="subtitle"/);
    expect(html).toMatch(/<img\s+class="nc-hp-mini-thumb"\s+data-slot="media"/);
    expect(html).toMatch(/data-slot="title"/);
    // Unlike HUD-04, HUD-03's mini card needs no "live video preview" substitution:
    expect(html).not.toContain("nc-hp-mini-video-wrap");
    expect(html).not.toContain("<iframe");
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

  it("every shared keyframe is Theme-locally named (hud03*), never the bare global shared-base name (Behavioral diff 4)", () => {
    const sharedCss = fs.readFileSync(path.join(themeDir, "styles", "shared.css"), "utf8");
    expect(sharedCss).not.toMatch(/@keyframes\s+hudBreath\b/);
    expect(sharedCss).not.toMatch(/@keyframes\s+hudPanelSweep\b/);
    expect(sharedCss).not.toMatch(/@keyframes\s+hudTickerScroll\b/);
    expect(sharedCss).not.toMatch(/@keyframes\s+ncHpOpenHud\b/);
    expect(sharedCss).not.toMatch(/@keyframes\s+ncHpLoader1\b/);
    expect(sharedCss).toMatch(/@keyframes\s+hud03Breath\b/);
    expect(sharedCss).toMatch(/@keyframes\s+hud03PanelSweep\b/);
    expect(sharedCss).toMatch(/@keyframes\s+hud03TickerScroll\b/);
    expect(sharedCss).toMatch(/@keyframes\s+hud03OpenHud\b/);
    for (let i = 1; i <= 8; i++) {
      expect(sharedCss).toMatch(new RegExp(`@keyframes\\s+hud03Loader${i}\\b`));
    }
  });

  it("does not declare manifest.animations (nothing here is sourced from the unimplemented shared base, Behavioral diff 4)", () => {
    const manifest = loadManifest();
    expect(manifest.animations).toBeUndefined();
  });

  it("carries an external-io-on-mount knownDeviations entry + externalResources for the real @import'd Google Font (Contract §16.3, Behavioral diff 5)", () => {
    const manifest = loadManifest();
    const codes = (manifest.knownDeviations ?? []).map((d) => d.code);
    expect(codes).toContain("external-io-on-mount");
    const hosts = (manifest.externalResources ?? []).map((r) => r.host);
    expect(hosts).toContain("fonts.googleapis.com");
    expect(hosts).toContain("fonts.gstatic.com");
  });

  it("styles/shared.css actually @imports the real source's Google Font, ported verbatim (Behavioral diff 5)", () => {
    const sharedCss = fs.readFileSync(path.join(themeDir, "styles", "shared.css"), "utf8");
    expect(sharedCss).toMatch(/@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Share\+Tech\+Mono&display=swap'\);/);
  });

  it("does not declare knownDeviations shadow-dom-fallback -- Shadow DOM held for HUD-03's own CSS (README isolation section)", () => {
    const manifest = loadManifest();
    const codes = (manifest.knownDeviations ?? []).map((d) => d.code);
    expect(codes).not.toContain("shadow-dom-fallback");
  });
});
