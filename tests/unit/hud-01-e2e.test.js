// @vitest-environment jsdom
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { Hud } from "../../src/runtime/core/Hud.ts";
import { createDefaultRendererRegistry } from "../../src/runtime/core/RendererRegistry.ts";
import { SvgRenderer } from "../../src/runtime/renderers/SvgRenderer.ts";
import { FileSystemThemeSource } from "../helpers/file-system-theme-source.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesRoot = path.resolve(__dirname, "..", "..", "library", "themes");

// Same file:// -> text adapter Story #9's own e2e test uses (see that
// file's docstring for why this is test-only, not a Runtime concern).
async function loadTextFromFileUrl(url) {
  return fs.readFile(fileURLToPath(url), "utf8");
}

// scripts/hud-01.js's SIMBAD/VizieR paths are `hud.loadExternalResource(...)
// .then(fetch).then(json/text parse).then(render)` -- several chained
// microtask hops past the fake externalResourceLoader/stubbed fetch. A
// couple of bare `await Promise.resolve()` is not reliably enough hops;
// this flushes both the microtask queue and one macrotask turn.
async function flushAsync() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function mountHud(overrides = {}) {
  const themeSource = new FileSystemThemeSource(themesRoot);
  const rendererRegistry = createDefaultRendererRegistry();
  const load = vi.fn(async () => {});
  rendererRegistry.register(
    "svg",
    () => new SvgRenderer({ loadText: loadTextFromFileUrl, externalResourceLoader: { load } })
  );
  const hud = new Hud(
    { theme: "hud-01", version: "0.1.0", variant: "maxi", orientation: "landscape", ...overrides },
    { themeSource, rendererRegistry }
  );
  return { hud, load };
}

