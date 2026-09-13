// @vitest-environment jsdom
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, vi, afterEach } from "vitest";
import { Hud } from "../../src/runtime/core/Hud.ts";
import { createDefaultRendererRegistry } from "../../src/runtime/core/RendererRegistry.ts";
import { SvgRenderer } from "../../src/runtime/renderers/SvgRenderer.ts";
import { FileSystemThemeSource } from "../helpers/file-system-theme-source.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesRoot = path.resolve(__dirname, "..", "..", "library", "themes");

/**
 * `FileSystemThemeSource#assetBaseUrl` (Story #8's test helper) returns a
 * `file://` URL. Browsers' `fetch` only serves `http(s):`, and `SvgRenderer`
 * intentionally defaults to plain `fetch` rather than baking `node:fs` into
 * the browser-bundled Runtime (see `FileSystemThemeSource`'s own docstring
 * for the identical reasoning). This is the same seam `ThemeSource` already
 * documents: a Registry/CDN-backed `ThemeSource` (`https:`) needs no change
 * here at all; only THIS test's `loadText` -- standing in for `fetch` against
 * a real CDN -- needs to understand `file://` URLs, exactly the way this
 * repo's own `FileSystemThemeSource` stands in for a Registry client.
 */
async function loadTextFromFileUrl(url) {
  const filePath = fileURLToPath(url);
  return fs.readFile(filePath, "utf8");
}

describe("End-to-end: mount the real fixture-svg-hud Theme via Hud + SvgRenderer (Story #9 AC)", () => {
  let hud;
  let hostEl;

  afterEach(() => {
    hud?.destroy();
    hostEl?.remove();
  });

  it("mount -> setData -> resize -> setVariant -> destroy leaves no DOM/listener residue", async () => {
    const themeSource = new FileSystemThemeSource(themesRoot);
    const rendererRegistry = createDefaultRendererRegistry();
    // The #8 extension point (RendererRegistry.register), used from outside --
    // Hud.ts / ThemeResolver.ts are untouched.
    rendererRegistry.register("svg", () => new SvgRenderer({ loadText: loadTextFromFileUrl }));

    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    hud = new Hud(
      { theme: "fixture-svg-hud", version: "0.1.0", variant: "maxi", orientation: "landscape" },
      { themeSource, rendererRegistry }
    );

    const errors = [];
    hud.onError((err) => errors.push(err));

    await hud.mount(hostEl);

    // Contract §15.1: a dedicated scoped-root container was created.
    const root = hostEl.querySelector("[data-hud-theme='fixture-svg-hud']");
    expect(root).not.toBeNull();

    // The composition's real markup mounted -- both the <svg> frame layer
    // AND the HTML content layer, in the same document (Contract §5.3 pt 2).
    expect(root.querySelector(".fx-svg-hud__frame")).not.toBeNull();
    expect(root.querySelector(".fx-svg-hud__content")).not.toBeNull();
    // The glow runner's overflow:visible requirement (Contract §15.5) --
    // this renderer imposes no clip of its own.
    expect(root.style.overflow).not.toBe("hidden");

    // setData() -- via [data-slot], never via internal SVG/class names the
    // consumer here never references.
    hud.setData({ title: "NGC 1300", status: "TARGET LOCK" });
    expect(root.querySelector('[data-slot="title"]').textContent).toBe("NGC 1300");
    expect(root.querySelector('[data-slot="status"]').textContent).toBe("TARGET LOCK");

    // resize()
    hud.resize({ width: 480, height: 270 });

    // setVariant() -- mini:landscape is also supported:true.
    await hud.setVariant("mini");
    // slot data (Contract §6.5) must survive the switch.
    expect(root.querySelector('[data-slot="title"]').textContent).toBe("NGC 1300");

    // destroy()
    hud.destroy();
    expect(hostEl.children.length).toBe(0);
    expect(errors).toEqual([]);

    // idempotent + post-destroy calls ignored, not thrown (Contract §6.6).
    expect(() => hud.destroy()).not.toThrow();
    expect(() => hud.setData({ title: "ignored" })).not.toThrow();
    expect(hostEl.children.length).toBe(0);
  });

  it("the maxi:landscape composition's controlled-JS script wires the lazy skyViewer hook without making a real network call", async () => {
    const themeSource = new FileSystemThemeSource(themesRoot);
    const rendererRegistry = createDefaultRendererRegistry();
    const load = vi.fn(async () => {});
    rendererRegistry.register(
      "svg",
      () => new SvgRenderer({ loadText: loadTextFromFileUrl, externalResourceLoader: { load } })
    );

    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    hud = new Hud(
      { theme: "fixture-svg-hud", version: "0.1.0", variant: "maxi", orientation: "landscape" },
      { themeSource, rendererRegistry }
    );
    await hud.mount(hostEl);

    expect(load).not.toHaveBeenCalled(); // lazy: not at mount time.

    hostEl.querySelector('[data-hud-control="load-sky-viewer"]').click();
    await Promise.resolve();

    expect(load).toHaveBeenCalledWith({ name: "skyViewer", host: "aladin.cds.unistra.fr", kind: "script" });
  });

  it("mounting fails with a typed error (not a raw throw) when a required composition asset is missing", async () => {
    const themeSource = new FileSystemThemeSource(themesRoot);
    const rendererRegistry = createDefaultRendererRegistry();
    // A loadText that always fails simulates a broken/unreachable CDN asset --
    // proves Hud.mount() rejects with a typed HudError end-to-end, not a raw error.
    rendererRegistry.register(
      "svg",
      () =>
        new SvgRenderer({
          loadText: async () => {
            throw new Error("simulated network failure");
          }
        })
    );

    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    hud = new Hud(
      { theme: "fixture-svg-hud", version: "0.1.0", variant: "maxi", orientation: "landscape" },
      { themeSource, rendererRegistry }
    );

    await expect(hud.mount(hostEl)).rejects.toMatchObject({ code: "AssetLoadFailed" });
    // Contract §6.2: no partial DOM left behind on a failed mount.
    expect(hostEl.children.length).toBe(0);
  });
});
