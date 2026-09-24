/**
 * The `css`-engine renderer (HUD Theme Contract 1.0 §5.4) -- HUD-03/HUD-04's
 * family: CSS `clip-path` frame, `filter: drop-shadow()` glow, `float`
 * content layout, near-zero JS (Inventory §1.20-§1.36).
 *
 * Implements the Runtime<->renderer lifecycle from
 * `./RendererInterface.ts` (Contract §6) for `engine: "css"`. Register with:
 *
 *   registry.register("css", () => new CssRenderer());
 *
 * per the extension point `RendererRegistry.ts` documents (Story #8) --
 * nothing in `Hud.ts` / `ThemeResolver.ts` changes.
 *
 * ## Isolation (Contract §15.3, Plan §2 decision 8)
 *
 * `manifest.isolation` drives the mount strategy:
 *
 * - `"shadow-dom"` / `"shadow-dom-preferred"`: attempt `container.attachShadow`.
 *   `"shadow-dom"` MUST fail (not fall back) if Shadow DOM is unavailable;
 *   `"shadow-dom-preferred"` falls back to a scoped-root wrapper. The
 *   fixture Theme this Story ships (`library/themes/fixture-css-hud/`)
 *   declares `shadow-dom-preferred` and *keeps* Shadow DOM in every runtime
 *   this renderer actually runs in (browsers and this repo's own
 *   jsdom/Playwright test suites all implement `attachShadow`) -- see
 *   `docs/adr/0003-css-renderer-isolation.md` for the investigation that
 *   decided this (the "validated, not assumed" AC): clip-path/drop-shadow/
 *   float were confirmed, in a real headless browser (Playwright), to render
 *   identically inside a Shadow DOM as in light DOM, and the same real
 *   browser confirmed a Theme-authored `body{}`/`html{}` rule inside the
 *   shadow tree has zero effect on the host page. The scoped-root fallback
 *   branch below exists for Contract conformance (`shadow-dom-preferred`
 *   MUST fall back somewhere if `attachShadow` is unavailable) and is
 *   exercised directly in `tests/unit/css-renderer.test.js` by stubbing out
 *   `attachShadow`, not because fixture-css-hud is expected to need it.
 * - `"scoped-root"`: no Shadow DOM. Contract §15.1's "the build
 *   scopes/prefixes every Theme selector under that root" is a **packaging**
 *   concern (real selector-rewriting tooling is #13/#15's job, out of this
 *   Story's scope). This renderer's half of that contract is narrower and
 *   concrete: it guarantees the scoped-root wrapper always carries a stable,
 *   discoverable class -- `.<manifest.id>` -- for a Theme's *already*
 *   selector-prefixed CSS (hand-authored that way for the fixture Theme, the
 *   way real packaging output would look) to scope against. A `<style>`
 *   element's rules cascade globally regardless of where in the DOM the
 *   `<style>` tag itself sits -- there is no browser "scoped style"
 *   mechanism outside Shadow DOM -- so this only isolates the Theme if the
 *   Theme's CSS text itself never emits a bare `body`/`html`/`:root`/`*`
 *   selector; `tests/unit/css-renderer.test.js` proves the fixture's actual
 *   CSS source satisfies that, and separately proves (functionally, by
 *   forcing the fallback path with a distinctive pre-set host style) that a
 *   Theme honouring the convention does not leak even without Shadow DOM.
 *
 * ## Scripts, media embeds, teardown
 *
 * `entrypoints[key].scripts` are fetched from the Theme's own package (never
 * a third-party URL, Contract §16.1) and executed as classic `<script>`
 * elements appended to the theme root (works inside a Shadow DOM: script
 * execution triggers on non-`innerHTML` insertion regardless of tree,
 * Contract §16.4/§17.1). fixture-css-hud itself ships no scripts (all three
 * compositions' `entrypoints[...].scripts` are `[]`); the mechanism is
 * covered by a dedicated unit test with a fake script instead.
 *
 * `capabilities.mediaEmbed` (Contract §10.5, allowlist §16.2) is wired
 * through the standard `media` slot: `setData({ media: "<allowlisted URL>" })`
 * creates/updates an `<iframe>` inside the Theme's `data-slot="media"`
 * element, after validating the URL's host against both
 * `capabilities.mediaEmbed.hosts` and the Contract's fixed allowlist. A
 * `MutationObserver` on the mount container's `data-hud-variant` attribute
 * (set by this renderer on `mount()`/`setVariant()`) implements the
 * HUD-04-style `"src-swap"` lifecycle (§10.5: parked at `about:blank` except
 * at `maxi`) -- a real, disconnect-on-`destroy()` teardown target, per the
 * Inventory's callout that HUD-04's own `MutationObserver` is never
 * disconnected (Inventory §1.33, §1.35). The full "RECONNECTING..." overlay
 * / iframe-`load` detection UI (Inventory §1.32) is explicitly optional for
 * this Story and not implemented -- the extension point (validated host ->
 * iframe in the `media` slot, kept in sync with variant) is what's required.
 *
 * ## `micro`-variant degradation, not a live embed (Story #45)
 *
 * At `variant === "micro"`, a `media` value that would otherwise resolve to
 * a live embed is diverted to `mediaEmbed.ts`'s `applyMicroEmbedPoster`
 * instead of `mountMediaEmbed`: no iframe is created at `micro` (unusable
 * at HUD-04's ~87x130px-equivalent thumbnail density, and a wasted
 * network/CDN load). The new optional `mediaPoster` custom slot (a plain
 * URL) is shown as a static poster `<img>` inside the `data-slot="media"`
 * container instead, with a purely decorative, non-interactive
 * (`pointer-events: none`) play-icon overlay on top. `mediaPoster` is
 * consumed directly out of `setData()`'s `data` argument (stashed in
 * `#currentMediaPoster`), not routed through `#applySlot`'s generic
 * per-name dispatch, since it has no `[data-slot="mediaPoster"]` element of
 * its own. Switching variant away from `micro` fully remounts the
 * composition (`setVariant()`), and Hud replays the last `setData()`, so
 * the real live-embed path runs again unchanged -- this only ever touches
 * `micro`'s own behaviour. No click-to-expand/interaction logic is added
 * here (issue #46, a separate, parallel track).
 */
