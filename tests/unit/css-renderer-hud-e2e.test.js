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

/**
 * Issue #10 AC: "A fixture CSS Theme mounts / destroys through the one
 * Runtime API." This is the real path end-to-end: `Hud` -> `ThemeResolver`
 * -> `RendererRegistry.create("css")` -> the REAL `CssRenderer` (not a
 * stand-in, unlike Story #8's own `hud-fixture-e2e.test.js`, which had to
 * use a test-only stub because CssRenderer didn't exist yet) -> the real
 * `library/themes/fixture-css-hud/` package on disk.
 */
describe("End-to-end: mount fixture-css-hud through Hud + the real CssRenderer (issue #10 AC)", () => {
  let hud;
  let hostEl;

  afterEach(() => {
    hud?.destroy();
    hostEl?.remove();
  });

  it("mount -> setData -> resize -> setVariant -> destroy leaves no DOM/listener residue, registered exactly per RendererRegistry's documented extension point", async () => {
    const themeSource = new FileSystemThemeSource(themesRoot);
    const rendererRegistry = createDefaultRendererRegistry();
    // The exact snippet RendererRegistry.ts's own docstring documents for #10:
    rendererRegistry.register("css", () => new CssRenderer({ fetchText: fileFetchText }));

    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    hud = new Hud(
      { theme: "fixture-css-hud", version: "0.1.0", variant: "maxi", orientation: "landscape" },
      { themeSource, rendererRegistry }
    );

    const errors = [];
    hud.onError((err) => errors.push(err));

    await hud.mount(hostEl);
    const scopedRoot = hostEl.querySelector("[data-hud-theme='fixture-css-hud']");
    expect(scopedRoot).not.toBeNull(); // Contract §15.1: Hud's own scoped-root container
    expect(scopedRoot.shadowRoot).not.toBeNull(); // CssRenderer kept Shadow DOM for this Theme

    hud.setData({ title: "OUTPOST 32", subtitle: "CHARACTER FILE", footer: "ticker text" });
    expect(scopedRoot.shadowRoot.querySelector('[data-slot="title"]').textContent).toBe("OUTPOST 32");

    hud.resize({ width: 640, height: 360 });

    await hud.setVariant("mini");
    // slot data (Contract §6.5) must survive the switch -- Hud re-applies it.
    expect(scopedRoot.shadowRoot.querySelector('[data-slot="title"]').textContent).toBe("OUTPOST 32");
    expect(scopedRoot.shadowRoot.querySelector(".fixture-css-hud--mini")).not.toBeNull();

    hud.destroy();
    expect(hostEl.children.length).toBe(0); // no residue -- the scoped root itself is gone.
    expect(errors).toEqual([]);

    expect(() => hud.destroy()).not.toThrow(); // idempotent, Contract §6.6
    expect(() => hud.setData({ title: "ignored" })).not.toThrow();
    expect(hostEl.children.length).toBe(0);
  });

  it("fails locally with a typed error and never touches the host when a required asset 404s (Contract §20.3)", async () => {
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

    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    hud = new Hud(
      { theme: "fixture-css-hud", version: "0.1.0", variant: "maxi", orientation: "landscape" },
      { themeSource, rendererRegistry }
    );

    // CssRenderer throws the specific typed error (AssetLoadFailedError,
    // Contract §20.1) rather than a generic failure; Hud.ts's
    // `normalizeError` passes an already-typed HudError through unchanged
    // (only a non-HudError throw gets wrapped as ThemeMountFailed).
    await expect(hud.mount(hostEl)).rejects.toMatchObject({ code: "AssetLoadFailed" });
    expect(hostEl.children.length).toBe(0); // Contract §6.2: no partial DOM on mount failure.
    expect(() => hud.destroy()).not.toThrow();
  });
});
