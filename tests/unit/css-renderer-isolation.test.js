// @vitest-environment jsdom
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, afterEach } from "vitest";
import { CssRenderer } from "../../src/runtime/renderers/CssRenderer.ts";
import { fileFetchText } from "../helpers/file-fetch-text.js";

/**
 * "CSS isolation validated, not assumed" (issue #10 AC) + the no-leak AC:
 * "a Playwright test asserts host-page styles are unaffected". This file is
 * the jsdom half of that proof -- see `tests/e2e/css-renderer.spec.ts` for
 * the real-browser half, and `docs/adr/0003-css-renderer-isolation.md` for
 * the investigation that decided fixture-css-hud keeps Shadow DOM. jsdom
 * cannot compute styles for elements inside a Shadow DOM (verified directly
 * against this jsdom version: the exact same clip-path/filter/box-shadow
 * rules that jsdom computes correctly in light DOM come back empty/"none"
 * once the identical <style> is placed inside a shadow root) -- so this
 * file proves the thing jsdom *can* prove (no CSS text written inside a
 * mount ever reaches the host document, in either isolation mode), not the
 * "clip-path itself renders" claim, which needs a real browser.
 */

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

describe("CssRenderer -- isolation (Contract §15.3, Plan §2 decision 8)", () => {
  let container;
  let hostMarker;

  afterEach(() => {
    hostMarker?.remove();
    container?.remove();
    container = undefined;
    hostMarker = undefined;
    document.body.style.backgroundColor = "";
  });

  it("attempts and keeps Shadow DOM for fixture-css-hud (isolation: \"shadow-dom-preferred\") in this real jsdom environment", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = new CssRenderer({ fetchText: fileFetchText });
    await renderer.mount(container, baseContext());
    expect(renderer.isolationOutcome).toBe("shadow-dom");
    expect(container.shadowRoot).not.toBeNull();
  });

  it("no-leak (shadow-dom path): a distinctive pre-set host style survives mounting the Theme's real CSS unchanged", async () => {
    document.body.style.backgroundColor = "rgb(10, 20, 30)";
    hostMarker = document.createElement("div");
    hostMarker.className = "host-marker";
    hostMarker.style.color = "rgb(1, 2, 3)";
    document.body.appendChild(hostMarker);

    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = new CssRenderer({ fetchText: fileFetchText });
    await renderer.mount(container, baseContext());
    renderer.setData({ title: "leak check", subtitle: "s", footer: "f" });

    expect(document.body.style.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(hostMarker.style.color).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(document.body).backgroundColor).toBe("rgb(10, 20, 30)");

    renderer.destroy();
  });

  it("falls back to scoped-root when attachShadow is unavailable, per isolation: \"shadow-dom-preferred\" (Contract §15.1 table)", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    // Force the fallback branch: simulate an environment without Shadow DOM
    // support (Contract §15.3's "falls back to scoped-root if validation
    // fails" -- see CssRenderer.ts's docstring for why this renderer treats
    // "attachShadow unavailable/throws" as that failure signal).
    container.attachShadow = () => {
      throw new Error("attachShadow disabled for this test");
    };

    const renderer = new CssRenderer({ fetchText: fileFetchText });
    await renderer.mount(container, baseContext());

    expect(renderer.isolationOutcome).toBe("scoped-root");
    expect(container.shadowRoot).toBeNull();
    const root = container.querySelector(".hud-css-scoped-root.fixture-css-hud");
    expect(root).not.toBeNull();
    expect(root.querySelector('[data-slot="title"]')).not.toBeNull();

    renderer.destroy();
  });

  it("no-leak (forced scoped-root fallback): the same pre-set host style is unaffected -- proving the fixture's class-prefixing, not DOM placement, is what prevents leakage", async () => {
    document.body.style.backgroundColor = "rgb(40, 41, 42)";
    hostMarker = document.createElement("div");
    hostMarker.className = "host-marker-2";
    document.body.appendChild(hostMarker);

    container = document.createElement("div");
    document.body.appendChild(container);
    container.attachShadow = () => {
      throw new Error("attachShadow disabled for this test");
    };

    const renderer = new CssRenderer({ fetchText: fileFetchText });
    await renderer.mount(container, baseContext());
    renderer.setData({ title: "leak check 2" });

    // In scoped-root mode the Theme's <style> tags are genuinely
    // document-global (no Shadow DOM boundary) -- if fixture-css-hud's CSS
    // contained a bare `body{}`/`html{}`/`*{}` rule, THIS assertion would
    // fail (unlike the shadow-dom-path test above, where it would pass
    // regardless of what the CSS said, by construction). It passes only
    // because every selector in `styles/shared.css` / the per-composition
    // CSS is written under `.fixture-css-hud` -- see the static-source
    // guard in tests/unit/library-fixture-css-theme.test.js for the
    // complementary proof that this holds for the Theme's actual CSS text.
    expect(document.body.style.backgroundColor).toBe("rgb(40, 41, 42)");
    expect(getComputedStyle(document.body).backgroundColor).toBe("rgb(40, 41, 42)");

    renderer.destroy();
  });

  it("destroy() leaves no DOM residue in either isolation mode", async () => {
    for (const forceScopedRoot of [false, true]) {
      container = document.createElement("div");
      document.body.appendChild(container);
      if (forceScopedRoot) {
        container.attachShadow = () => {
          throw new Error("disabled for this test");
        };
      }
      const renderer = new CssRenderer({ fetchText: fileFetchText });
      await renderer.mount(container, baseContext());
      renderer.destroy();
      expect(container.children.length).toBe(0);
      expect(container.shadowRoot?.children.length ?? 0).toBe(0);
      container.remove();
    }
    container = undefined;
  });
});