import type { MountContext, RendererLifecycle, Viewport } from "./RendererInterface.js";
import type { EntrypointEntry, Manifest } from "../contract/manifest.js";
import { compositionKey } from "../contract/variants.js";
import type { Variant } from "../contract/variants.js";
import {
  AssetLoadFailedError,
  EntrypointMissingError,
  HudError,
  ThemeMountFailedError,
  VariantUnsupportedError
} from "../contract/errors.js";
import {
  applyMediaEmbedLifecycle,
  applyMicroEmbedPoster,
  mountMediaEmbed,
  removeMicroEmbedPoster,
  resolveMediaEmbedUrl,
  unmountMediaEmbed,
  watchVariantForMediaEmbed,
  type MediaEmbedState,
  type MicroPosterState
} from "./mediaEmbed.js";

/** Fetches the text of a package-relative resource, already resolved to an absolute URL. */
export type CssResourceFetcher = (url: string) => Promise<string>;

export interface CssRendererDependencies {
  /**
   * Overrides how `styles`/`markup`/`scripts` text is fetched. Defaults to
   * the global `fetch`, which is what every real (browser) Runtime uses.
   * Exists so tests can serve `library/themes/<id>/` fixtures straight off
   * disk without a real HTTP server -- `fetch()` has no `file:` support in
   * Node/jsdom (verified: it rejects), and `ThemeSource.assetBaseUrl()`'s
   * only 0.1 implementation (`tests/helpers/file-system-theme-source.js`,
   * Story #8) returns a `file://` base for exactly that reason. Kept out of
   * `MountContext` (Story #5/#8's frozen shape) rather than widening the
   * shared interface for a test-only need.
   */
  fetchText?: CssResourceFetcher;
}

/** Diagnostic-only: which isolation mechanism a given instance actually used. Not part of `RendererLifecycle` -- for tests / the ADR's claims, never for a consumer (Contract §5.5). */
export type CssIsolationOutcome = "shadow-dom" | "scoped-root";

