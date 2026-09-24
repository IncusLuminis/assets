/**
 * `<nebula-hud>` -- the "0.2, pulled forward" Web Component adapter (Plan §2
 * decision 10; Phase 1 scoping doc §A.1/§A.1.1, Track B, Story B1;
 * IncusLuminis/assets#46).
 *
 * ## Why this exists (read `Hud.ts`'s docstring first if you haven't)
 *
 * HUD Theme Contract 1.0 §7.2 is frozen and explicit: "A `maxi` composition
 * MUST render fully expanded with no collapse toggle and no `is-mini`
 * state." State switching is 100% external -- a consumer calls
 * `hud.setVariant(...)` from *outside* the mounted Theme. This file is
 * exactly that kind of external consumer, just packaged as a reusable
 * Custom Element instead of one-off bootstrap code (the same shape as the
 * HUD Playground's `app.js`/`published.js` or `stellar-attractor-site`
 * PR #80's `hud-platform-demo.client.ts`, generalised behind HTML
 * attributes). It does not touch, extend, or special-case `Hud`,
 * `ThemeResolver`, `RendererRegistry`, or any renderer -- every behaviour
 * here is built entirely on `Hud`'s existing public API
 * (`mount`/`setData`/`setVariant`/`destroy`/`onError`).
 *
 * ## Scope: `inline` mode ONLY (Story B1)
 *
 * Per the scoping doc §A.1.1: the element's own mount container has no
 * fixed height (an ordinary block-level box, sized by its content). On
 * toggle click, this element calls `setVariant()` on the *same* `Hud`
 * instance, mounted into the *same* container -- the renderer tears down
 * the old composition's DOM and mounts the new one in its place, the
 * container naturally grows/shrinks to fit, and the surrounding page
 * reflows around it (exactly like a native `<details>` element, or the real
 * legacy `.nc-ol-widget` widget already in production). There is no
 * backdrop, no overlay, no second `Hud` instance -- that is `modal` mode
 * (§A.1.1's other branch), a deliberately separate, not-yet-built follow-up
 * (tracked separately; see this directory's README).
 *
 * ## API design choices (the brief leaves these open; documented here)
 *
 * - **Attributes** (read once, at `connectedCallback` time -- see below):
 *   - `theme` (required) -- Theme id, forwarded verbatim to `new Hud(...)`.
 *   - `version` (optional, default `"latest"`) -- SemVer or `"latest"`
 *     (Contract §4.4/§14.1).
 *   - `orientation` (optional, default `"landscape"`) -- `"landscape" |
 *     "portrait"` (Contract §8). Fixed for the life of the instance
 *     (Contract §14.4), exactly like the underlying `Hud` instance --
 *     changing this attribute after connect has no effect on an
 *     already-mounted instance (documented no-op, not silently ignored).
 *   - `variant` (optional, default `"mini"`) -- names the **collapsed**
 *     state ("mini" or "micro") this element starts in and returns to on
 *     collapse. This is a fixed per-instance choice (Contract §14.4 again:
 *     orientation/initial variant are instance-lifetime constants) -- it is
 *     not something the HUD or Theme decides, and toggling never changes
 *     which variant "collapsed" means.
 *   - `cdn-base-url` (optional, default `DEFAULT_CDN_BASE_URL`, matching
 *     every other consumer this session) -- the Registry/CDN base URL a
 *     per-instance `RegistryThemeSource` fetches the Theme from. Deliberately
 *     per-instance (not read via `configureHudRuntime`'s process-wide
 *     default): a page may embed several `<nebula-hud>` elements pointed at
 *     different CDN bases, and the whole point of this element is "zero
 *     extra JS beyond a copy-pasted snippet" -- requiring a consumer to
 *     call `configureHudRuntime()` first would violate that goal.
 *   - `data` (optional) -- a JSON string, parsed once at connect and passed
 *     to `hud.setData(...)`. This is the "zero extra JS" path: a
 *     copy-pasted `<nebula-hud data='{"title":"..."}'>` snippet with no
 *     `<script>` at all. Changing this attribute after connect re-parses it
 *     and calls `setData()` again (Contract §6.3: queued/replayed correctly
 *     regardless of mount timing).
 * - **`.data` JS property** (in addition to the `data` attribute) -- a
 *   plain setter, `nebulaHud.data = {...}`, for programmatic consumers who
 *   want to pass values HTML attributes cannot express (objects with
 *   functions, non-JSON-serialisable values, etc.). Whichever is set most
 *   recently wins (both funnel into the same `hud.setData()` call); the
 *   property is the richer, JS-consumer-facing mechanism the attribute
 *   can't be.
 * - **Shadow DOM: yes**, for this element's own chrome (the mount
 *   container + the toggle button), via `attachShadow({mode: "open"})`.
 *   Reasoning: this session already found and fixed a real regression where
 *   a toggle button rendered at ~24x22px because of a CSS
 *   specificity/fallback mismatch against page/legacy-widget CSS. Shadow
 *   DOM's style encapsulation makes that entire bug *class* structurally
 *   impossible here -- host-page CSS cannot reach in and shrink/hide this
 *   element's own toggle button, and this element's own button styling
 *   cannot leak out and affect the host page. This is safe with respect to
 *   the mounted Theme: `document` is the same global regardless of Shadow
 *   DOM nesting, so `SvgRenderer`'s cooperative `document.head`
 *   `<link>`/`<script>` injection is unaffected, and `CssRenderer`'s own
 *   *further-nested* Shadow DOM (for Themes that declare
 *   `isolation: "shadow-dom"`/`"shadow-dom-preferred"`) nests without
 *   conflict -- nested shadow roots are ordinary DOM.
 * - **DOM structure** (inside the shadow root):
 *   `<div class="nebula-hud__mount">` (passed directly to `hud.mount()`;
 *   `Hud.mount()` appends its own `[data-hud-theme]` scoped root as a
 *   *child* of whatever element it's given -- Contract §15.1) as one child
 *   of the shadow root, and `<button class="nebula-hud__toggle">` as a
 *   **separate sibling** of that mount `<div>`, not a descendant of it and
 *   therefore never a descendant of the Theme's own scoped root either.
 *   This is the single most important compliance requirement in this issue
 *   (§A.1.1's compliance note): an accidentally Theme-owned toggle would
 *   violate Contract §7.2 by mistake even though the Contract itself never
 *   changes. See `tests/unit/nebula-hud.test.js` for the regression test.
 * - **Renderer/ThemeSource wiring**: each `<nebula-hud>` instance builds its
 *   own `RendererRegistry` (via `createDefaultRendererRegistry()`, with
 *   `svg`/`css` registered -- the two real, shipped engines) and its own
 *   `RegistryThemeSource(cdnBaseUrl)`, passed directly as `Hud`'s second
 *   constructor argument. This mirrors exactly how this repo's own tests
 *   inject a `FileSystemThemeSource` -- `Hud`'s dependency-injection seam
 *   was built for precisely this kind of self-contained wiring.
 *
 * ## What this element deliberately does NOT do
 *
 * - No `modal` mode (no overlay, no backdrop, no second `Hud` instance) --
 *   out of scope for this Story; tracked separately.
 * - No animated height transition (nice-to-have polish per the issue,
 *   explicitly not required for correctness) -- the container's height is
 *   plain `auto`; the legacy widget's smooth `max-height` transition can be
 *   revisited later without changing this element's public API.
 * - No changes to `Hud`, `ThemeResolver`, `ThemeSource`, `RendererRegistry`,
 *   `RendererInterface`, `SvgRenderer`, `CssRenderer`, any Theme manifest,
 *   or the Contract -- purely additive, wrapper-layer only.
 */
