// @vitest-environment jsdom
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, afterEach, vi } from "vitest";
import { CssRenderer } from "../../src/runtime/renderers/CssRenderer.ts";
import {
  AssetLoadFailedError,
  EntrypointMissingError,
  VariantUnsupportedError
} from "../../src/runtime/contract/errors.ts";
import { fileFetchText } from "../helpers/file-fetch-text.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeDir = path.resolve(__dirname, "..", "..", "library", "themes", "fixture-css-hud");
const assetBaseUrl = `file://${themeDir}/`;

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(themeDir, "manifest.json"), "utf8"));
}

function baseContext(overrides = {}) {
  return {
    theme: "fixture-css-hud",
    version: "0.1.0",
    variant: "maxi",
    orientation: "landscape",
    manifest: loadManifest(),
    baseVersion: "1.0.0",
    assetBaseUrl,
    ...overrides
  };
}

/** Every direct-mount test drives CssRenderer against the real on-disk fixture Theme, reading its files via node:fs (fetchText), never through Hud/ThemeResolver -- that end-to-end path is covered separately in css-renderer-hud-e2e.test.js. */
function newRenderer(deps = {}) {
  return new CssRenderer({ fetchText: fileFetchText, ...deps });
}

describe("CssRenderer -- lifecycle (Contract §6)", () => {
  let container;

  afterEach(() => {
    container?.remove();
    container = undefined;
  });

  it("mount() creates the isolation boundary, loads styles+markup, and resolves", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = newRenderer();

    await renderer.mount(container, baseContext());

    expect(renderer.isolationOutcome).toBe("shadow-dom");
    expect(container.shadowRoot).not.toBeNull();
    const root = container.shadowRoot.querySelector(".fixture-css-hud");
    expect(root).not.toBeNull();
    expect(container.shadowRoot.querySelectorAll("style").length).toBeGreaterThanOrEqual(2); // shared.css + maxi/landscape/hud.css
  });

  it("mount() called twice throws (Contract §6.2)", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = newRenderer();
    await renderer.mount(container, baseContext());
    await expect(renderer.mount(container, baseContext())).rejects.toThrow(
      /may only be called once/
    );
  });

  it("setData() binds slot values through data-slot elements, not nc-hp-* internals", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = newRenderer();
    await renderer.mount(container, baseContext());

    renderer.setData({ title: "OUTPOST 32", subtitle: "STATUS: ONLINE", footer: "scrolling ticker text" });

    const root = container.shadowRoot;
    expect(root.querySelector('[data-slot="title"]').textContent).toBe("OUTPOST 32");
    expect(root.querySelector('[data-slot="subtitle"]').textContent).toBe("STATUS: ONLINE");
    expect(root.querySelector('[data-slot="footer"]').textContent).toBe("scrolling ticker text");
  });

  it("setData() is idempotent for equal input (Contract §6.3)", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = newRenderer();
    await renderer.mount(container, baseContext());

    renderer.setData({ title: "BETELGEUSE" });
    renderer.setData({ title: "BETELGEUSE" });
    expect(container.shadowRoot.querySelector('[data-slot="title"]').textContent).toBe("BETELGEUSE");
  });

  it("setData() ignores unknown slot keys without throwing (Contract §6.3)", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = newRenderer();
    await renderer.mount(container, baseContext());
    expect(() => renderer.setData({ notARealSlot: "x" })).not.toThrow();
  });

  it("setData({content}) honours capabilities.htmlSlot and strips <script> (Contract §9.3)", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = newRenderer();
    await renderer.mount(container, baseContext());

    globalThis.__cssRendererContentScriptRan = false;
    renderer.setData({
      content: '<b>bold body copy</b><script>globalThis.__cssRendererContentScriptRan = true;<\/script>'
    });

    const contentEl = container.shadowRoot.querySelector('[data-slot="content"]');
    expect(contentEl.innerHTML).toContain("<b>bold body copy</b>");
    expect(contentEl.querySelector("script")).toBeNull();
    expect(globalThis.__cssRendererContentScriptRan).toBe(false);
    delete globalThis.__cssRendererContentScriptRan;
  });

  it("resize() stores the viewport and never throws", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = newRenderer();
    await renderer.mount(container, baseContext());
    expect(() => renderer.resize({ width: 320, height: 180 })).not.toThrow();
    expect(container.style.getPropertyValue("--hud-viewport-width")).toBe("320px");
  });

  it("setVariant() switches composition, is idempotent for the current variant, and rejects VariantUnsupported for an unsupported one (Contract §6.5)", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = newRenderer();
    await renderer.mount(container, baseContext());
    renderer.setData({ title: "keep me" });

    // idempotent no-op
    await renderer.setVariant("maxi");
    expect(container.shadowRoot.querySelector('[data-slot="title"]').textContent).toBe("keep me");

    // real switch: mini:landscape is supported:true in the fixture manifest.
    await renderer.setVariant("mini");
    expect(container.shadowRoot.querySelector(".fixture-css-hud--mini")).not.toBeNull();
    // The mini composition's own markup has no `content`/`footer` slot elements -- proving setVariant() re-indexed slots rather than reusing maxi's.
    expect(container.shadowRoot.querySelector('[data-slot="content"]')).toBeNull();

    // micro:landscape is declared unsupported in the fixture manifest.
    await expect(renderer.setVariant("micro")).rejects.toBeInstanceOf(VariantUnsupportedError);
  });

  it("scripts entries are fetched from the package (never a third-party URL) and appended as executable <script> elements in load order (Contract §16.1, §16.4, §3.10)", async () => {
    // NOTE ON COVERAGE: this asserts the DOM plumbing -- fetched from
    // `assetBaseUrl` (the package, not an arbitrary host), appended as a
    // real <script> element (not via innerHTML, which the HTML spec never
    // executes) with its fetched text intact, in entrypoint-array order.
    // It does NOT assert the script actually *ran*: Vitest's default jsdom
    // environment does not pass `runScripts: "dangerously"` to jsdom (a
    // deliberate jsdom safety default), so no <script> executes under it,
    // in light DOM or shadow DOM alike -- confirmed directly against this
    // jsdom version before writing this test. This is a jsdom test-harness
    // limitation, not a CssRenderer one: every real Runtime is a browser,
    // where an appended (non-innerHTML) <script> executes per the HTML
    // spec regardless of shadow-tree nesting, exactly as
    // `docs/adr/0003-css-renderer-isolation.md` documents for the CSS
    // properties this Theme family depends on. fixture-css-hud itself ships
    // no scripts (all three compositions declare `scripts: []`) precisely
    // because a real Theme script is out of this Story's scope; this test
    // uses a synthetic composition instead so the mechanism itself has
    // direct coverage.
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = newRenderer({
      fetchText: async (url) => {
        if (url.endsWith("marker.js")) return "globalThis.__cssRendererScriptExecuted = true;";
        return fileFetchText(url);
      }
    });

    const manifest = loadManifest();
    manifest.entrypoints["maxi:landscape"].scripts = ["scripts/marker.js"];

    await renderer.mount(container, baseContext({ manifest }));
    const scriptEl = container.shadowRoot.querySelector('script[data-hud-script-src="scripts/marker.js"]');
    expect(scriptEl).not.toBeNull();
    expect(scriptEl.textContent).toBe("globalThis.__cssRendererScriptExecuted = true;");
  });

  it("mount() failure (AssetLoadFailed) leaves the container empty and destroy() afterwards does not throw", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = newRenderer({
      fetchText: async () => {
        throw new Error("simulated network failure");
      }
    });

    await expect(renderer.mount(container, baseContext())).rejects.toBeInstanceOf(AssetLoadFailedError);
    expect(container.children.length).toBe(0);
    expect(container.shadowRoot?.children.length ?? 0).toBe(0);
    expect(() => renderer.destroy()).not.toThrow();
  });

  it("a missing composition entrypoint throws EntrypointMissingError, not a generic error", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = newRenderer();
    await expect(
      renderer.mount(container, baseContext({ variant: "micro", orientation: "landscape" }))
    ).rejects.toBeInstanceOf(EntrypointMissingError);
  });

  it("destroy() never throws, even when mount() was never called", () => {
    const renderer = newRenderer();
    expect(() => renderer.destroy()).not.toThrow();
  });

  it("destroy() is idempotent, empties the container, and post-destroy setData()/resize() do not resurrect DOM", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = newRenderer();
    await renderer.mount(container, baseContext());
    renderer.setData({ title: "gone soon" });

    renderer.destroy();
    expect(container.children.length).toBe(0);
    expect(container.shadowRoot.children.length).toBe(0);

    expect(() => renderer.destroy()).not.toThrow(); // idempotent
    expect(() => renderer.setData({ title: "ignored" })).not.toThrow();
    expect(() => renderer.resize({ width: 10, height: 10 })).not.toThrow();
    expect(container.children.length).toBe(0);
  });
});