async function defaultFetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} fetching "${url}"`);
  }
  return response.text();
}

/** Contract §9.3: "MUST NOT execute `<script>` inside `content`. (the Runtime SHOULD strip it)." A dependency-free, conservative regex strip -- a full sanitizer is a Runtime-wide concern beyond one renderer/Story. */
function stripScriptTags(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script\s*>/gi, "");
}

export class CssRenderer implements RendererLifecycle {
  readonly #fetchText: CssResourceFetcher;

  #mounted = false;
  #destroyed = false;
  #container: HTMLElement | undefined;
  #themeRoot: HTMLElement | ShadowRoot | undefined;
  #manifest: Manifest | undefined;
  #mountContext: MountContext | undefined;
  #variant: Variant | undefined;
  #orientation: MountContext["orientation"] | undefined;
  #contentSlotAllowed = false;
  #styleEls: HTMLStyleElement[] = [];
  #scriptEls: HTMLScriptElement[] = [];
  #slotEls = new Map<string, HTMLElement>();
  #mediaEmbed: MediaEmbedState | undefined;
  /** Story #45: the `micro`-variant poster+play-icon overlay state. */
  #microPoster: MicroPosterState | undefined;
  /** Story #45: the current `mediaPoster` custom slot value, stashed from `setData()`'s `data` argument directly (not DOM-mapped -- see class docstring). */
  #currentMediaPoster: string | undefined;
  #variantObserver: MutationObserver | undefined;
  #isolationOutcome: CssIsolationOutcome | undefined;

  constructor(deps: CssRendererDependencies = {}) {
    this.#fetchText = deps.fetchText ?? defaultFetchText;
  }

  /** See `CssIsolationOutcome`. `undefined` before `mount()` resolves. */
  get isolationOutcome(): CssIsolationOutcome | undefined {
    return this.#isolationOutcome;
  }

  async mount(container: HTMLElement, context: MountContext): Promise<void> {
    if (this.#mounted) {
      // Contract §6.2: "mount MUST be called exactly once per renderer
      // instance. A second call MUST throw." A programmer-misuse case, not
      // a Theme error -- a plain Error, mirroring `Hud.mount()`'s own guard.
      throw new Error("CssRenderer.mount() may only be called once per instance (Contract §6.2)");
    }
    this.#mounted = true;
    this.#container = container;
    this.#mountContext = context;

    const manifest = context.manifest as Manifest;
    this.#manifest = manifest;
    this.#variant = context.variant;
    this.#orientation = context.orientation;
    this.#contentSlotAllowed = manifest.capabilities?.htmlSlot === true;

    const key = compositionKey(context.variant, context.orientation);
    const entrypoint = manifest.entrypoints[key];
    if (!entrypoint) {
      // Defensive: `ThemeResolver` (Story #8) already validated this
      // composition exists before calling `mount()`; this guards CssRenderer
      // itself if ever driven directly (as this Story's own tests do).
      throw new EntrypointMissingError(
        context.theme,
        context.version,
        `entrypoints["${key}"]`,
        context.variant,
        context.orientation
      );
    }

    try {
      const root = this.#createThemeRoot(container, manifest);
      this.#themeRoot = root;

      await this.#loadStyles(root, entrypoint, context);
      await this.#loadMarkup(root, entrypoint, context);
      this.#indexSlots(root);
      await this.#loadScripts(root, entrypoint, context);

      this.#reflectVariantAttribute();
      if (manifest.capabilities?.mediaEmbed && this.#container) {
        this.#variantObserver = watchVariantForMediaEmbed(this.#container, () => this.#applyMediaEmbedLifecycle());
      }
    } catch (err) {
      // Contract §6.2: "leave `container` empty (no partial DOM)" on any
      // mount failure.
      this.#teardownDom();
      this.#mountContext = undefined;
      throw err instanceof HudError ? err : new ThemeMountFailedError(context.theme, context.version, err);
    }
  }

  setData(data: Record<string, unknown>): void {
    if (this.#destroyed) {
      // Contract §6.6: "any further setData ... MUST throw (or be ignored
      // with a logged warning)" -- ignoring matches `Hud.ts`'s own choice.
      console.warn("CssRenderer.setData() called after destroy(); ignored");
      return;
    }
    if (!this.#mounted || !this.#themeRoot) {
      // Contract §6.3 note: "A renderer is not required to accept setData
      // directly before its own mount resolves" -- the Runtime (Hud) queues
      // for us; a direct pre-mount call is a misuse case.
      throw new Error("CssRenderer.setData() called before mount() resolved");
    }
    // Story #45: `mediaPoster` has no `[data-slot="mediaPoster"]` element of
    // its own -- consumed directly here as a plain data value for the
    // `micro`-variant poster degradation, not routed through `#applySlot`'s
    // generic per-name dispatch. See class docstring "Story #45".
    if (Object.prototype.hasOwnProperty.call(data, "mediaPoster")) {
      const posterValue = (data as Record<string, unknown>).mediaPoster;
      this.#currentMediaPoster = typeof posterValue === "string" && posterValue.length > 0 ? posterValue : undefined;
    }
    for (const [name, value] of Object.entries(data)) {
      if (name === "mediaPoster") continue;
      this.#applySlot(name, value);
    }
  }

  resize(viewport: Viewport): void {
    if (!this.#mounted || this.#destroyed || !this.#container) return;
    this.#container.style.setProperty("--hud-viewport-width", `${viewport.width}px`);
    this.#container.style.setProperty("--hud-viewport-height", `${viewport.height}px`);
    // fixture-css-hud (like the HUD-03/04 baseline, Inventory §1.27/§1.34)
    // is one fluid, CSS-driven composition -- Contract §6.4 explicitly
    // allows `resize` to be a no-op beyond storing the viewport for such
    // Themes; no JS re-fit is needed.
  }

  async setVariant(variant: Variant): Promise<void> {
    if (this.#destroyed || !this.#mounted || !this.#manifest || !this.#themeRoot || !this.#mountContext) {
      throw new Error("CssRenderer.setVariant() called outside the mounted lifecycle window");
    }
    if (variant === this.#variant) {
      return; // Contract §6.5: already-active variant resolves without work.
    }

    const manifest = this.#manifest;
    const orientation = this.#orientation!;
    const key = compositionKey(variant, orientation);
    const composition = manifest.compositions[key];
    if (!manifest.variants.includes(variant) || composition?.supported !== true) {
      throw new VariantUnsupportedError(manifest.id, manifest.version, variant, orientation);
    }
    const entrypoint = manifest.entrypoints[key];
    if (!entrypoint) {
      throw new EntrypointMissingError(manifest.id, manifest.version, `entrypoints["${key}"]`, variant, orientation);
    }

    const context: MountContext = { ...this.#mountContext, variant, orientation };

    try {
      this.#teardownComposition();
      const root = this.#themeRoot;
      await this.#loadStyles(root, entrypoint, context);
      await this.#loadMarkup(root, entrypoint, context);
      this.#indexSlots(root);
      await this.#loadScripts(root, entrypoint, context);
    } catch (err) {
      throw err instanceof HudError ? err : new ThemeMountFailedError(manifest.id, manifest.version, err);
    }

    this.#variant = variant;
    this.#mountContext = context;
    // Triggers the `data-hud-variant` MutationObserver (mediaEmbed src-swap,
    // if the capability is declared) -- see class docstring.
    this.#reflectVariantAttribute();
    // Contract §6.5: "MUST preserve slot data across the switch" is the
    // Runtime's job (`Hud.ts` re-applies the last `setData` once this
    // resolves) -- CssRenderer does not replay data itself.
  }

  /** Contract §6.6: synchronous, idempotent, MUST NOT throw, even if `mount` never completed or failed. */
  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    try {
      this.#teardownDom();
    } catch {
      // Defensive only -- every step above is itself written to be
      // exception-free, but Contract §6.6 is unconditional.
    } finally {
      this.#mounted = false;
      this.#manifest = undefined;
      this.#mountContext = undefined;
      this.#container = undefined;
      this.#themeRoot = undefined;
    }
  }

  // ---------------------------------------------------------------------
  // Isolation
  // ---------------------------------------------------------------------

  #createThemeRoot(container: HTMLElement, manifest: Manifest): HTMLElement | ShadowRoot {
    const isolation = manifest.isolation;
    if (isolation === "shadow-dom" || isolation === "shadow-dom-preferred") {
      try {
        if (typeof container.attachShadow !== "function") {
          throw new Error("attachShadow is not available in this environment");
        }
        const shadow = container.attachShadow({ mode: "open" });
        this.#isolationOutcome = "shadow-dom";
        return shadow;
      } catch (err) {
        if (isolation === "shadow-dom") {
          // Contract §15.1 table: "shadow-dom: Shadow DOM required (renderer
          // MUST fail rather than fall back)."
          throw new Error(
            `isolation "shadow-dom" is required but attachShadow failed: ${err instanceof Error ? err.message : String(err)}`
          );
        }
        console.warn(
          `CssRenderer: Shadow DOM unavailable, falling back to scoped-root for isolation "shadow-dom-preferred" (${
            err instanceof Error ? err.message : String(err)
          }) -- recording knownDeviations "shadow-dom-fallback" is the Theme package's job at publication time (Contract §15.3), not this renderer's`
        );
        // falls through to the scoped-root branch below
      }
    } else if (isolation !== "scoped-root") {
      // "iframe" is reserved for exceptional cases and not used by any 1.0
      // baseline Theme (Contract §15.1); out of this Story's scope
      // (assignment's "Out of scope" list). Fail loudly rather than
      // silently mis-isolating.
      throw new Error(`CssRenderer does not implement isolation "${isolation}" (Platform 0.1 scope)`);
    }

    this.#isolationOutcome = "scoped-root";
    const wrapper = document.createElement("div");
    wrapper.className = `hud-css-scoped-root ${manifest.id}`;
    container.appendChild(wrapper);
    return wrapper;
  }

  // ---------------------------------------------------------------------
  // Resource loading
  // ---------------------------------------------------------------------

  async #loadStyles(root: HTMLElement | ShadowRoot, entrypoint: EntrypointEntry, context: MountContext): Promise<void> {
    for (const relPath of entrypoint.styles) {
      const url = new URL(relPath, context.assetBaseUrl).href;
      let text: string;
      try {
        text = await this.#fetchText(url);
      } catch (err) {
        throw new AssetLoadFailedError(context.theme, context.version, relPath);
      }
      const styleEl = document.createElement("style");
      styleEl.setAttribute("data-hud-style-src", relPath);
      styleEl.textContent = text;
      root.appendChild(styleEl);
      this.#styleEls.push(styleEl);
    }
  }

  async #loadMarkup(root: HTMLElement | ShadowRoot, entrypoint: EntrypointEntry, context: MountContext): Promise<void> {
    const url = new URL(entrypoint.markup, context.assetBaseUrl).href;
    let text: string;
    try {
      text = await this.#fetchText(url);
    } catch (err) {
      throw new AssetLoadFailedError(context.theme, context.version, entrypoint.markup);
    }
    const wrapper = document.createElement("div");
    wrapper.innerHTML = text; // does not execute any embedded <script> (browser-standard); scripts load separately, see #loadScripts.
    while (wrapper.firstChild) {
      root.appendChild(wrapper.firstChild);
    }
  }

  async #loadScripts(root: HTMLElement | ShadowRoot, entrypoint: EntrypointEntry, context: MountContext): Promise<void> {
    for (const relPath of entrypoint.scripts) {
      const url = new URL(relPath, context.assetBaseUrl).href;
      let text: string;
      try {
        text = await this.#fetchText(url);
      } catch (err) {
        throw new AssetLoadFailedError(context.theme, context.version, relPath);
      }
      // Contract §16.1: only ever the Theme's own package (`assetBaseUrl`),
      // never an arbitrary third-party script URL. Appended as an element
      // (not via innerHTML) so it actually executes, Contract §6.2: "mount
      // MUST resolve only when ... scripts have run their initialisation."
      const scriptEl = document.createElement("script");
      scriptEl.setAttribute("data-hud-script-src", relPath);
      scriptEl.textContent = text;
      root.appendChild(scriptEl);
      this.#scriptEls.push(scriptEl);
    }
  }

  #indexSlots(root: HTMLElement | ShadowRoot): void {
    this.#slotEls.clear();
    root.querySelectorAll<HTMLElement>("[data-slot]").forEach((el) => {
      const name = el.getAttribute("data-slot");
      if (name) this.#slotEls.set(name, el);
    });
  }

  // ---------------------------------------------------------------------
  // Semantic data (Contract §9, §27.9)
  // ---------------------------------------------------------------------

  #applySlot(name: string, value: unknown): void {
    if (name === "media") {
      this.#applyMediaSlot(value);
      return;
    }
    const el = this.#slotEls.get(name);
    if (!el) return; // Contract §6.3: unknown slot keys (or slots this composition's markup doesn't render) MUST be ignored, not throw.
    if (name === "content") {
      if (!this.#contentSlotAllowed) return; // Contract §9.3: gated by capabilities.htmlSlot.
      el.innerHTML = typeof value === "string" ? stripScriptTags(value) : "";
      return;
    }
    el.textContent = value === null || value === undefined ? "" : String(value);
  }

  #applyMediaSlot(value: unknown): void {
    const el = this.#slotEls.get("media");
    if (!el) return;
    if (typeof value !== "string" || value.length === 0) return; // Contract §6.3: absent/empty value is a no-op, not a reset -- unchanged from pre-Story-#43 behaviour on both paths below.

    const mediaEmbed = this.#manifest?.capabilities?.mediaEmbed;
    const embedUrl = resolveMediaEmbedUrl(value, mediaEmbed);
    if (embedUrl !== undefined) {
      if (this.#variant === "micro") {
        // Story #45: never mount a live iframe at `micro` -- see class
        // docstring. Tear down any stale live embed on this target first
        // (defense in depth; a real variant switch already discards the
        // whole composition via `#teardownComposition()`), then show the
        // `mediaPoster` value (if any) as a static poster + decorative
        // play-icon instead.
        if (this.#mediaEmbed) {
          unmountMediaEmbed(this.#mediaEmbed);
          this.#mediaEmbed = undefined;
        }
        this.#microPoster = applyMicroEmbedPoster(el, this.#currentMediaPoster, this.#microPoster);
        return;
      }
      this.#mediaEmbed = mountMediaEmbed(el, embedUrl, this.#mediaEmbed);
      this.#applyMediaEmbedLifecycle();
      return;
    }

    // Not an embed target for this value -- see `mediaEmbed.ts`'s per-value
    // routing docstring (Story #43). Tear down any embed (or Story #45
    // micro poster/overlay) mounted for a PREVIOUS value first, so switching
    // back to a plain photo URL doesn't leave anything stale behind.
    if (this.#mediaEmbed) {
      unmountMediaEmbed(this.#mediaEmbed);
      this.#mediaEmbed = undefined;
    }
    if (this.#microPoster) {
      removeMicroEmbedPoster(this.#microPoster);
      this.#microPoster = undefined;
    }
    // Plain `media` slot (HUD-03-style float image): a URL string sets an
    // <img> src if the markup put one there, else it's recorded as a data
    // attribute for the Theme's own CSS (e.g. background-image) to key off.
    if (el instanceof HTMLImageElement) {
      el.src = value;
    } else {
      el.setAttribute("data-media-src", value);
    }
  }

  /** Contract §10.5 `lifecycle: "src-swap"`: parked at `about:blank` except at `maxi`, mirroring the HUD-04 baseline's collapse/expand pause behaviour (Inventory §1.32-§1.33). */
  #applyMediaEmbedLifecycle(): void {
    if (!this.#mediaEmbed) return;
    applyMediaEmbedLifecycle(this.#mediaEmbed, this.#variant);
  }

  #reflectVariantAttribute(): void {
    if (this.#container && this.#variant) {
      this.#container.setAttribute("data-hud-variant", this.#variant);
    }
  }

  // ---------------------------------------------------------------------
  // Teardown
  // ---------------------------------------------------------------------

  /** Removes everything the current composition added, but keeps the isolation root (shadow root / scoped-root wrapper) itself -- used by `setVariant()`, which switches composition without re-doing isolation. */
  #teardownComposition(): void {
    this.#variantObserver?.disconnect();
    this.#variantObserver = undefined;
    if (this.#mediaEmbed) {
      unmountMediaEmbed(this.#mediaEmbed); // Contract §10.5/§17.2 point 4: blank before removal.
      this.#mediaEmbed = undefined;
    }
    // Story #45: the poster/overlay elements are about to be discarded
    // wholesale along with the rest of this composition's DOM below -- just
    // forget the bookkeeping (no external side effect like an iframe's `src`
    // to blank first).
    this.#microPoster = undefined;
    for (const el of this.#scriptEls) el.remove();
    this.#scriptEls = [];
    for (const el of this.#styleEls) el.remove();
    this.#styleEls = [];
    const root = this.#themeRoot;
    if (root) {
      while (root.firstChild) root.removeChild(root.firstChild);
    }
    this.#slotEls.clear();
  }

  /** Contract §17.2's full ordered teardown, used by both a failed `mount()` (leaves `container` empty) and `destroy()`. */
  #teardownDom(): void {
    this.#teardownComposition();
    if (this.#themeRoot instanceof ShadowRoot) {
      // A ShadowRoot cannot be detached from its host by any DOM API; it is
      // left attached but empty (no nodes, no listeners -- `#teardownComposition`
      // above already cleared it), which is "inert" per Contract §6.6's
      // cooperative-insertions note.
    }
    if (this.#container) {
      this.#container.innerHTML = ""; // removes the scoped-root wrapper div (light-DOM case); a no-op on light-DOM children in the shadow-dom case (shadow content isn't part of innerHTML).
      this.#container.removeAttribute("data-hud-variant");
    }
  }
}