import { Hud } from "../core/Hud.js";
import { createDefaultRendererRegistry } from "../core/RendererRegistry.js";
import { SvgRenderer } from "../renderers/SvgRenderer.js";
import { CssRenderer } from "../renderers/CssRenderer.js";
import { RegistryThemeSource } from "../registry/RegistryThemeSource.js";
import { isOrientation, isVariant } from "../contract/variants.js";
import type { Orientation, Variant } from "../contract/variants.js";
import type { HudError } from "../contract/errors.js";
import type { RendererUnsupportedError } from "../renderers/RendererUnsupportedError.js";

/** Matches every other consumer this session (`RegistryThemeSource`'s own default). */
export const DEFAULT_CDN_BASE_URL = "https://assets-4gy.pages.dev/";

const TAG_NAME = "nebula-hud";

export class NebulaHud extends HTMLElement {
  #shadow: ShadowRoot | undefined;
  #mountEl: HTMLDivElement | undefined;
  #toggleButton: HTMLButtonElement | undefined;

  #hud: Hud | undefined;
  #collapsedVariant: Variant = "mini";
  #expanded = false;
  #dataOverride: unknown;
  #connected = false;

  static get observedAttributes(): string[] {
    return ["data"];
  }

  /**
   * Programmatic initial-data setter (see the file docstring's "API design
   * choices"). Forwards straight into `hud.setData()` when a `Hud` instance
   * already exists; otherwise cached and applied once `connectedCallback()`
   * mounts one (`Hud.setData()` itself also queues pre-mount, per Contract
   * §6.3 -- this cache exists only for the window before a `Hud` instance
   * is even constructed).
   */
  set data(value: unknown) {
    this.#dataOverride = value;
    this.#hud?.setData(value as Parameters<Hud["setData"]>[0]);
  }

