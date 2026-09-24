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

// scripts/hud-02.js's SIMBAD/VizieR paths are `hud.loadExternalResource(...)
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
    { theme: "hud-02", version: "0.1.0", variant: "maxi", orientation: "landscape", ...overrides },
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

describe("End-to-end: mount the real hud-02 Theme via Hud + SvgRenderer (Story #12 AC)", () => {
  let hud;
  let hostEl;

  beforeEach(() => {
    // No test in this file makes a real network call (README "dataSource /
    // skyViewer lazy loading (no real network in tests)"): the lazy-load
    // *gate* is faked via the injected externalResourceLoader above; this
    // stub covers scripts/hud-02.js's own subsequent direct `fetch()` calls
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

  it("mount (object mode, default target) -> setData -> resize -> setVariant(mini) -> destroy leaves no DOM/listener residue", async () => {
    ({ hud } = mountHud());
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    const errors = [];
    hud.onError((err) => errors.push(err));

    await hud.mount(hostEl);

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");
    expect(root).not.toBeNull();

    // Real composition mounted: separate frame + runner-overlay SVGs
    // (Inv §1.14, distinct from hud-01's single-SVG frame+runner), via
    // [data-slot] only (Contract §9.1) -- this test never references an
    // internal nc-or-* id.
    expect(root.querySelector(".nc-or-frame-svg")).not.toBeNull();
    expect(root.querySelector(".nc-or-runner-svg")).not.toBeNull();
    expect(root.querySelector('[data-slot="title"]')).not.toBeNull();
    expect(root.style.overflow).not.toBe("hidden"); // overflowVisible:true (Contract §15.5)

    // Default object-mode init dispatched a SIMBAD fetch immediately
    // (page-load timing, knownDeviations "external-io-on-mount") which our
    // stubbed fetch rejected -- the real baseline's own NGC 1300 fallback
    // (Contract §10.6) should now be visible.
    await flushAsync();
    expect(root.querySelector("#nc-hud02-data-panel").textContent).toContain("NGC 1300");

    hud.setData({ title: "M31", status: "TARGET LOCK" });
    expect(root.querySelector('[data-slot="title"]').textContent).toBe("M31");
    expect(root.querySelector('[data-slot="status"]').textContent).toBe("TARGET LOCK");

    hud.resize({ width: 800, height: 420 });

    await hud.setVariant("mini");
    expect(root.querySelector('[data-slot="title"]').textContent).toBe("M31"); // Contract §6.5: slot data survives the switch
    expect(root.querySelector(".nc-or-widget--mini")).not.toBeNull();
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

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");
    root.querySelector('[data-action="catalog"]').click();
    await flushAsync();

    expect(load).toHaveBeenCalledWith({ name: "vizier", host: "vizier.cds.unistra.fr", kind: "fetch" });
    // Real baseline's VizieR fallback data (Contract §10.6 coherent
    // pre-response state) should now be visible, stub fetch having rejected.
    const catalogText = root.querySelector(".nc-or-info-panel--catalog").textContent;
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

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");
    expect(root.querySelector(".nc-or-widget").getAttribute("data-mode") ?? root.getAttribute("data-mode")).toBe("html");
    expect(root.querySelector('[data-slot="content"]').innerHTML).toContain("Dossier text.");
  });

  it("mounting maxi:landscape directly (Contract §7.5) never shows a mini-then-expand flash -- the full composition is present from the first paint", async () => {
    ({ hud } = mountHud());
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    await hud.mount(hostEl);
    const root = hostEl.querySelector("[data-hud-theme='hud-02']");
    expect(root.querySelector(".nc-or-widget--mini")).toBeNull();
    expect(root.querySelector(".nc-or-toolbar")).not.toBeNull();
  });

  it("mounting mini:landscape or micro:portrait directly (no maxi involved) works standalone, with no scripts entrypoint", async () => {
    const { hud: miniHud } = mountHud({ variant: "mini" });
    const el = document.createElement("div");
    document.body.appendChild(el);
    await miniHud.mount(el);
    expect(el.querySelector(".nc-or-widget--mini")).not.toBeNull();
    miniHud.destroy();
    el.remove();

    const { hud: microHud } = mountHud({ variant: "micro", orientation: "portrait" });
    const el2 = document.createElement("div");
    document.body.appendChild(el2);
    await microHud.mount(el2);
    expect(el2.querySelector(".nc-or-widget--micro")).not.toBeNull();
    microHud.destroy();
    el2.remove();
  });
});

describe("Story #36 regression: SIMBAD/Papers race conditions and the hidden Aladin fallback (hud-02)", () => {
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

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");

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
    expect(root.querySelector("#nc-hud02-data-panel").textContent).not.toContain("NGC 1300");

    fetchCalls[1].resolve(jsonResponse(simbadRow("M 31")));
    await flushAsync();

    const panelText = root.querySelector("#nc-hud02-data-panel").textContent;
    expect(panelText).toContain("M 31");
    expect(panelText).not.toContain("NGC 1300");
  });

  it("destroy() with a queued target clears the pending queue -- a stale fetch settling after destroy() must not start a brand-new, untracked fetch", async () => {
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
    expect(fetchCalls.length).toBe(1); // default-target fetch in flight

    // Queue a newer target while that fetch is still in flight.
    hud.setData({ objectName: "M 31" });

    // Destroy while a fetch is in flight AND a target is queued behind it.
    hud.destroy();

    // The in-flight fetch settles AFTER destroy(). Its .then()/.catch()
    // continuation used to unconditionally call drainSimbadQueue(), which
    // -- since a target was queued -- started a brand-new, untracked fetch
    // from the destroyed instance (Contract §17.1 violation).
    fetchCalls[0].resolve(jsonResponse(simbadRow("NGC 1300")));
    await flushAsync();

    expect(fetchCalls.length).toBe(1); // no new fetch dispatched post-destroy
  });

  it("A->B->A reversion: reverting setData back to the target already in flight must not trigger a redundant re-fetch that clobbers the just-rendered data", async () => {
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
    expect(fetchCalls.length).toBe(1); // NGC 1300's fetch in flight

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");

    hud.setData({ objectName: "M 31" });     // queues M 31 behind the in-flight fetch
    hud.setData({ objectName: "NGC 1300" }); // reverts back to the already-in-flight target

    // The original (never-superseded) fetch resolves and should render
    // normally -- no redundant second fetch should ever be dispatched for
    // the same target, and no "QUERYING SIMBAD..." status should clobber
    // the render that's about to happen.
    fetchCalls[0].resolve(jsonResponse(simbadRow("NGC 1300")));
    await flushAsync();

    expect(fetchCalls.length).toBe(1); // no redundant re-fetch
    expect(root.querySelector("#nc-hud02-data-panel").textContent).toContain("NGC 1300");
  });

  it("3-deep queue overwrite: a third target requested before the first resolves replaces the queued second target -- the middle target is never fetched or rendered", async () => {
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
    expect(fetchCalls.length).toBe(1); // A (NGC 1300) in flight
    expect(decodeURIComponent(fetchCalls[0].url)).toContain("i.id = 'NGC 1300'");

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");

    hud.setData({ objectName: "M 31" }); // B queued
    hud.setData({ objectName: "M 32" }); // C overwrites the queued B -- B is dropped, never fetched

    fetchCalls[0].resolve(jsonResponse(simbadRow("NGC 1300"))); // A settles, discarded (stale)
    await flushAsync();

    expect(fetchCalls.length).toBe(2); // only A and C were ever fetched -- B never was
    expect(root.querySelector("#nc-hud02-data-panel").textContent).not.toContain("M 31");
    // The actual DISPATCHED fetch, not just the (separately, hand-fed)
    // response body, must be for C -- not B. A mutation that made the
    // queue keep the FIRST queued target instead of the last would still
    // pass a response-body-only assertion here (the test controls what
    // each fetch resolves to independent of what it was actually fetching
    // for), so this has to check the real request.
    expect(decodeURIComponent(fetchCalls[1].url)).toContain("i.id = 'M 32'");
    expect(decodeURIComponent(fetchCalls[1].url)).not.toContain("i.id = 'M 31'");

    fetchCalls[1].resolve(jsonResponse(simbadRow("M 32")));
    await flushAsync();

    const panelText = root.querySelector("#nc-hud02-data-panel").textContent;
    expect(panelText).toContain("M 32");
    expect(panelText).not.toContain("M 31");
    expect(panelText).not.toContain("NGC 1300");
  });

  it("3-deep queue overwrite (PAPERS): same shape as the DATA-panel version, for the PAPERS panel's own queue", async () => {
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
    expect(fetchCalls.length).toBe(1); // mount's own DATA-panel fetch, not under test here
    fetchCalls[0].resolve(jsonResponse(simbadRow("NGC 1300")));
    await flushAsync();
    fetchCalls.length = 0;

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");
    root.querySelector('[data-action="papers"]').click();
    await flushAsync();
    expect(fetchCalls.length).toBe(1); // A (NGC 1300) in flight on the PAPERS panel
    expect(decodeURIComponent(fetchCalls[0].url)).toContain("i.id = 'NGC 1300'");

    hud.setData({ objectName: "M 31" }); // B queued
    hud.setData({ objectName: "M 32" }); // C overwrites the queued B -- B is dropped, never fetched

    fetchCalls[0].resolve(jsonResponse(papersRow("NGC 1300 Paper"))); // A settles, discarded (stale)
    await flushAsync();

    expect(fetchCalls.length).toBe(2); // only A and C were ever fetched -- B never was
    const panel = root.querySelector(".nc-or-info-panel--papers");
    expect(panel.textContent).not.toContain("M 31");
    // The actual dispatched fetch must be for C, not the dropped B.
    expect(decodeURIComponent(fetchCalls[1].url)).toContain("i.id = 'M 32'");
    expect(decodeURIComponent(fetchCalls[1].url)).not.toContain("i.id = 'M 31'");

    fetchCalls[1].resolve(jsonResponse(papersRow("M 32 Paper")));
    await flushAsync();

    const panelText = panel.textContent;
    expect(panelText).toContain("M 32 Paper");
    expect(panelText).not.toContain("M 31");
    expect(panelText).not.toContain("NGC 1300 Paper");
  });

  it("cross-panel currentTarget drift: a target successfully requested and fetched while the PAPERS tab is active must not be silently discarded because the DATA panel's own queue-drain (for a target requested earlier, on a different tab) touched shared state", async () => {
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
    expect(fetchCalls.length).toBe(1); // SIMBAD(A=NGC 1300) in flight, DATA tab active by default

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");

    // DATA tab active: request B -- queues behind the in-flight SIMBAD(A).
    hud.setData({ objectName: "M 31" }); // B

    // Switch to PAPERS tab -- fires PAPERS(B), since B is now the widget's
    // last-requested target.
    root.querySelector('[data-action="papers"]').click();
    await flushAsync();
    expect(fetchCalls.length).toBe(2); // SIMBAD(A) still in flight; PAPERS(B) now in flight too

    // PAPERS tab active: request C -- queues behind the in-flight
    // PAPERS(B). The DATA panel's own queue (still holding stale B from
    // the step above) is a SEPARATE pipeline and is not touched by this.
    hud.setData({ objectName: "M 32" }); // C

    // SIMBAD(A) resolves: correctly discarded as stale (A was superseded
    // long ago); draining the DATA panel's own queue fires a needless --
    // but harmless -- SIMBAD(B) fetch.
    fetchCalls[0].resolve(jsonResponse(simbadRow("NGC 1300")));
    await flushAsync();
    expect(fetchCalls.length).toBe(3);

    // PAPERS(B) resolves. This must be recognised as stale (C is the
    // actual last-requested target for the PAPERS panel) regardless of
    // whatever the sibling DATA panel's own drain just did -- it must be
    // discarded, not rendered, and its own drain must fire PAPERS(C).
    fetchCalls[1].resolve(jsonResponse(papersRow("M 31 Paper")));
    await flushAsync();
    expect(fetchCalls.length).toBe(4);

    // The needless SIMBAD(B) resolves too -- must not corrupt anything
    // else in flight.
    fetchCalls[2].resolve(jsonResponse(simbadRow("M 31")));
    await flushAsync();

    // PAPERS(C) -- the user's actual LAST request on the active tab,
    // successfully fetched -- must render. This is the crux of the bug:
    // it used to be silently discarded as "stale" because the DATA
    // panel's own queue-drain (for an unrelated, earlier request) had
    // corrupted the shared currentTarget out from under it.
    fetchCalls[3].resolve(jsonResponse(papersRow("M 32 Paper")));
    await flushAsync();

    const panelText = root.querySelector(".nc-or-info-panel--papers").textContent;
    expect(panelText).toContain("M 32 Paper");
    expect(panelText).not.toContain("M 31 Paper");
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

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");
    const widget = root.querySelector(".nc-or-widget") ?? root;
    expect(widget.getAttribute("data-aladdin")).toBe("error");

    const label = root.querySelector(".nc-hud-02-aladdin__label");
    expect(label.textContent).toBe("ALADIN LITE UNAVAILABLE");

    // The bug: [data-aladdin="off"] applied display:none to the WHOLE
    // .nc-hud-02-aladdin container (the label's own ancestor), hiding the
    // message it had just written. Assert real computed visibility, not
    // just DOM presence/textContent.
    const container = root.querySelector(".nc-hud-02-aladdin");
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

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");
    root.querySelector('[data-action="papers"]').click();
    await flushAsync();
    expect(fetchCalls.length).toBe(1); // PAPERS fetch for the default target, in flight

    hud.setData({ objectName: "M 31" });
    expect(fetchCalls.length).toBe(1); // queued behind the in-flight PAPERS fetch, not a second concurrent one

    fetchCalls[0].resolve(jsonResponse(papersRow("NGC 1300 Paper")));
    await flushAsync();

    expect(fetchCalls.length).toBe(2);
    const panel = root.querySelector(".nc-or-info-panel--papers");
    expect(panel.textContent).not.toContain("NGC 1300 Paper");

    fetchCalls[1].resolve(jsonResponse(papersRow("M 31 Paper")));
    await flushAsync();

    expect(panel.textContent).toContain("M 31 Paper");
    expect(panel.textContent).not.toContain("NGC 1300 Paper");
  });

  it("html-mode network leak: mounting directly with setData({mode:'html'}) queued before mount() STILL dispatches the object-mode skyViewer/simbad calls -- the behaviour manifest.json now honestly discloses as the 'html-mode-initial-mount' deviation, not an unqualified 'no network' claim", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("no real network in tests"))));

    let load;
    ({ hud, load } = mountHud());
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    // Queued before mount() resolves, exactly like the existing "html mode
    // is honoured" test -- Contract §6.3.
    hud.setData({ mode: "html", title: "Character Post", content: "<p>Dossier text.</p>" });
    await hud.mount(hostEl);
    await flushAsync();

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");
    expect((root.querySelector(".nc-or-widget") ?? root).getAttribute("data-mode")).toBe("html");

    // The documented deviation: this Theme's mount() cannot see the
    // intended html mode before its own synchronous init runs (no
    // MountContext.config to read), so the object-mode network calls fire.
    // Asserted here so the manifest's disclosure and the real behaviour
    // cannot silently drift apart.
    expect(load).toHaveBeenCalledWith({ name: "skyViewer", host: "aladin.cds.unistra.fr", kind: "script" });
    expect(load).toHaveBeenCalledWith({ name: "simbad", host: "simbad.cds.unistra.fr", kind: "fetch" });
  });
});

