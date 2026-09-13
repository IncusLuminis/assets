// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { Hud } from "../../src/runtime/core/Hud.ts";
import { RendererRegistry, createDefaultRendererRegistry } from "../../src/runtime/core/RendererRegistry.ts";
import { RendererUnsupportedError } from "../../src/runtime/renderers/RendererUnsupportedError.ts";

const BASE_MANIFEST = {
  schemaVersion: "1.0",
  contractVersion: "1.0",
  id: "err-theme",
  name: "Error Theme",
  version: "1.0.0",
  engine: "css",
  baseVersion: "1.0.0",
  variants: ["maxi", "mini", "micro"],
  orientations: ["landscape", "portrait"],
  compositions: {
    "maxi:landscape": { dir: "maxi/landscape", supported: true },
    "maxi:portrait": { supported: false, reason: "not-authored" },
    "mini:landscape": { dir: "mini/landscape", supported: true },
    "mini:portrait": { supported: false, reason: "not-authored" },
    "micro:landscape": { supported: false, reason: "not-authored" },
    "micro:portrait": { dir: "micro/portrait", supported: true }
  },
  slots: { required: [], optional: ["title"] },
  capabilities: {},
  entrypoints: {
    "maxi:landscape": { styles: [], markup: "maxi/landscape/hud.html", scripts: [] },
    "mini:landscape": { styles: [], markup: "mini/landscape/hud.html", scripts: [] },
    "micro:portrait": { styles: [], markup: "micro/portrait/hud.html", scripts: [] }
  },
  isolation: "scoped-root",
  knownDeviations: [{ code: "no-maxi-portrait", scope: "maxi:portrait", clause: "8.3", note: "test fixture" }]
};

/** A tiny in-memory `ThemeSource` for exercising one manifest per test without touching disk. */
function fakeSource(manifest, { failResolve, failLoad } = {}) {
  return {
    async resolveVersion(themeId, requestedVersion) {
      if (failResolve) throw failResolve;
      if (themeId !== manifest.id) throw new Error("unknown theme in fake source");
      if (requestedVersion !== "latest" && requestedVersion !== manifest.version) {
        throw new Error("version mismatch in fake source");
      }
      return manifest.version;
    },
    async loadManifest() {
      if (failLoad) throw failLoad;
      return manifest;
    },
    assetBaseUrl() {
      return "https://example.invalid/";
    }
  };
}

class NoopCssRenderer {
  async mount(container) {
    container.appendChild(document.createElement("div"));
  }
  setData() {}
  resize() {}
  async setVariant() {}
  destroy() {}
}

function registryWithCss() {
  const registry = createDefaultRendererRegistry();
  registry.register("css", () => new NoopCssRenderer());
  return registry;
}