  get data(): unknown {
    return this.#dataOverride;
  }

  connectedCallback(): void {
    // Custom Elements can, in principle, receive connectedCallback more
    // than once across a disconnect/reconnect (moving the element in the
    // DOM). `Hud.mount()` may only be called once per instance -- a
    // reconnect must build a fresh `Hud` from scratch, not reuse the old
    // one, so this deliberately does NOT early-return the way a
    // static-content custom element normally would.
    this.#connected = true;
    this.#buildShadowDom();
    void this.#mountHud();
  }

  disconnectedCallback(): void {
    this.#connected = false;
    // Contract §6.6: destroy() is synchronous, idempotent, and MUST NOT
    // throw -- but this wrapper's own call into it is defensive regardless,
    // since a misbehaving renderer is exactly the kind of thing a consumer
    // (this element) should never propagate as an uncaught exception from a
    // lifecycle callback.
    try {
      this.#hud?.destroy();
    } catch (err) {
      console.error(`<${TAG_NAME}>: hud.destroy() threw (Contract §6.6 says it must not) --`, err);
    }
    this.#hud = undefined;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name !== "data" || oldValue === newValue || !this.#connected) return;
    const parsed = this.#parseDataAttribute(newValue);
    if (parsed !== undefined) {
      this.#dataOverride = parsed;
      this.#hud?.setData(parsed as Parameters<Hud["setData"]>[0]);
    }
  }

  // -- construction -----------------------------------------------------

  #buildShadowDom(): void {
    if (this.#shadow) return; // already built by an earlier connect
    const shadow = this.attachShadow({ mode: "open" });
    this.#shadow = shadow;

    const style = document.createElement("style");
    style.textContent = STYLE_TEXT;
    shadow.appendChild(style);

    const mount = document.createElement("div");
    mount.className = "nebula-hud__mount";
    shadow.appendChild(mount);
    this.#mountEl = mount;

    // The toggle button is appended as a SIBLING of `mount`, never as a
    // child of it -- see the file docstring's compliance note. `Hud.mount()`
    // appends its own `[data-hud-theme]` scoped root as a child of `mount`,
    // so this button can never become a descendant of that scoped root.
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nebula-hud__toggle";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Expand");
    button.textContent = "⊕"; // circled plus -- swaps to circled minus once expanded
    button.addEventListener("click", () => void this.#handleToggleClick());
    shadow.appendChild(button);
    this.#toggleButton = button;
  }

  async #mountHud(): Promise<void> {
    const theme = this.getAttribute("theme");
    if (!theme) {
      console.error(`<${TAG_NAME}>: missing required "theme" attribute; nothing mounted`);
      return;
    }
    const version = this.getAttribute("version") ?? "latest";
    const orientationAttr = this.getAttribute("orientation");
    const orientation: Orientation = isOrientation(orientationAttr) ? orientationAttr : "landscape";
    const variantAttr = this.getAttribute("variant");
    const collapsedVariant: Variant = isVariant(variantAttr) ? variantAttr : "mini";
    const cdnBaseUrl = this.getAttribute("cdn-base-url") || DEFAULT_CDN_BASE_URL;

