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

// `loadImpl` lets a test override the externalResourceLoader's `load` (e.g.
// to reject a specific resource name, like "skyViewer", to simulate an
// Aladin CDN failure) -- defaults to the existing always-resolves stub.
function mountHud(overrides = {}, loadImpl = async () => {}) {
  const themeSource = new FileSystemThemeSource(themesRoot);
  const rendererRegistry = createDefaultRendererRegistry();
  const load = vi.fn(loadImpl);
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

// Deferred fetch response -- lets a test control exactly when a given
// fetch() call resolves, to reproduce a network race deterministically
// instead of relying on real timing.
function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function jsonResponse(body) {
  return { ok: true, json: async () => body };
}

const SIMBAD_METADATA = [
  { name: "main_id" }, { name: "otype" }, { name: "ra" }, { name: "dec" },
  { name: "rvz_redshift" }, { name: "rvz_radvel" }, { name: "nbref" },
  { name: "galdim_majaxis" }, { name: "galdim_minaxis" }, { name: "morph_type" }
];

function simbadRow(mainId) {
  return { metadata: SIMBAD_METADATA, data: [[mainId, "G", 10.68, 41.27, 0.0001, 300, 42, 3, 1, "Sb"]] };
}

const PAPERS_METADATA = [{ name: "title" }, { name: "year" }, { name: "bibcode" }, { name: "journal" }];

function papersRow(title) {
  return { metadata: PAPERS_METADATA, data: [[title, 2020, "2020xxxx", "ApJ"]] };
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

describe("Story #36 regression: SIMBAD/Papers race conditions and the hidden Aladin fallback (hud-01)", () => {
  let hud;
  let hostEl;

  afterEach(() => {
    hud?.destroy();
    hostEl?.remove();
    vi.unstubAllGlobals();
  });

  it("SIMBAD race: a stale in-flight fetch for the default target resolving AFTER a newer setData({objectName}) call must not overwrite the newer target's data -- the DATA panel ends up showing the last-requested target regardless of resolution order", async () => {
    const fetchCalls = [];
    vi.stubGlobal("fetch", vi.fn((url) => {
      const d = deferred();
      fetchCalls.push({ url, ...d });
      return d.promise;
    }));

    ({ hud } = mountHud());
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    await hud.mount(hostEl);
    await flushAsync();
    // Mount's own object-mode init dispatched a SIMBAD fetch for the
    // default target (NGC 1300); it has not resolved yet.
    expect(fetchCalls.length).toBe(1);

    const root = hostEl.querySelector("[data-hud-theme='hud-01']");

    // A newer target is requested while that fetch is still in flight --
    // this used to no-op via the simbadBusy guard (the original bug); it
    // must now queue behind the in-flight fetch instead of being dropped.
    hud.setData({ objectName: "M 31" });
    expect(fetchCalls.length).toBe(1); // still single-flight: no second concurrent fetch dispatched yet

    // The STALE fetch (for the superseded default target) resolves now,
    // after the newer target was already requested.
    fetchCalls[0].resolve(jsonResponse(simbadRow("NGC 1300")));
    await flushAsync();

    // Its response must be discarded, not rendered -- and the queued
    // newer-target fetch must have been drained/dispatched.
    expect(fetchCalls.length).toBe(2);
    expect(root.querySelector("#nc-hud01-data-panel").textContent).not.toContain("NGC 1300");

    fetchCalls[1].resolve(jsonResponse(simbadRow("M 31")));
    await flushAsync();

    const panelText = root.querySelector("#nc-hud01-data-panel").textContent;
    expect(panelText).toContain("M 31");
    expect(panelText).not.toContain("NGC 1300");
  });

  it("Aladin fallback: after a simulated Aladin init failure, the fallback message is actually visible (computed style), not just present in the DOM with textContent set", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("no real network in tests"))));

    ({ hud } = mountHud({}, async ({ name } = {}) => {
      if (name === "skyViewer") throw new Error("Aladin CDN unavailable");
    }));
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    await hud.mount(hostEl);
    await flushAsync();

    const root = hostEl.querySelector("[data-hud-theme='hud-01']");
    const widget = root.querySelector(".nc-ol-widget") ?? root;
    expect(widget.getAttribute("data-aladdin")).toBe("error");

    const label = root.querySelector(".nc-hud-01-aladdin__label");
    expect(label.textContent).toBe("ALADIN LITE UNAVAILABLE");

    // The bug: [data-aladdin="off"] applied display:none to the WHOLE
    // .nc-hud-01-aladdin container (the label's own ancestor), hiding the
    // message it had just written. Assert real computed visibility, not
    // just DOM presence/textContent.
    const container = root.querySelector(".nc-hud-01-aladdin");
    expect(getComputedStyle(container).display).not.toBe("none");
    expect(getComputedStyle(label).display).not.toBe("none");
    expect(getComputedStyle(label).visibility).not.toBe("hidden");
  });

  it("Papers race: same shape as the SIMBAD race, for the PAPERS panel -- the panel ends up showing the last-requested target's papers", async () => {
    const fetchCalls = [];
    vi.stubGlobal("fetch", vi.fn((url) => {
      const d = deferred();
      fetchCalls.push({ url, ...d });
      return d.promise;
    }));

    ({ hud } = mountHud());
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    await hud.mount(hostEl);
    await flushAsync();
    // Discard mount's own default-target SIMBAD (DATA tab) fetch -- not
    // under test here.
    expect(fetchCalls.length).toBe(1);
    fetchCalls[0].resolve(jsonResponse(simbadRow("NGC 1300")));
    await flushAsync();
    fetchCalls.length = 0;

    const root = hostEl.querySelector("[data-hud-theme='hud-01']");
    root.querySelector('[data-action="papers"]').click();
    await flushAsync();
    expect(fetchCalls.length).toBe(1); // PAPERS fetch for the default target, in flight

    hud.setData({ objectName: "M 31" });
    expect(fetchCalls.length).toBe(1); // queued behind the in-flight PAPERS fetch, not a second concurrent one

    fetchCalls[0].resolve(jsonResponse(papersRow("NGC 1300 Paper")));
    await flushAsync();

    expect(fetchCalls.length).toBe(2);
    const panel = root.querySelector(".nc-ol-info-panel--papers");
    expect(panel.textContent).not.toContain("NGC 1300 Paper");

    fetchCalls[1].resolve(jsonResponse(papersRow("M 31 Paper")));
    await flushAsync();

    expect(panel.textContent).toContain("M 31 Paper");
    expect(panel.textContent).not.toContain("NGC 1300 Paper");
  });
});