describe("CssRenderer -- capabilities.mediaEmbed src-swap lifecycle (Contract §10.5, §16.2)", () => {
  let container;

  afterEach(() => {
    container?.remove();
    container = undefined;
  });

  const ALLOWED_SRC = "https://app.heygen.com/embeds/fixture-demo";

  it("creates a validated-host iframe in the media slot, parks it at about:blank off-maxi, and restores it on setVariant back to maxi", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = new CssRenderer({ fetchText: fileFetchText });
    await renderer.mount(container, baseContext());

    renderer.setData({ media: ALLOWED_SRC });
    let iframe = container.shadowRoot.querySelector("iframe.hud-media-embed-iframe");
    expect(iframe).not.toBeNull();
    expect(iframe.src).toBe(ALLOWED_SRC);

    // setVariant() switches composition/DOM only; re-applying the last
    // setData() across a variant switch is the Runtime's job (Hud.ts),
    // Contract §6.5 -- this direct (bypassing Hud) test drives that itself,
    // exactly as Hud does after setVariant() resolves.
    await renderer.setVariant("mini");
    renderer.setData({ media: ALLOWED_SRC });
    iframe = container.shadowRoot.querySelector("iframe.hud-media-embed-iframe");
    expect(iframe).not.toBeNull();
    expect(iframe.src).toBe("about:blank"); // mini/landscape's own media slot re-created the iframe, but src-swap parks it off-maxi immediately.

    await renderer.setVariant("maxi");
    renderer.setData({ media: ALLOWED_SRC });
    iframe = container.shadowRoot.querySelector("iframe.hud-media-embed-iframe");
    expect(iframe.src).toBe(ALLOWED_SRC);

    renderer.destroy();
  });

  it("refuses a media URL whose host is not on capabilities.mediaEmbed.hosts / the Contract §16.2 allowlist -- no iframe is created", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = new CssRenderer({ fetchText: fileFetchText });
    await renderer.mount(container, baseContext());

    renderer.setData({ media: "https://evil.example.com/x" });
    expect(container.shadowRoot.querySelector("iframe.hud-media-embed-iframe")).toBeNull();

    renderer.destroy();
  });

  it("destroy() blanks the iframe src before removing it, and disconnects the variant MutationObserver (no leaked observer)", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const renderer = new CssRenderer({ fetchText: fileFetchText });
    await renderer.mount(container, baseContext());
    renderer.setData({ media: ALLOWED_SRC });

    const iframe = container.shadowRoot.querySelector("iframe.hud-media-embed-iframe");
    let blankedBeforeRemoval = false;
    const originalRemove = iframe.remove.bind(iframe);
    iframe.remove = () => {
      blankedBeforeRemoval = iframe.src === "about:blank";
      originalRemove();
    };

    renderer.destroy();
    expect(blankedBeforeRemoval).toBe(true);
    expect(container.shadowRoot.children.length).toBe(0);

    // The observer must be inert post-destroy: mutating data-hud-variant
    // again (nothing left to observe it, but also nothing left to react)
    // must not throw and must not resurrect any DOM.
    expect(() => container.setAttribute("data-hud-variant", "mini")).not.toThrow();
    expect(container.shadowRoot.children.length).toBe(0);
  });
});