describe("Story #43: capabilities.mediaEmbed on hud-02's existing (image) media slot", () => {
  let hud;
  let hostEl;

  const YOUTUBE_URL = "https://www.youtube.com/embed/dQw4w9WgXcQ";
  const PHOTO_URL = "https://example.com/photo.jpg";

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("no real network in tests"))));
  });

  afterEach(() => {
    hud?.destroy();
    hostEl?.remove();
    vi.unstubAllGlobals();
  });

  it("setData({ media: <allowlisted YouTube URL> }) mounts an iframe and hides the real <img> in place", async () => {
    ({ hud } = mountHud());
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    await hud.mount(hostEl);
    await flushAsync();

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");
    const img = root.querySelector('[data-slot="media"]');
    expect(img).toBeInstanceOf(HTMLImageElement);

    hud.setData({ media: YOUTUBE_URL });

    const iframe = root.querySelector("iframe.hud-media-embed-iframe");
    expect(iframe).not.toBeNull();
    expect(iframe.src).toBe(YOUTUBE_URL);
    expect(img.style.display).toBe("none");
  });

  it("setData({ media: <non-allowlisted photo URL> }) still sets the plain <img>.src directly -- the per-value routing regression test", async () => {
    ({ hud } = mountHud());
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    await hud.mount(hostEl);
    await flushAsync();

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");
    hud.setData({ media: PHOTO_URL });

    const img = root.querySelector('[data-slot="media"]');
    expect(img.src).toBe(PHOTO_URL);
    expect(root.querySelector("iframe.hud-media-embed-iframe")).toBeNull();
    expect(img.style.display).not.toBe("none");
  });

  it("switching media between an embed URL and a photo URL via repeated setData() calls restores/removes the right element each way", async () => {
    ({ hud } = mountHud());
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    await hud.mount(hostEl);
    await flushAsync();

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");
    const img = root.querySelector('[data-slot="media"]');

    hud.setData({ media: YOUTUBE_URL });
    expect(root.querySelector("iframe.hud-media-embed-iframe")).not.toBeNull();
    expect(img.style.display).toBe("none");

    hud.setData({ media: PHOTO_URL });
    expect(root.querySelector("iframe.hud-media-embed-iframe")).toBeNull();
    expect(img.style.display).not.toBe("none");
    expect(img.src).toBe(PHOTO_URL);

    hud.setData({ media: YOUTUBE_URL });
    const iframe = root.querySelector("iframe.hud-media-embed-iframe");
    expect(iframe).not.toBeNull();
    expect(iframe.src).toBe(YOUTUBE_URL);
    expect(img.style.display).toBe("none");
  });

  it("setVariant() away from maxi parks the embed at about:blank (src-swap lifecycle), and restores it back at maxi", async () => {
    ({ hud } = mountHud());
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    await hud.mount(hostEl);
    await flushAsync();
    hud.setData({ media: YOUTUBE_URL });

    let root = hostEl.querySelector("[data-hud-theme='hud-02']");
    let iframe = root.querySelector("iframe.hud-media-embed-iframe");
    expect(iframe.src).toBe(YOUTUBE_URL);

    await hud.setVariant("mini");
    root = hostEl.querySelector("[data-hud-theme='hud-02']");
    iframe = root.querySelector("iframe.hud-media-embed-iframe");
    expect(iframe).not.toBeNull(); // Hud replays the last setData() after setVariant() resolves (Contract §6.5).
    expect(iframe.src).toBe("about:blank");

    await hud.setVariant("maxi");
    root = hostEl.querySelector("[data-hud-theme='hud-02']");
    iframe = root.querySelector("iframe.hud-media-embed-iframe");
    expect(iframe.src).toBe(YOUTUBE_URL);
  });
});

