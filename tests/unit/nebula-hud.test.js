// @vitest-environment jsdom
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { NebulaHud } from "../../src/runtime/adapters/nebula-hud.ts";
import { createDefaultRendererRegistry } from "../../src/runtime/core/RendererRegistry.ts";
import { SvgRenderer } from "../../src/runtime/renderers/SvgRenderer.ts";
import { FileSystemThemeSource } from "../helpers/file-system-theme-source.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesRoot = path.resolve(__dirname, "..", "..", "library", "themes");

// Same file:// -> text adapter the other e2e suites use (Story #9's own
// e2e test docstring explains why this is test-only, not a Runtime
// concern).
async function loadTextFromFileUrl(url) {
  return fs.readFile(fileURLToPath(url), "utf8");
}

async function flushAsync() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Builds a <nebula-hud> wired against the real hud-01 fixture via
 * FileSystemThemeSource + the real SvgRenderer -- exactly the
 * "mount through the real Runtime in jsdom" pattern `hud-01-e2e.test.js`'s
 * `mountHud()` helper uses, just going through the Custom Element's own
 * `.themeSource`/`.rendererRegistry` test seam instead of `Hud`'s
 * constructor directly.
 */
function createNebulaHud(attrs = {}) {
  const el = document.createElement("nebula-hud");
  el.themeSource = new FileSystemThemeSource(themesRoot);
  const rendererRegistry = createDefaultRendererRegistry();
  rendererRegistry.register(
    "svg",
    () => new SvgRenderer({ loadText: loadTextFromFileUrl, externalResourceLoader: { load: async () => {} } })
  );
  el.rendererRegistry = rendererRegistry;
  el.setAttribute("theme", "hud-01");
  el.setAttribute("version", "0.1.1");
  el.setAttribute("orientation", "landscape");
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

describe("<nebula-hud> Web Component adapter -- inline mode (Story B1, #46)", () => {
  let el;

  beforeEach(() => {
    // No real network in tests -- SvgRenderer's own hud-01 scripts.js
    // dispatches a direct fetch() to SIMBAD on mount; stub it the same way
    // hud-01-e2e.test.js does.
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("no real network in tests"))));
  });

  afterEach(() => {
    el?.remove();
    vi.unstubAllGlobals();
  });

  it("registers the custom element under the exact tag name 'nebula-hud'", () => {
    expect(customElements.get("nebula-hud")).toBe(NebulaHud);
  });

  it("mounts at the configured collapsed variant (mini) inside a shadow root, with no fixed height on the host", async () => {
    el = createNebulaHud({ variant: "mini" });
    document.body.appendChild(el);
    await el.ready;

    expect(el.shadowRoot).not.toBeNull();
    const scopedRoot = el.shadowRoot.querySelector("[data-hud-theme='hud-01']");
    expect(scopedRoot).not.toBeNull();
    expect(scopedRoot.querySelector(".nc-ol-widget--mini")).not.toBeNull();

    // Inline mode (§A.1.1): the element's own box is not given a fixed
    // height by this component's own stylesheet -- it is sized by its
    // mounted content.
    const hostStyle = getComputedStyle(el);
    expect(hostStyle.height).not.toMatch(/^\d/); // "auto", not a fixed px value the component itself set
  });

  it("toggle click cycle: mini -> maxi -> mini, calling hud.setVariant() with the right target each time", async () => {
    el = createNebulaHud({ variant: "mini" });
    document.body.appendChild(el);
    await el.ready;

    // The element does not need to expose the Hud instance for this
    // assertion -- observe the effect (the mounted composition) instead,
    // which is the more direct signal per the issue brief.
    const scopedRootBefore = el.shadowRoot.querySelector("[data-hud-theme='hud-01']");
    expect(scopedRootBefore.querySelector(".nc-ol-widget--mini")).not.toBeNull();

    const button = el.shadowRoot.querySelector(".nebula-hud__toggle");
    expect(button).not.toBeNull();
    expect(button.getAttribute("aria-expanded")).toBe("false");

    button.click();
    await el.toggling;

    const scopedRootExpanded = el.shadowRoot.querySelector("[data-hud-theme='hud-01']");
    expect(scopedRootExpanded.querySelector(".nc-ol-widget--mini")).toBeNull();
    expect(scopedRootExpanded.querySelector(".nc-ol-toolbar")).not.toBeNull(); // maxi-only chrome
    expect(button.getAttribute("aria-expanded")).toBe("true");

    // Click again -- must return to the ORIGINAL collapsed variant (mini),
    // not e.g. "micro" or any HUD/Theme-decided state.
    button.click();
    await el.toggling;

    const scopedRootCollapsed = el.shadowRoot.querySelector("[data-hud-theme='hud-01']");
    expect(scopedRootCollapsed.querySelector(".nc-ol-widget--mini")).not.toBeNull();
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("toggle click cycle honours a 'micro' collapsed variant just as well as 'mini'", async () => {
    el = createNebulaHud({ variant: "micro", orientation: "portrait" });
    el.setAttribute("orientation", "portrait");
    document.body.appendChild(el);
    await el.ready;

    const scopedRootBefore = el.shadowRoot.querySelector("[data-hud-theme='hud-01']");
    expect(scopedRootBefore.querySelector(".nc-ol-widget--micro")).not.toBeNull();

    const button = el.shadowRoot.querySelector(".nebula-hud__toggle");
    button.click();
    await el.toggling;

    // Contract §14.4: orientation is fixed for the instance's life, but
    // "maxi:portrait" is unsupported for hud-01 (knownDeviations
    // no-maxi-portrait) -- setVariant("maxi") should reject
    // VariantUnsupportedError, and this wrapper must revert its own
    // optimistic "expanded" flip rather than get stuck out of sync with
    // what's actually mounted.
    const scopedRootAfterFailedExpand = el.shadowRoot.querySelector("[data-hud-theme='hud-01']");
    expect(scopedRootAfterFailedExpand.querySelector(".nc-ol-widget--micro")).not.toBeNull();
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("REGRESSION (compliance trap, §A.1.1): the toggle button is never a descendant of the mounted Theme's own scoped root", async () => {
    el = createNebulaHud({ variant: "mini" });
    document.body.appendChild(el);
    await el.ready;

    const scopedRoot = el.shadowRoot.querySelector("[data-hud-theme='hud-01']");
    const button = el.shadowRoot.querySelector(".nebula-hud__toggle");
    expect(scopedRoot).not.toBeNull();
    expect(button).not.toBeNull();
    expect(scopedRoot.contains(button)).toBe(false);

    // Also true after expanding to maxi -- the renderer tears down and
    // remounts a brand-new scoped-root subtree on setVariant(); re-check
    // post-toggle so a future renderer change can't silently reparent the
    // button into it.
    const toggleButton = el.shadowRoot.querySelector(".nebula-hud__toggle");
    toggleButton.click();
    await el.toggling;

    const scopedRootAfterExpand = el.shadowRoot.querySelector("[data-hud-theme='hud-01']");
    expect(scopedRootAfterExpand.contains(toggleButton)).toBe(false);
  });

  it("disconnectedCallback calls hud.destroy() and leaves no mounted DOM behind", async () => {
    el = createNebulaHud({ variant: "mini" });
    document.body.appendChild(el);
    await el.ready;

    expect(el.shadowRoot.querySelector("[data-hud-theme='hud-01']")).not.toBeNull();

    el.remove();
    await flushAsync();

    expect(el.shadowRoot.querySelector("[data-hud-theme='hud-01']")).toBeNull();
  });

  it('applies the "data" attribute as initial setData() content once mounted', async () => {
    el = createNebulaHud({ variant: "mini", data: JSON.stringify({ title: "M31", status: "TARGET LOCK" }) });
    document.body.appendChild(el);
    await el.ready;

    const scopedRoot = el.shadowRoot.querySelector("[data-hud-theme='hud-01']");
    expect(scopedRoot.querySelector('[data-slot="title"]').textContent).toBe("M31");
    expect(scopedRoot.querySelector('[data-slot="status"]').textContent).toBe("TARGET LOCK");
  });

  it("the '.data' JS property is an alternative to the 'data' attribute for richer values", async () => {
    el = createNebulaHud({ variant: "mini" });
    el.data = { title: "Programmatic Title" };
    document.body.appendChild(el);
    await el.ready;

    const scopedRoot = el.shadowRoot.querySelector("[data-hud-theme='hud-01']");
    expect(scopedRoot.querySelector('[data-slot="title"]').textContent).toBe("Programmatic Title");
  });
});