describe("Hud runtime error model (Contract §20 -- exact names)", () => {
  it("ManifestInvalid: a structurally broken manifest rejects mount() with ManifestInvalidError", async () => {
    const themeSource = fakeSource({ ...BASE_MANIFEST, variants: undefined });
    const hud = new Hud(
      { theme: "err-theme", version: "1.0.0", variant: "maxi", orientation: "landscape" },
      { themeSource, rendererRegistry: registryWithCss() }
    );
    const el = document.createElement("div");
    await expect(hud.mount(el)).rejects.toMatchObject({ code: "ManifestInvalid", name: "ManifestInvalidError" });
    expect(el.children.length).toBe(0);
  });

  it("ContractUnsupported: a manifest targeting an unimplemented contractVersion major rejects mount()", async () => {
    const themeSource = fakeSource({ ...BASE_MANIFEST, contractVersion: "2.0" });
    const hud = new Hud(
      { theme: "err-theme", version: "1.0.0", variant: "maxi", orientation: "landscape" },
      { themeSource, rendererRegistry: registryWithCss() }
    );
    await expect(hud.mount(document.createElement("div"))).rejects.toMatchObject({
      code: "ContractUnsupported",
      name: "ContractUnsupportedError"
    });
  });

  it("RendererUnsupported: engine svg/css with no renderer registered rejects mount() with the SAME class the reserved stubs throw", async () => {
    const themeSource = fakeSource(BASE_MANIFEST);
    const hud = new Hud(
      { theme: "err-theme", version: "1.0.0", variant: "maxi", orientation: "landscape" },
      { themeSource, rendererRegistry: new RendererRegistry() } // empty -- nothing registered, not even video/static/gadget
    );
    await expect(hud.mount(document.createElement("div"))).rejects.toBeInstanceOf(RendererUnsupportedError);
  });

  it('RendererUnsupported: engine "video" (reserved) rejects mount() via the default registry\'s stub', async () => {
    const themeSource = fakeSource({ ...BASE_MANIFEST, engine: "video" });
    const hud = new Hud(
      { theme: "err-theme", version: "1.0.0", variant: "maxi", orientation: "landscape" },
      { themeSource, rendererRegistry: createDefaultRendererRegistry() }
    );
    await expect(hud.mount(document.createElement("div"))).rejects.toMatchObject({ code: "RendererUnsupported" });
  });

  it("VariantUnsupported: a declared variant with no supported composition at either orientation rejects mount()", async () => {
    // Contract §7.1/1.0 requires manifest.variants to include all of
    // maxi/mini/micro, so "unknown variant" is exercised by declaring
    // "micro" but leaving it unsupported at both orientations, not by
    // omitting it from `variants` (which would be ManifestInvalid instead).
    const noMicroAnywhere = {
      ...BASE_MANIFEST,
      compositions: {
        ...BASE_MANIFEST.compositions,
        "micro:portrait": { supported: false, reason: "not-authored" },
        "micro:landscape": { supported: false, reason: "not-authored" }
      },
      entrypoints: {
        "maxi:landscape": BASE_MANIFEST.entrypoints["maxi:landscape"],
        "mini:landscape": BASE_MANIFEST.entrypoints["mini:landscape"]
      },
      knownDeviations: [
        ...BASE_MANIFEST.knownDeviations,
        { code: "no-maxi-portrait", scope: "maxi:portrait", note: "test fixture" }
      ]
    };
    const hud = new Hud(
      { theme: "err-theme", version: "1.0.0", variant: "micro", orientation: "landscape" },
      { themeSource: fakeSource(noMicroAnywhere), rendererRegistry: registryWithCss() }
    );
    await expect(hud.mount(document.createElement("div"))).rejects.toMatchObject({
      code: "VariantUnsupported",
      variant: "micro"
    });
  });

  it("RatioUnsupported: requesting an orientation whose composition is unsupported (but the variant IS supported elsewhere) rejects mount()", async () => {
    // maxi:portrait is supported:false in BASE_MANIFEST, but maxi:landscape IS
    // supported -- per Contract §20.1's note this must resolve to
    // RatioUnsupported, not VariantUnsupported.
    const themeSource = fakeSource(BASE_MANIFEST);
    const hud = new Hud(
      { theme: "err-theme", version: "1.0.0", variant: "maxi", orientation: "portrait" },
      { themeSource, rendererRegistry: registryWithCss() }
    );
    await expect(hud.mount(document.createElement("div"))).rejects.toMatchObject({
      code: "RatioUnsupported",
      variant: "maxi",
      orientation: "portrait"
    });
  });

  it("setVariant() rejects VariantUnsupported for an unsupported target composition, and leaves the instance mounted", async () => {
    const themeSource = fakeSource(BASE_MANIFEST);
    const hud = new Hud(
      { theme: "err-theme", version: "1.0.0", variant: "maxi", orientation: "landscape" },
      { themeSource, rendererRegistry: registryWithCss() }
    );
    await hud.mount(document.createElement("div"));
    // micro:landscape is supported:false in BASE_MANIFEST.
    await expect(hud.setVariant("micro")).rejects.toMatchObject({ code: "VariantUnsupported" });
    // The instance is still usable -- a failed setVariant does not destroy it.
    await expect(hud.setVariant("mini")).resolves.toBeUndefined();
    hud.destroy();
  });

  it("onError(): a post-mount setData()/resize() failure is delivered via the callback, never thrown into the host", async () => {
    class ThrowingRenderer extends NoopCssRenderer {
      setData() {
        throw new Error("boom from Theme setData");
      }
    }
    const registry = createDefaultRendererRegistry();
    registry.register("css", () => new ThrowingRenderer());
    const themeSource = fakeSource(BASE_MANIFEST);
    const hud = new Hud(
      { theme: "err-theme", version: "1.0.0", variant: "maxi", orientation: "landscape" },
      { themeSource, rendererRegistry: registry }
    );
    const seen = [];
    hud.onError((err) => seen.push(err));
    await hud.mount(document.createElement("div"));

    expect(() => hud.setData({ title: "x" })).not.toThrow();
    expect(seen).toHaveLength(1);
    expect(seen[0].code).toBe("ThemeRuntimeError");
    hud.destroy();
  });
});
