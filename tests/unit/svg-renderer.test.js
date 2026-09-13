// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SvgRenderer } from "../../src/runtime/renderers/SvgRenderer.ts";
import {
  AssetLoadFailedError,
  EntrypointMissingError,
  ThemeMountFailedError,
  VariantUnsupportedError
} from "../../src/runtime/contract/errors.ts";

/**
 * Unit tests for `SvgRenderer` in isolation -- no `Hud`/`ThemeResolver`
 * involved (see `svg-fixture-e2e.test.js` for the full pipeline against the
 * real `fixture-svg-hud` package on disk). A fake `loadText` stands in for
 * `fetch`, keyed by absolute URL, so these tests run with zero network I/O
 * and total control over failure injection.
 */

const ASSET_BASE = "https://cdn.example.invalid/themes/fixture-svg-hud/0.1.0/";

function baseManifest(overrides = {}) {
  return {
    schemaVersion: "1.0",
    contractVersion: "1.0",
    id: "fixture-svg-hud",
    name: "Fixture SVG HUD",
    version: "0.1.0",
    engine: "svg",
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
    slots: { required: [], optional: ["title", "subtitle", "status", "content", "footer", "objectName"] },
    customSlots: [{ name: "objectName", kind: "text", required: false, description: "test" }],
    capabilities: {
      htmlSlot: true,
      skyViewer: true,
      dataSource: {
        providers: ["simbad"],
        hosts: ["simbad.cds.unistra.fr"],
        input: "objectName",
        timing: { simbad: "lazy" }
      }
    },
    entrypoints: {
      "maxi:landscape": { styles: ["maxi/landscape/hud.css"], markup: "maxi/landscape/hud.html", scripts: ["maxi/landscape/hud.js"] },
      "mini:landscape": { styles: [], markup: "mini/landscape/hud.html", scripts: [] },
      "micro:portrait": { styles: [], markup: "micro/portrait/hud.html", scripts: [] }
    },
    isolation: "scoped-root",
    overflowVisible: true,
    ...overrides
  };
}

function makeContext(overrides = {}) {
  return {
    theme: "fixture-svg-hud",
    version: "0.1.0",
    variant: "maxi",
    orientation: "landscape",
    manifest: baseManifest(),
    baseVersion: "1.0.0",
    assetBaseUrl: ASSET_BASE,
    ...overrides
  };
}

const MAXI_MARKUP = `<div class="fx"><svg class="fx__frame" viewBox="0 0 10 10"><path class="fx__glow" d="M0 0 L10 0 L10 10 L0 10 Z"/></svg>
  <h2 data-slot="title"></h2>
  <div data-slot="subtitle"></div>
  <div data-slot="status"></div>
  <div data-slot="content"></div>
  <div data-slot="footer"></div>
  <button type="button" data-hud-control="load-sky-viewer">SKY VIEWER</button>
</div>`;

const MAXI_CSS = ".fx { color: red; }";
const MAXI_JS = `
var button = root.querySelector('[data-hud-control="load-sky-viewer"]');
function onClick() { hud.loadExternalResource("skyViewer").catch(function () {}); }
if (button) button.addEventListener("click", onClick);
return { destroy: function () { if (button) button.removeEventListener("click", onClick); } };
`;

const MINI_MARKUP = `<div class="fx-mini"><div data-slot="title"></div></div>`;
const MICRO_MARKUP = `<div class="fx-micro"><div data-slot="title"></div></div>`;

function makeFakeResources(overrides = {}) {
  return {
    [ASSET_BASE + "maxi/landscape/hud.html"]: MAXI_MARKUP,
    [ASSET_BASE + "maxi/landscape/hud.css"]: MAXI_CSS,
    [ASSET_BASE + "maxi/landscape/hud.js"]: MAXI_JS,
    [ASSET_BASE + "mini/landscape/hud.html"]: MINI_MARKUP,
    [ASSET_BASE + "micro/portrait/hud.html"]: MICRO_MARKUP,
    ...overrides
  };
}

