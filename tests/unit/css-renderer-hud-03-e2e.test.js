// @vitest-environment jsdom
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, afterEach } from "vitest";
import { Hud } from "../../src/runtime/core/Hud.ts";
import { createDefaultRendererRegistry } from "../../src/runtime/core/RendererRegistry.ts";
import { CssRenderer } from "../../src/runtime/renderers/CssRenderer.ts";
import { FileSystemThemeSource } from "../helpers/file-system-theme-source.js";
import { fileFetchText } from "../helpers/file-fetch-text.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesRoot = path.resolve(__dirname, "..", "..", "library", "themes");
const IMAGE_URL = "https://example.com/blogger-hosted/akemi-portrait.jpg";

/**
 * Issue #15 AC: "HUD-03 loads through the minimal Runtime (#8) + CSS
 * renderer (#10)". This is the real path end-to-end: `Hud` -> `ThemeResolver`
 * -> `RendererRegistry.create("css")` -> the real `CssRenderer` -> the real
 * `library/themes/hud-03/` package on disk. Mirrors
 * `tests/unit/css-renderer-hud-04-e2e.test.js` (#13's equivalent), adapted
 * for HUD-03's plain-<img> media slot (no mediaEmbed, no iframe).
 */
function makeHud(variant) {
  const themeSource = new FileSystemThemeSource(themesRoot);
  const rendererRegistry = createDefaultRendererRegistry();
  rendererRegistry.register("css", () => new CssRenderer({ fetchText: fileFetchText }));
  return new Hud(
    { theme: "hud-03", version: "1.0.0", variant, orientation: variant === "micro" ? "portrait" : "landscape" },
    { themeSource, rendererRegistry }
  );
}

describe("End-to-end: mount hud-03 through Hud + the real CssRenderer (issue #15 AC)", () => {
  let hud;
  let hostEl;

  afterEach(() => {
    hud?.destroy();
    hostEl?.remove();
  });

  it("maxi: mount -> setData (all slots) -> plain <img> media -> destroy leaves no DOM/listener residue", async () => {
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    hud = makeHud("maxi");

    const errors = [];
    hud.onError((err) => errors.push(err));

    await hud.mount(hostEl);
    const scopedRoot = hostEl.querySelector("[data-hud-theme='hud-03']");
    expect(scopedRoot).not.toBeNull();
    expect(scopedRoot.shadowRoot).not.toBeNull(); // CssRenderer kept Shadow DOM for this Theme (Plan d8 / ADR-0003 precedent)

    hud.setData({
      title: "АКЕМИ ХАНА",
      subtitle: "OUTPOST 42",
      content: "<p>Body copy wrapping the floated image.</p>",
      footer: "SECTOR 7-GAMMA / CLEARANCE LEVEL ALPHA",
      media: IMAGE_URL
    });

    const shadow = scopedRoot.shadowRoot;
    expect(shadow.querySelector('[data-slot="title"]').textContent).toBe("АКЕМИ ХАНА");
    expect(shadow.querySelector('[data-slot="subtitle"]').textContent).toBe("OUTPOST 42");
    expect(shadow.querySelector('[data-slot="footer"]').textContent).toBe("SECTOR 7-GAMMA / CLEARANCE LEVEL ALPHA");

    // media: HUD-03 has no mediaEmbed -- setData({ media }) sets a plain <img>.src directly.
    const img = shadow.querySelector('[data-slot="media"]');
    expect(img).not.toBeNull();
    expect(img.tagName).toBe("IMG");
    expect(img.src).toBe(IMAGE_URL);
    // never an iframe -- confirms no mediaEmbed extension point is engaged
    expect(shadow.querySelector('[data-slot="media"] iframe')).toBeNull();

    hud.destroy();
    expect(hostEl.children.length).toBe(0);
    expect(errors).toEqual([]);

    expect(() => hud.destroy()).not.toThrow(); // idempotent, Contract §6.6
    expect(() => hud.setData({ title: "ignored" })).not.toThrow();
    expect(hostEl.children.length).toBe(0);
  });

  it("maxi -> setVariant(mini): real .nc-hp-mini-card mounts, media slot stays a plain <img>, slot data preserved (Contract §6.5)", async () => {
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    hud = makeHud("maxi");

    await hud.mount(hostEl);
    hud.setData({ title: "АКЕМИ ХАНА", subtitle: "OUTPOST 42", media: IMAGE_URL });

    const scopedRoot = hostEl.querySelector("[data-hud-theme='hud-03']");
    let img = scopedRoot.shadowRoot.querySelector('[data-slot="media"]');
    expect(img.src).toBe(IMAGE_URL);

    await hud.setVariant("mini");
    // Contract §6.5: slot data is preserved across the switch -- Hud replays the last setData.
    expect(scopedRoot.shadowRoot.querySelector('[data-slot="title"]').textContent).toBe("АКЕМИ ХАНА");
    expect(scopedRoot.shadowRoot.querySelector(".hud-03--mini")).not.toBeNull();
    expect(scopedRoot.shadowRoot.querySelector(".nc-hp-mini-card")).not.toBeNull();

    img = scopedRoot.shadowRoot.querySelector('[data-slot="media"]');
    expect(img).not.toBeNull();
    expect(img.classList.contains("nc-hp-mini-thumb")).toBe(true);
    expect(img.src).toBe(IMAGE_URL);

    await hud.setVariant("maxi");
    img = scopedRoot.shadowRoot.querySelector('[data-slot="media"]');
    expect(img.classList.contains("nc-hud-float-image")).toBe(true);
    expect(img.src).toBe(IMAGE_URL);
  });

  it("micro:portrait mounts the reduced composition with the required title slot and a plain <img> media slot", async () => {
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    hud = makeHud("micro");

    await hud.mount(hostEl);
    const scopedRoot = hostEl.querySelector("[data-hud-theme='hud-03']");
    const shadow = scopedRoot.shadowRoot;
    expect(shadow.querySelector(".hud-03--micro")).not.toBeNull();
    expect(shadow.querySelector('[data-slot="title"]')).not.toBeNull();
    const img = shadow.querySelector('[data-slot="media"]');
    expect(img).not.toBeNull();
    expect(img.tagName).toBe("IMG");

    hud.destroy();
    expect(hostEl.children.length).toBe(0);
  });

  it("fails locally with a typed error and never touches the host when a required asset 404s (Contract §20.3)", async () => {
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    const themeSource = new FileSystemThemeSource(themesRoot);
    const rendererRegistry = createDefaultRendererRegistry();
    rendererRegistry.register(
      "css",
      () =>
        new CssRenderer({
          fetchText: async (url) => {
            if (url.endsWith("shared.css")) throw new Error("simulated 404");
            return fileFetchText(url);
          }
        })
    );
    hud = new Hud(
      { theme: "hud-03", version: "1.0.0", variant: "maxi", orientation: "landscape" },
      { themeSource, rendererRegistry }
    );

    await expect(hud.mount(hostEl)).rejects.toMatchObject({ code: "AssetLoadFailed" });
    expect(hostEl.children.length).toBe(0);
    expect(() => hud.destroy()).not.toThrow();
  });
});