describe("Story #45: mediaEmbed micro-variant degradation (hud-02) -- static poster + play-icon, never a live iframe", () => {
  let hud;
  let hostEl;

  const YOUTUBE_URL = "https://www.youtube.com/embed/dQw4w9WgXcQ";
  const POSTER_URL = "https://example.com/poster.jpg";

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("no real network in tests"))));
  });

  afterEach(() => {
    hud?.destroy();
    hostEl?.remove();
    vi.unstubAllGlobals();
  });

  it("setData({ media: <allowlisted URL>, mediaPoster: <poster URL> }) at micro shows the poster + a non-interactive play-icon, never an iframe", async () => {
    ({ hud } = mountHud({ variant: "micro", orientation: "portrait" }));
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    await hud.mount(hostEl);
    await flushAsync();

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");
    hud.setData({ media: YOUTUBE_URL, mediaPoster: POSTER_URL });

    expect(root.querySelector("iframe.hud-media-embed-iframe")).toBeNull();

    const img = root.querySelector('[data-slot="media"]');
    expect(img).toBeInstanceOf(HTMLImageElement);
    expect(img.src).toBe(POSTER_URL);
    expect(img.style.display).not.toBe("none");

    const playIcon = root.querySelector(".hud-media-play-icon");
    expect(playIcon).not.toBeNull();
    expect(playIcon.style.pointerEvents).toBe("none");
  });

  it("no mediaPoster provided: no live embed, no play-icon, and the existing <img> is left untouched (documented fallback choice)", async () => {
    ({ hud } = mountHud({ variant: "micro", orientation: "portrait" }));
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    await hud.mount(hostEl);
    await flushAsync();

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");
    const img = root.querySelector('[data-slot="media"]');
    expect(img.hasAttribute("src")).toBe(false);

    hud.setData({ media: YOUTUBE_URL });

    expect(root.querySelector("iframe.hud-media-embed-iframe")).toBeNull();
    expect(root.querySelector(".hud-media-play-icon")).toBeNull();
    expect(img.hasAttribute("src")).toBe(false);
  });

  // NOTE: see hud-01-e2e.test.js's identical comment -- a real
  // setVariant("maxi"|"mini") <-> setVariant("micro") round trip cannot be
  // exercised for hud-02 either: same 3-of-6 orientation/variant combo
  // restriction (maxi/mini landscape-only, micro portrait-only), Contract
  // §14.4 fixes orientation for an instance's lifetime.
});

describe("Story #36 regression, confirmed at micro (hud-02): mounting micro:portrait directly never starts the object-mode SIMBAD/Aladin async paths", () => {
  let hud;
  let hostEl;

  afterEach(() => {
    hud?.destroy();
    hostEl?.remove();
    vi.unstubAllGlobals();
  });

  it("mounting micro:portrait directly dispatches no SIMBAD fetch and no skyViewer/Aladin CDN load attempt -- micro:portrait has no scripts entrypoint at all, so the async paths exercised by the maxi-only Story #36 suite above simply never run here; asserted directly rather than assumed", async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error("no real network in tests")));
    vi.stubGlobal("fetch", fetchMock);

    let load;
    ({ hud, load } = mountHud({ variant: "micro", orientation: "portrait" }));
    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    await hud.mount(hostEl);
    await flushAsync();

    expect(load).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    const root = hostEl.querySelector("[data-hud-theme='hud-02']");
    expect(root.querySelector(".nc-or-widget--micro")).not.toBeNull();
  });
});