function makeLoadText(resources) {
  return vi.fn(async (url) => {
    if (!(url in resources)) throw new Error(`no fake resource for ${url}`);
    return resources[url];
  });
}

describe("SvgRenderer", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe("mount()", () => {
    it("loads markup/styles/scripts against assetBaseUrl and appends the composition into the container", async () => {
      const loadText = makeLoadText(makeFakeResources());
      const renderer = new SvgRenderer({ loadText });
      await renderer.mount(container, makeContext());

      expect(loadText).toHaveBeenCalledWith(ASSET_BASE + "maxi/landscape/hud.html");
      expect(loadText).toHaveBeenCalledWith(ASSET_BASE + "maxi/landscape/hud.css");
      expect(loadText).toHaveBeenCalledWith(ASSET_BASE + "maxi/landscape/hud.js");
      expect(container.querySelector(".fx")).not.toBeNull();
      expect(container.querySelector("style").textContent).toContain("color: red");

      renderer.destroy();
    });

    it("never sets overflow:hidden/clip on the container or the composition root (Contract §15.5)", async () => {
      const loadText = makeLoadText(makeFakeResources());
      const renderer = new SvgRenderer({ loadText });
      await renderer.mount(container, makeContext());

      expect(container.style.overflow).not.toBe("hidden");
      expect(container.querySelector(".fx").style.overflow).not.toBe("hidden");

      renderer.destroy();
    });

    it("a second mount() call throws (Contract §6.2)", async () => {
      const loadText = makeLoadText(makeFakeResources());
      const renderer = new SvgRenderer({ loadText });
      await renderer.mount(container, makeContext());

      await expect(renderer.mount(container, makeContext())).rejects.toThrow(/only be called once/);

      renderer.destroy();
    });

    it("rejects with EntrypointMissingError when the resolved composition has no entrypoint (defensive -- ThemeResolver should already have caught this)", async () => {
      const manifest = baseManifest({ entrypoints: {} });
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });

      await expect(renderer.mount(container, makeContext({ manifest }))).rejects.toThrow(EntrypointMissingError);
      expect(container.children.length).toBe(0);
    });

    it("rejects with AssetLoadFailedError when markup fails to load, and leaves the container empty (Contract §6.2, §20.1)", async () => {
      const loadText = vi.fn(async () => {
        throw new Error("network down");
      });
      const renderer = new SvgRenderer({ loadText });

      await expect(renderer.mount(container, makeContext())).rejects.toThrow(AssetLoadFailedError);
      expect(container.children.length).toBe(0);
    });

    it("rejects with AssetLoadFailedError when a style fails to load", async () => {
      const resources = makeFakeResources();
      delete resources[ASSET_BASE + "maxi/landscape/hud.css"];
      const loadText = makeLoadText(resources);
      const renderer = new SvgRenderer({ loadText });

      await expect(renderer.mount(container, makeContext())).rejects.toThrow(AssetLoadFailedError);
    });

    it("wraps an unexpected mount-time failure (e.g. malformed markup) as ThemeMountFailedError", async () => {
      const resources = makeFakeResources({ [ASSET_BASE + "maxi/landscape/hud.html"]: "not an element, just text" });
      const renderer = new SvgRenderer({ loadText: makeLoadText(resources) });

      await expect(renderer.mount(container, makeContext())).rejects.toThrow(ThemeMountFailedError);
    });
  });

  describe("setData() -- slot mapping hides internal DOM from the consumer (Contract §9.1, Arch §18)", () => {
    it("maps standard slot names to [data-slot] elements without the consumer ever knowing that attribute exists", async () => {
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });
      await renderer.mount(container, makeContext());

      renderer.setData({ title: "BETELGEUSE", subtitle: "RED SUPERGIANT", status: "LOCKED" });

      expect(container.querySelector('[data-slot="title"]').textContent).toBe("BETELGEUSE");
      expect(container.querySelector('[data-slot="subtitle"]').textContent).toBe("RED SUPERGIANT");
      expect(container.querySelector('[data-slot="status"]').textContent).toBe("LOCKED");

      renderer.destroy();
    });

    it("is idempotent for equal input (Contract §6.3)", async () => {
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });
      await renderer.mount(container, makeContext());

      renderer.setData({ title: "VEGA" });
      const first = container.querySelector('[data-slot="title"]').textContent;
      renderer.setData({ title: "VEGA" });
      const second = container.querySelector('[data-slot="title"]').textContent;
      expect(first).toBe(second);
      expect(first).toBe("VEGA");

      renderer.destroy();
    });

    it("ignores unknown slot keys without throwing, and logs a warning once (Contract §6.3)", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });
      await renderer.mount(container, makeContext());

      expect(() => renderer.setData({ notARealSlot: "x" })).not.toThrow();
      renderer.setData({ notARealSlot: "y" }); // second call: still no throw, still no duplicate warning

      expect(warnSpy).toHaveBeenCalledTimes(1);
      warnSpy.mockRestore();
      renderer.destroy();
    });

    it("the content slot accepts an HTML fragment but strips <script> tags (Contract §9.3)", async () => {
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });
      await renderer.mount(container, makeContext());

      renderer.setData({ content: '<p>hello</p><script>window.__pwned = true;</script>' });

      const el = container.querySelector('[data-slot="content"]');
      expect(el.innerHTML).toContain("<p>hello</p>");
      expect(el.innerHTML).not.toContain("<script");
      expect(window.__pwned).toBeUndefined();

      renderer.destroy();
    });

    it("renders array values (structured rows, Contract §9.2) as child rows", async () => {
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });
      await renderer.mount(container, makeContext());

      renderer.setData({ footer: ["row one", "row two"] });

      const rows = container.querySelectorAll('[data-slot="footer"] .hud-slot-row');
      expect(rows.length).toBe(2);
      expect(rows[0].textContent).toBe("row one");
      expect(rows[1].textContent).toBe("row two");

      renderer.destroy();
    });

    it("throws if called before mount() resolves (programmer error, not a Theme error)", () => {
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });
      expect(() => renderer.setData({ title: "x" })).toThrow(/before mount/);
    });
  });

  describe("resize()", () => {
    it("is a synchronous no-throw call that records the viewport", async () => {
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });
      await renderer.mount(container, makeContext());

      expect(() => renderer.resize({ width: 320, height: 180 })).not.toThrow();
      expect(container.querySelector(".fx").style.getPropertyValue("--hud-viewport-width")).toBe("320px");

      renderer.destroy();
    });

    it("before mount() / after destroy() is a safe no-op", () => {
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });
      expect(() => renderer.resize({ width: 100, height: 100 })).not.toThrow();
      renderer.destroy();
      expect(() => renderer.resize({ width: 100, height: 100 })).not.toThrow();
    });
  });

  describe("setVariant()", () => {
    it("switches composition, keeps orientation fixed, and does not throw", async () => {
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });
      await renderer.mount(container, makeContext());
      renderer.setData({ title: "SIRIUS" });

      await renderer.setVariant("mini");

      expect(container.querySelector(".fx-mini")).not.toBeNull();
      expect(container.querySelector(".fx")).toBeNull(); // old composition torn down

      renderer.destroy();
    });

    it("is idempotent when the target variant is already active (Contract §6.5)", async () => {
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });
      await renderer.mount(container, makeContext());

      await expect(renderer.setVariant("maxi")).resolves.toBeUndefined();
      expect(container.querySelector(".fx")).not.toBeNull(); // unchanged, not remounted

      renderer.destroy();
    });

    it("rejects with VariantUnsupportedError when the composition at the current orientation has no entrypoint", async () => {
      const manifest = baseManifest();
      delete manifest.entrypoints["mini:landscape"];
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });
      await renderer.mount(container, makeContext({ manifest }));

      await expect(renderer.setVariant("mini")).rejects.toThrow(VariantUnsupportedError);

      renderer.destroy();
    });

    it("leaves the previous composition mounted if the new one fails to load", async () => {
      const resources = makeFakeResources();
      delete resources[ASSET_BASE + "mini/landscape/hud.html"];
      const renderer = new SvgRenderer({ loadText: makeLoadText(resources) });
      await renderer.mount(container, makeContext());

      await expect(renderer.setVariant("mini")).rejects.toThrow(AssetLoadFailedError);
      expect(container.querySelector(".fx")).not.toBeNull(); // old composition still there

      renderer.destroy();
    });
  });

  describe("destroy()", () => {
    it("never throws even if mount() never completed", () => {
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });
      expect(() => renderer.destroy()).not.toThrow();
    });

    it("never throws even if mount() failed", async () => {
      const renderer = new SvgRenderer({
        loadText: vi.fn(async () => {
          throw new Error("boom");
        })
      });
      await expect(renderer.mount(container, makeContext())).rejects.toThrow();
      expect(() => renderer.destroy()).not.toThrow();
    });

    it("is idempotent (safe to call repeatedly)", async () => {
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });
      await renderer.mount(container, makeContext());
      renderer.destroy();
      expect(() => renderer.destroy()).not.toThrow();
    });

    it("empties the container and calls the Theme script handle's destroy() (removing its listener)", async () => {
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()) });
      await renderer.mount(container, makeContext());
      const button = container.querySelector('[data-hud-control="load-sky-viewer"]');
      const removeSpy = vi.spyOn(button, "removeEventListener");

      renderer.destroy();

      expect(container.children.length).toBe(0);
      expect(removeSpy).toHaveBeenCalledWith("click", expect.any(Function));
    });

    it("even a Theme handle whose destroy() throws does not propagate (Contract §6.6/§17.3)", async () => {
      const resources = makeFakeResources({
        [ASSET_BASE + "maxi/landscape/hud.js"]: `return { destroy: function () { throw new Error("theme bug"); } };`
      });
      const renderer = new SvgRenderer({ loadText: makeLoadText(resources) });
      await renderer.mount(container, makeContext());

      expect(() => renderer.destroy()).not.toThrow();
    });
  });

  describe("requestExternalResource() -- lazy skyViewer/dataSource hook (Contract §10, §16.2-§16.3)", () => {
    it("is NOT called during mount() (lazy, not page-load)", async () => {
      const load = vi.fn(async () => {});
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()), externalResourceLoader: { load } });
      await renderer.mount(container, makeContext());

      expect(load).not.toHaveBeenCalled();

      renderer.destroy();
    });

    it("fires when the Theme's own control is clicked, with the correct capability-validated host/kind, and makes no real network call", async () => {
      const load = vi.fn(async () => {});
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()), externalResourceLoader: { load } });
      await renderer.mount(container, makeContext());

      container.querySelector('[data-hud-control="load-sky-viewer"]').click();
      await Promise.resolve(); // let the click handler's microtask settle

      expect(load).toHaveBeenCalledWith({ name: "skyViewer", host: "aladin.cds.unistra.fr", kind: "script" });

      renderer.destroy();
    });

    it("resolves a declared dataSource provider to its Contract §10.3 host", async () => {
      const load = vi.fn(async () => {});
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()), externalResourceLoader: { load } });
      await renderer.mount(container, makeContext());

      await renderer.requestExternalResource("simbad");

      expect(load).toHaveBeenCalledWith({ name: "simbad", host: "simbad.cds.unistra.fr", kind: "fetch" });

      renderer.destroy();
    });

    it("rejects a resource name the manifest does not declare (a Theme cannot request what it didn't capability-declare)", async () => {
      const load = vi.fn(async () => {});
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()), externalResourceLoader: { load } });
      await renderer.mount(container, makeContext());

      await expect(renderer.requestExternalResource("vizier")).rejects.toThrow(/not declared/);
      expect(load).not.toHaveBeenCalled();

      renderer.destroy();
    });

    it("wraps a loader failure as AssetLoadFailedError", async () => {
      const load = vi.fn(async () => {
        throw new Error("script failed to load");
      });
      const renderer = new SvgRenderer({ loadText: makeLoadText(makeFakeResources()), externalResourceLoader: { load } });
      await renderer.mount(container, makeContext());

      await expect(renderer.requestExternalResource("skyViewer")).rejects.toThrow(AssetLoadFailedError);

      renderer.destroy();
    });
  });
});