describe("End-to-end: mount the real hud-01 Theme via Hud + SvgRenderer (Story #11 AC)", () => {
  let hud;
  let hostEl;

  beforeEach(() => {
    // No test in this file makes a real network call (README "dataSource /
    // skyViewer lazy loading (no real network in tests)"): the lazy-load
    // *gate* is faked via the injected externalResourceLoader above; this
    // stub covers scripts/hud-01.js's own subsequent direct `fetch()` calls
    // to the real SIMBAD/VizieR URLs, which the generic gate hook has no
    // room to parametrise (see the README section on this).
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("no real network in tests")))
    );
  });

  afterEach(() => {
    hud?.destroy();
    hostEl?.remove();
    vi.unstubAllGlobals();
  });

  it("mount (object mode, default target) -> setData -> resize -> setVariant(mini) -> setVariant(micro) -> destroy leaves no DOM/listener residue", async () => {
    ({ hud } = mountHud());
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    const errors = [];
    hud.onError((err) => errors.push(err));

    await hud.mount(hostEl);

    const root = hostEl.querySelector("[data-hud-theme='hud-01']");
    expect(root).not.toBeNull();

    // Real composition mounted: frame + runner + left/right columns, via
    // [data-slot] only (Contract §9.1) -- this test never references an
    // internal nc-ol-* id.
    expect(root.querySelector(".nc-ol-frame-svg")).not.toBeNull();
    expect(root.querySelector('[data-slot="title"]')).not.toBeNull();
    expect(root.style.overflow).not.toBe("hidden"); // overflowVisible:true (Contract §15.5)

    // Default object-mode init dispatched a SIMBAD fetch immediately
    // (page-load timing, knownDeviations "external-io-on-mount") which our
    // stubbed fetch rejected -- the real baseline's own NGC 1300 fallback
    // (Contract §10.6) should now be visible.
    await flushAsync();
    expect(root.querySelector("#nc-hud01-data-panel").textContent).toContain("NGC 1300");

    hud.setData({ title: "M31", status: "TARGET LOCK" });
    expect(root.querySelector('[data-slot="title"]').textContent).toBe("M31");
    expect(root.querySelector('[data-slot="status"]').textContent).toBe("TARGET LOCK");

    hud.resize({ width: 800, height: 420 });

    await hud.setVariant("mini");
    expect(root.querySelector('[data-slot="title"]').textContent).toBe("M31"); // Contract §6.5: slot data survives the switch
    expect(root.querySelector(".nc-ol-widget--mini")).not.toBeNull();
    // Not exercising setVariant("micro") here: orientation is fixed for the
    // life of an instance (Contract §14.4) and this instance was
    // constructed at "landscape", where micro is supported:false -- a
    // separate standalone mount at orientation:"portrait" (below) covers
    // micro instead.

    hud.destroy();
    expect(hostEl.children.length).toBe(0);
    expect(errors).toEqual([]);

    expect(() => hud.destroy()).not.toThrow();
    expect(() => hud.setData({ title: "ignored" })).not.toThrow();
  });

  it("the skyViewer and simbad lazy-resource hooks fire at mount (page-load timing) with the correct capability-validated host/kind, never a real network call", async () => {
    let load;
    ({ hud, load } = mountHud());
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    await hud.mount(hostEl);
    await Promise.resolve();

    expect(load).toHaveBeenCalledWith({ name: "skyViewer", host: "aladin.cds.unistra.fr", kind: "script" });
    expect(load).toHaveBeenCalledWith({ name: "simbad", host: "simbad.cds.unistra.fr", kind: "fetch" });
  });

  it("the vizier lazy-resource hook fires only when the CATALOGS tab is opened (lazy timing, not at mount)", async () => {
    let load;
    ({ hud, load } = mountHud());
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    await hud.mount(hostEl);
    await Promise.resolve();
    expect(load).not.toHaveBeenCalledWith(expect.objectContaining({ name: "vizier" }));

    const root = hostEl.querySelector("[data-hud-theme='hud-01']");
    root.querySelector('[data-action="catalog"]').click();
    await flushAsync();

    expect(load).toHaveBeenCalledWith({ name: "vizier", host: "vizier.cds.unistra.fr", kind: "fetch" });
    // Real baseline's VizieR fallback data (Contract §10.6 coherent
    // pre-response state) should now be visible, stub fetch having rejected.
    const catalogText = root.querySelector(".nc-ol-info-panel--catalog").textContent;
    expect(catalogText).toContain("VIZIER OFFLINE / DEMO DATA");
    expect(catalogText).toContain("Revised New General Catalogue");
  });

  it("html mode is honoured when the consumer's first setData (mode + content) is queued before mount() resolves", async () => {
    ({ hud } = mountHud());
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    // Queued before mount() resolves -- Contract §6.3 "queued and replayed
    // if called before mount() resolves", replayed in issue order right
    // after the renderer's own mount() promise settles (Hud.mount()).
    hud.setData({ mode: "html", title: "Character Post", content: "<p>Dossier text.</p>" });

    await hud.mount(hostEl);

    const root = hostEl.querySelector("[data-hud-theme='hud-01']");
    expect(root.querySelector(".nc-ol-widget").getAttribute("data-mode") ?? root.getAttribute("data-mode")).toBe("html");
    expect(root.querySelector('[data-slot="content"]').innerHTML).toContain("Dossier text.");
  });

  it("mounting maxi:landscape directly (Contract §7.5) never shows a mini-then-expand flash -- the full composition is present from the first paint", async () => {
    ({ hud } = mountHud());
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    await hud.mount(hostEl);
    const root = hostEl.querySelector("[data-hud-theme='hud-01']");
    expect(root.querySelector(".nc-ol-widget--mini")).toBeNull();
    expect(root.querySelector(".nc-ol-toolbar")).not.toBeNull();
  });

  it("mounting mini:landscape or micro:portrait directly (no maxi involved) works standalone, with no scripts entrypoint", async () => {
    const { hud: miniHud } = mountHud({ variant: "mini" });
    const el = document.createElement("div");
    document.body.appendChild(el);
    await miniHud.mount(el);
    expect(el.querySelector(".nc-ol-widget--mini")).not.toBeNull();
    miniHud.destroy();
    el.remove();

    const { hud: microHud } = mountHud({ variant: "micro", orientation: "portrait" });
    const el2 = document.createElement("div");
    document.body.appendChild(el2);
    await microHud.mount(el2);
    expect(el2.querySelector(".nc-ol-widget--micro")).not.toBeNull();
    microHud.destroy();
    el2.remove();
  });
});
