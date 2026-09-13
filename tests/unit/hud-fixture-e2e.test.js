// @vitest-environment jsdom
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, afterEach } from "vitest";
import { Hud } from "../../src/runtime/core/Hud.ts";
import { createDefaultRendererRegistry } from "../../src/runtime/core/RendererRegistry.ts";
import { FileSystemThemeSource } from "../helpers/file-system-theme-source.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesRoot = path.resolve(__dirname, "..", "..", "library", "themes");

/**
 * `fixture-hud` (Story #5) declares `engine: "css"`, and the real CSS
 * renderer (#9/#10... actually #10) does not exist yet -- out of this
 * Story's scope. Per the Story #8 brief's option (a): a trivial,
 * test-only renderer stands in for it here, registered on a fresh
 * `RendererRegistry` for just this test, so the test proves the
 * resolution -> mount -> destroy pipeline end-to-end against the REAL
 * fixture Theme package on disk without needing #10's real CSS renderer to
 * exist. It is deliberately minimal: it renders `data.title` into a text
 * node, adds one `document`-level listener (standing in for what a real
 * Theme script might add) and removes it on `destroy()`, and never leaves
 * any DOM behind after `destroy()`.
 */
class FixtureTestRenderer {
  #container;
  #el;
  #clickHandler;
  #mounted = false;
  #destroyed = false;

  async mount(container, context) {
    if (this.#mounted) throw new Error("FixtureTestRenderer.mount() called twice");
    this.#mounted = true;
    this.#container = container;
    this.context = context;

    const el = document.createElement("div");
    el.className = "fixture-test-hud";
    container.appendChild(el);
    this.#el = el;

    // Stands in for a Theme script attaching a listener during mount
    // (Contract §16.4) -- destroy() below must remove it (Contract §6.6,
    // §17.1-§17.2).
    this.#clickHandler = () => {};
    document.addEventListener("click", this.#clickHandler);
  }

  setData(data) {
    if (!this.#mounted) throw new Error("setData() before mount()");
    this.#el.textContent = typeof data.title === "string" ? data.title : "";
    this.lastData = data;
  }

  resize(viewport) {
    this.lastViewport = viewport;
  }

  async setVariant(variant) {
    this.variant = variant;
  }

  destroy() {
    if (this.#destroyed) return; // Contract §6.6: idempotent.
    this.#destroyed = true;
    if (this.#clickHandler) {
      document.removeEventListener("click", this.#clickHandler);
      this.#clickHandler = undefined;
    }
    if (this.#container) {
      this.#container.innerHTML = "";
    }
  }
}

describe("End-to-end: mount the real fixture-hud Theme via Hud (Story #8 AC 9)", () => {
  let hud;
  let hostEl;

  afterEach(() => {
    hud?.destroy();
    hostEl?.remove();
  });

  it("mount -> setData -> resize -> setVariant -> destroy leaves no DOM/listener residue", async () => {
    const themeSource = new FileSystemThemeSource(themesRoot);
    const rendererRegistry = createDefaultRendererRegistry();
    rendererRegistry.register("css", () => new FixtureTestRenderer());

    hostEl = document.createElement("div");
    document.body.appendChild(hostEl);

    hud = new Hud(
      { theme: "fixture-hud", version: "0.1.0", variant: "maxi", orientation: "landscape" },
      { themeSource, rendererRegistry }
    );

    const errors = [];
    hud.onError((err) => errors.push(err));

    // mount()
    await hud.mount(hostEl);
    expect(hostEl.querySelector(".fixture-test-hud")).not.toBeNull();
    // Contract §15.1: a dedicated scoped-root container was created.
    const root = hostEl.querySelector("[data-hud-theme='fixture-hud']");
    expect(root).not.toBeNull();
    expect(root.getAttribute("data-hud-instance")).toBeTruthy();

    // setData()
    hud.setData({ title: "BETELGEUSE" });
    expect(hostEl.querySelector(".fixture-test-hud").textContent).toBe("BETELGEUSE");

    // resize()
    hud.resize({ width: 320, height: 180 });

    // setVariant() -- mini:landscape is also supported:true in fixture-hud's manifest.
    await hud.setVariant("mini");

    // slot data (Contract §6.5) must survive the switch.
    expect(hostEl.querySelector(".fixture-test-hud").textContent).toBe("BETELGEUSE");

    // destroy() -- the FixtureTestRenderer's own destroy() removes the
    // `click` listener it added during mount (Contract §6.6, §17.1-§17.2);
    // Hud.destroy() removes the scoped-root container it created itself.
    hud.destroy();

    expect(hostEl.children.length).toBe(0); // no residue -- the scoped root itself is gone.
    expect(errors).toEqual([]); // nothing went through the error sink for a clean run.

    // destroy() is idempotent and safe (Contract §6.6).
    expect(() => hud.destroy()).not.toThrow();

    // Post-destroy calls are ignored, not thrown, and do not resurrect DOM (Contract §6.6).
    expect(() => hud.setData({ title: "ignored" })).not.toThrow();
    expect(hostEl.children.length).toBe(0);
  });

  it("its manifest.json is the only manifest fixture-hud carries -- FileSystemThemeSource resolves version + rejects a mismatched one", async () => {
    const themeSource = new FileSystemThemeSource(themesRoot);
    expect(await themeSource.resolveVersion("fixture-hud", "latest")).toBe("0.1.0");
    expect(await themeSource.resolveVersion("fixture-hud", "0.1.0")).toBe("0.1.0");
    await expect(themeSource.resolveVersion("fixture-hud", "9.9.9")).rejects.toMatchObject({
      code: "VersionNotFound"
    });
    await expect(themeSource.resolveVersion("no-such-theme", "latest")).rejects.toMatchObject({
      code: "ThemeNotFound"
    });
  });
});