    this.#collapsedVariant = collapsedVariant;
    this.#expanded = false;
    this.#updateToggleUi();

    const rendererRegistry = createDefaultRendererRegistry();
    rendererRegistry.register("svg", () => new SvgRenderer());
    rendererRegistry.register("css", () => new CssRenderer());
    const themeSource = new RegistryThemeSource(cdnBaseUrl);

    let hud: Hud;
    try {
      hud = new Hud(
        { theme, version, variant: collapsedVariant, orientation },
        { themeSource, rendererRegistry }
      );
    } catch (err) {
      console.error(`<${TAG_NAME} theme="${theme}">: invalid configuration --`, err);
      return;
    }
    this.#hud = hud;
    hud.onError((err: HudError | RendererUnsupportedError) => {
      console.error(`<${TAG_NAME} theme="${theme}">: runtime error --`, err);
    });

    const initialData = this.#dataOverride !== undefined ? this.#dataOverride : this.#parseDataAttribute(this.getAttribute("data"));
    if (initialData !== undefined) {
      this.#dataOverride = initialData;
      hud.setData(initialData as Parameters<Hud["setData"]>[0]);
    }

    if (!this.#mountEl) return; // disconnected before this async work resumed
    try {
      await hud.mount(this.#mountEl);
    } catch (err) {
      console.error(`<${TAG_NAME} theme="${theme}">: mount() failed --`, err);
    }
  }

  #parseDataAttribute(raw: string | null): unknown {
    if (raw === null || raw === "") return undefined;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error(`<${TAG_NAME}>: "data" attribute is not valid JSON --`, err);
      return undefined;
    }
  }

  // -- toggle -------------------------------------------------------------

  async #handleToggleClick(): Promise<void> {
    const hud = this.#hud;
    if (!hud) return;
    const wasExpanded = this.#expanded;
    const target: Variant = wasExpanded ? this.#collapsedVariant : "maxi";
    // Optimistic flip: `Hud.setVariant()` already serialises overlapping
    // calls (Contract §6.7.4), so the button's own affordance should track
    // user intent immediately rather than wait a network/DOM round-trip --
    // reverted below if the switch actually fails.
    this.#expanded = !wasExpanded;
    this.#updateToggleUi();
    try {
      await hud.setVariant(target);
    } catch (err) {
      this.#expanded = wasExpanded;
      this.#updateToggleUi();
      console.error(`<${TAG_NAME}>: setVariant("${target}") failed --`, err);
    }
  }

  #updateToggleUi(): void {
    const button = this.#toggleButton;
    if (!button) return;
    button.setAttribute("aria-expanded", String(this.#expanded));
    button.setAttribute("aria-label", this.#expanded ? "Collapse" : "Expand");
    button.textContent = this.#expanded ? "⊖" : "⊕"; // circled minus / circled plus
  }
}

// Component styles: a real, visibly-sized, clearly-clickable control --
// deliberately NOT reusing any of the legacy `.nc-ol-toggle-btn` CSS-variable
// system (there is no equivalent "inherited fallback" gotcha here, since
// this is written from scratch, but the control is still sized/coloured
// explicitly rather than left to rely on browser <button> defaults, which
// is exactly the kind of thing that produced the earlier ~24x22px
// regression this session found elsewhere).
const STYLE_TEXT = `
:host {
  display: block;
  position: relative;
  width: 100%;
  /* Deliberately no fixed height (inline mode, §A.1.1): the container is
     ordinary block-level, sized by whatever composition is currently
     mounted, so the surrounding page reflows around it on toggle. */
}

.nebula-hud__mount {
  width: 100%;
}

.nebula-hud__toggle {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  padding: 0;
  border: 2px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  background: rgba(10, 14, 20, 0.72);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}

.nebula-hud__toggle:hover {
  background: rgba(30, 40, 55, 0.9);
}

.nebula-hud__toggle:focus-visible {
  outline: 2px solid #6cf;
  outline-offset: 2px;
}
`;

if (typeof customElements !== "undefined" && !customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, NebulaHud);
}
