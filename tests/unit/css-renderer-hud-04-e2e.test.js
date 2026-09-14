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
const MEDIA_URL = "https://app.heygen.com/embeds/21a8ec0238bb4e54a153374163cb059f";

/**
 * Issue #13 AC: "HUD-04 loads through the minimal Runtime (#8) + CSS
 * renderer (#10)". This is the real path end-to-end: `Hud` -> `ThemeResolver`
 * -> `RendererRegistry.create("css")` -> the real `CssRenderer` -> the real
 * `library/themes/hud-04/` package on disk. Mirrors
 * `tests/unit/css-renderer-hud-e2e.test.js` (#10's own fixture-css-hud
 * equivalent).
 */
function makeHud(variant) {
  const themeSource = new FileSystemThemeSource(themesRoot);
  const rendererRegistry = createDefaultRendererRegistry();
  rendererRegistry.register("css", () => new CssRenderer({ fetchText: fileFetchText }));
  return new Hud(
    { theme: "hud-04", version: "1.0.0", variant, orientation: variant === "micro" ? "portrait" : "landscape" },
    { themeSource, rendererRegistry }
  );
}

describe("End-to-end: mount hud-04 through Hud + the real CssRenderer (issue #13 AC)", () => {
  let hud;
  let hostEl;

  afterEach(() => {
    hud?.destroy();
    hostEl?.remove();
  });

  it("maxi: mount -> setData (all slots) -> mediaEmbed live -> destroy leaves no DOM/listener residue", async () => {
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    hud = makeHud("maxi");

    const errors = [];
    hud.onError((err) => errors.push(err));

    await hud.mount(hostEl);
    const scopedRoot = hostEl.querySelector("[data-hud-theme='hud-04']");
    expect(scopedRoot).not.toBeNull();
    expect(scopedRoot.shadowRoot).not.toBeNull(); // CssRenderer kept Shadow DOM for this Theme (Plan d8 / ADR-0003 precedent)

    hud.setData({
      title: "КОМАНДОР КЕЛЛАН",
      subtitle: "OUTPOST 32",
      content: "<p>Body copy wrapping the floated media block.</p>",
      footer: "JWST / PROTOPLANETARY DISK SURVEY",
      media: MEDIA_URL
    });

    const shadow = scopedRoot.shadowRoot;
    expect(shadow.querySelector('[data-slot="title"]').textContent).toBe("КОМАНДОР КЕЛЛАН");
    expect(shadow.querySelector('[data-slot="subtitle"]').textContent).toBe("OUTPOST 32");
    expect(shadow.querySelector('[data-slot="footer"]').textContent).toBe("JWST / PROTOPLANETARY DISK SURVEY");

    // mediaEmbed: at maxi the embed is live (Contract §10.5 src-swap "restores src on expand").
    const iframe = shadow.querySelector('[data-slot="media"] iframe');
    expect(iframe).not.toBeNull();
    expect(iframe.src).toBe(MEDIA_URL);

    hud.destroy();
    expect(hostEl.children.length).toBe(0);
    expect(errors).toEqual([]);

    expect(() => hud.destroy()).not.toThrow(); // idempotent, Contract §6.6
    expect(() => hud.setData({ title: "ignored" })).not.toThrow();
    expect(hostEl.children.length).toBe(0);
  });

  it("maxi -> setVariant(mini): mediaEmbed parks at about:blank (RECONNECTING… mechanism, Contract §10.5)", async () => {
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    hud = makeHud("maxi");

    await hud.mount(hostEl);
    hud.setData({ title: "КОМАНДОР КЕЛЛАН", subtitle: "OUTPOST 32", media: MEDIA_URL });

    const scopedRoot = hostEl.querySelector("[data-hud-theme='hud-04']");
    let iframe = scopedRoot.shadowRoot.querySelector('[data-slot="media"] iframe');
    expect(iframe.src).toBe(MEDIA_URL);

    await hud.setVariant("mini");
    // Contract §6.5: slot data is preserved across the switch -- Hud replays the last setData.
    expect(scopedRoot.shadowRoot.querySelector('[data-slot="title"]').textContent).toBe("КОМАНДОР КЕЛЛАН");
    expect(scopedRoot.shadowRoot.querySelector(".hud-04--mini")).not.toBeNull();
    expect(scopedRoot.shadowRoot.querySelector(".nc-hp-mini-card")).not.toBeNull();

    // mini density: mediaEmbed is parked at about:blank (src-swap lifecycle) --
    // README "Behavioral diffs" item 3.
    iframe = scopedRoot.shadowRoot.querySelector('[data-slot="media"] iframe');
    expect(iframe.src).toBe("about:blank");

    await hud.setVariant("maxi");
    iframe = scopedRoot.shadowRoot.querySelector('[data-slot="media"] iframe');
    expect(iframe.src).toBe(MEDIA_URL);
  });

  it("micro:portrait mounts the reduced composition with the required title slot and a media/reconnect block", async () => {
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    hud = makeHud("micro");

    await hud.mount(hostEl);
    const scopedRoot = hostEl.querySelector("[data-hud-theme='hud-04']");
    const shadow = scopedRoot.shadowRoot;
    expect(shadow.querySelector(".hud-04--micro")).not.toBeNull();
    expect(shadow.querySelector('[data-slot="title"]')).not.toBeNull();
    expect(shadow.querySelector('[data-slot="media"]')).not.toBeNull();
    expect(shadow.querySelector(".nc-reconnect")).not.toBeNull();

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
      { theme: "hud-04", version: "1.0.0", variant: "maxi", orientation: "landscape" },
      { themeSource, rendererRegistry }
    );

    await expect(hud.mount(hostEl)).rejects.toMatchObject({ code: "AssetLoadFailed" });
    expect(hostEl.children.length).toBe(0);
    expect(() => hud.destroy()).not.toThrow();
  });
});
