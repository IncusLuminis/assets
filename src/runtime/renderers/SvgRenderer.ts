/**
 * The real `engine: "svg"` renderer (Story #9). Implements the Contract §6
 * `RendererLifecycle` for the HUD-01/HUD-02 family (Arch §18, Contract §5.3).
 *
 * Not registered anywhere by default -- per #8's documented extension point
 * (`src/runtime/core/RendererRegistry.ts`), a consumer/bootstrap registers it
 * explicitly:
 *
 *   const registry = createDefaultRendererRegistry();
 *   registry.register("svg", () => new SvgRenderer());
 *   configureHudRuntime({ themeSource, rendererRegistry: registry });
 *
 * `Hud.ts` / `ThemeResolver.ts` need no change (per this Story's scope --
 * they already treat "svg" as just another `engine` id, Contract §12 step 7).
 *
 * Design summary (see docs/architecture/HUD_Theme_Contract_1.0.md §6, §9,
 * §10, §15, §16, §17, §20 -- cited inline below at each decision point):
 *
 * - `mount()` fetches the composition's `markup`/`styles`/`scripts`
 *   (package-relative, resolved against `context.assetBaseUrl`) itself --
 *   Contract §12 steps 11-12 place resource loading on the renderer, not
 *   `ThemeResolver` (see that file's docstring). Fetching goes through an
 *   injectable `loadText` (defaults to `fetch(...).then(r => r.text())`) so
 *   tests can supply a filesystem-backed loader without leaking a Node
 *   dependency into the browser-bundled default path.
 * - `setData()` maps Contract §9.2 standard (+ declared custom, §9.4) slot
 *   names to `[data-slot="<name>"]` elements inside the Theme's own mounted
 *   markup. That attribute -- and any `nc-ol-*`-style internal id/class the
 *   Theme's SVG/HTML happens to use -- is entirely internal to the Theme
 *   package; the consumer only ever calls `hud.setData({ title: "..." })`
 *   (Contract §9.1, Arch §18).
 * - A lazy external-resource hook (`requestExternalResource`) is exposed to
 *   Theme-internal scripts (never to the consumer) so a Theme-owned control
 *   can request `capabilities.skyViewer` / `capabilities.dataSource`
 *   providers on demand rather than at mount (Contract §10.4, §16.2-§16.3).
 *   The actual DOM-injection strategy is itself injectable
 *   (`ExternalResourceLoader`) so tests can prove the hook fires without any
 *   real network call -- a real Aladin/SIMBAD wiring is #11/#12's job.
 * - `destroy()` never throws (Contract §6.6) and tears down, in order
 *   (§17.2): the Theme script handle's `destroy()`, the mounted composition
 *   DOM, and this instance's own bookkeeping. Cooperative `document.head`
 *   insertions from `requestExternalResource` are intentionally left in
 *   place (§6.6: "MAY remain in `document.head` after `destroy()`") since
 *   they are shared, page-scoped, and de-duplicated across instances.
 *
 * ## `capabilities.mediaEmbed` (Story #43)
 *
 * Ported from `CssRenderer.ts` into the shared `./mediaEmbed.js` module (see
 * that file's docstring for the per-value routing rule) so HUD-01/HUD-02
 * can accept a YouTube/HeyGen embed URL through their existing `media` slot
 * without losing that slot's original, still-supported plain-photo-`<img>`
 * behaviour. `setData()` below checks each `media`-slot target against
 * `resolveMediaEmbedUrl` BEFORE falling into the generic `applySlotValue`
 * path; only a value that resolves to an allowlisted embed host is
 * diverted, everything else (including every non-allowlisted absolute URL,
 * e.g. a photo CDN link) reaches `applySlotValue` exactly as before. A
 * `MutationObserver` on the mount container's `data-hud-variant` attribute
 * (set here on `mount()`/`setVariant()`, mirroring `CssRenderer`'s own
 * convention) implements the `"src-swap"` lifecycle (parked at
 * `about:blank` off-`maxi`) and is disconnected in `destroy()`.
 */
import type { MountContext, RendererLifecycle, Viewport } from "./RendererInterface.js";
import type {
  Capabilities,
  DataSourceProvider,
  EntrypointEntry,
  Manifest
} from "../contract/manifest.js";
import type { CompositionKey, Orientation, Variant } from "../contract/variants.js";
import { compositionKey } from "../contract/variants.js";
import { STANDARD_SLOTS } from "../contract/slots.js";
import {
  AssetLoadFailedError,
  EntrypointMissingError,
  HudError,
  ThemeMountFailedError,
  VariantUnsupportedError
} from "../contract/errors.js";
import {
  applyMediaEmbedLifecycle,
  mountMediaEmbed,
  resolveMediaEmbedUrl,
  unmountMediaEmbed,
  watchVariantForMediaEmbed,
  type MediaEmbedState
} from "./mediaEmbed.js";

/** Fetches the text content of a package-relative resource, already resolved to an absolute URL against `context.assetBaseUrl`. */
export type ResourceTextLoader = (url: string) => Promise<string>;

/**
 * The handle a Theme's entry script MAY return (Contract §17.1). All
 * members are optional: a script that only needs `setData`-driven
 * `[data-slot]` markup (the common case for this renderer) can return
 * nothing at all, or just `{ destroy }` if it added its own listeners.
 */
export interface ThemeScriptHandle {
  setData?(data: Record<string, unknown>): void;
  resize?(viewport: Viewport): void;
  setVariant?(variant: Variant): void;
  destroy?(): void;
}

/** The API surface handed to a Theme's entry script -- Theme-internal, never exposed to the Hud consumer. */
export interface ThemeScriptApi {
  /** See `SvgRenderer.requestExternalResource` -- the lazy dataSource/skyViewer extension point (Contract §10.4, §16.2-§16.3). */
  loadExternalResource(name: string): Promise<void>;
}

export type LazyResourceKind = "script" | "style" | "fetch";

/** A validated request to lazily load one capability-declared external resource (Contract §10, §16.2). */
export interface LazyResourceRequest {
  /** `"skyViewer"` or a `capabilities.dataSource.providers[]` value (`"simbad" | "vizier" | "ads"`). */
  name: string;
  host: string;
  kind: LazyResourceKind;
}

/**
 * The injection strategy `requestExternalResource` delegates to. Kept
 * pluggable so tests can prove the lazy-load *hook* fires -- with the
 * correct, capability-validated `host`/`kind` -- without ever touching the
 * network (per this Story's brief: "do not make actual network calls in
 * tests"). `DomExternalResourceLoader` (this file's default) is a
 * documented placeholder for the real Aladin/SIMBAD wiring #11/#12 will do;
 * it performs a cooperative, page-deduplicated `document.head` insertion
 * (script/style) or a bare `fetch` (dataSource providers), matching the
 * shape Contract §16.2's allowlist describes, but does not speak any
 * provider's actual protocol.
 */
export interface ExternalResourceLoader {
  load(request: LazyResourceRequest): Promise<void>;
}

export interface SvgRendererOptions {
  /** Defaults to `fetch(url).then(r => r.text())`. Override in tests / non-`fetch` hosts. */
  loadText?: ResourceTextLoader;
  /** Defaults to `DomExternalResourceLoader`. Override in tests to prove the lazy-load hook without a real network call. */
  externalResourceLoader?: ExternalResourceLoader;
}

const DATA_SOURCE_HOSTS: Record<DataSourceProvider, string> = {
  simbad: "simbad.cds.unistra.fr",
  vizier: "vizier.cds.unistra.fr",
  ads: "ui.adsabs.harvard.edu"
};

const defaultLoadText: ResourceTextLoader = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} fetching ${url}`);
  }
  return res.text();
};

/**
 * Cooperative, page-scoped, de-duplicated `document.head` injection
 * (Contract §16.2, §10.4 "shares one loader across ... instances via a page
 * global"). This is intentionally the ONLY place this renderer touches DOM
 * outside its own mount container (Contract §6.2's documented exception).
 */
export class DomExternalResourceLoader implements ExternalResourceLoader {
  async load(request: LazyResourceRequest): Promise<void> {
    const registry = DomExternalResourceLoader.#registry();
    const key = `${request.kind}:${request.host}`;
    let pending = registry.get(key);
    if (!pending) {
      pending = DomExternalResourceLoader.#inject(request);
      registry.set(key, pending);
    }
    return pending;
  }

  static #registry(): Map<string, Promise<void>> {
    const w = window as typeof window & { __hudExternalResources__?: Map<string, Promise<void>> };
    if (!w.__hudExternalResources__) w.__hudExternalResources__ = new Map();
    return w.__hudExternalResources__;
  }

  static #inject(request: LazyResourceRequest): Promise<void> {
    if (request.kind === "fetch") {
      return fetch(`https://${request.host}/`).then(() => undefined);
    }
    return new Promise<void>((resolve, reject) => {
      const el = document.createElement(request.kind === "style" ? "link" : "script");
      el.setAttribute("data-hud-external-host", request.host);
      if (request.kind === "style") {
        (el as HTMLLinkElement).rel = "stylesheet";
        (el as HTMLLinkElement).href = `https://${request.host}/`;
      } else {
        (el as HTMLScriptElement).src = `https://${request.host}/`;
        (el as HTMLScriptElement).async = true;
      }
      el.addEventListener("load", () => resolve());
      el.addEventListener("error", () => reject(new Error(`failed to load https://${request.host}/`)));
      document.head.appendChild(el);
    });
  }
}

function resolveLazyResourceRequest(name: string, capabilities: Capabilities): LazyResourceRequest | undefined {
  if (name === "skyViewer") {
    return capabilities.skyViewer === true ? { name, host: "aladin.cds.unistra.fr", kind: "script" } : undefined;
  }
  const dataSource = capabilities.dataSource;
  if (!dataSource || !dataSource.providers.includes(name as DataSourceProvider)) return undefined;
  const host = DATA_SOURCE_HOSTS[name as DataSourceProvider];
  if (!host || !dataSource.hosts.includes(host)) return undefined;
  return { name, host, kind: "fetch" };
}

function resolveUrl(base: string, relative: string): string {
  return new URL(relative, base).toString();
}

function stripScriptTags(html: string): string {
  // Contract §9.3: a `content`-slot Theme "MUST NOT execute `<script>` inside
  // content (the Runtime SHOULD strip it)". `innerHTML` never executes
  // injected `<script>` elements anyway (browser behaviour), but the tag is
  // stripped here too so it doesn't linger as inert markup either.
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
}

function safeCall(fn: (() => void) | undefined): void {
  if (!fn) return;
  try {
    fn();
  } catch {
    // Contract §6.6/§17.3: teardown MUST NOT throw even if a Theme's own
    // handle misbehaves.
  }
}

function mergeHandles(a: ThemeScriptHandle | undefined, b: ThemeScriptHandle): ThemeScriptHandle {
  if (!a) return b;
  return {
    setData: (data) => {
      a.setData?.(data);
      b.setData?.(data);
    },
    resize: (vp) => {
      a.resize?.(vp);
      b.resize?.(vp);
    },
    setVariant: (v) => {
      a.setVariant?.(v);
      b.setVariant?.(v);
    },
    destroy: () => {
      safeCall(a.destroy);
      safeCall(b.destroy);
    }
  };
}

export class SvgRenderer implements RendererLifecycle {
  readonly #loadText: ResourceTextLoader;
  readonly #externalResourceLoader: ExternalResourceLoader;

  #mounted = false;
  #destroyed = false;
  #container: HTMLElement | undefined;
  #root: HTMLElement | undefined;
  #context: MountContext | undefined;
  #compositionKey: CompositionKey | undefined;
  #currentVariant: Variant | undefined;
  #currentOrientation: Orientation | undefined;
  #scriptHandle: ThemeScriptHandle | undefined;
  #lastData: Record<string, unknown> = {};
  #lastViewport: Viewport | undefined;
  #warnedSlots = new Set<string>();
  /** Keyed by the `[data-slot="media"]` target element, since `setData()`'s generic slot-mapping loop supports (in principle) more than one match per name -- mirrors `CssRenderer`'s single `#mediaEmbed` field, generalised to per-target. */
  #mediaEmbedByTarget = new Map<HTMLElement, MediaEmbedState>();
  #variantObserver: MutationObserver | undefined;

  constructor(options: SvgRendererOptions = {}) {
    this.#loadText = options.loadText ?? defaultLoadText;
    this.#externalResourceLoader = options.externalResourceLoader ?? new DomExternalResourceLoader();
  }

  async mount(container: HTMLElement, context: MountContext): Promise<void> {
    // Contract §6.2: "mount MUST be called exactly once ... A second call
    // MUST throw." Guarding on both flags also covers the (defensive-only,
    // since Hud never does this) case of mount() after destroy().
    if (this.#destroyed) {
      throw new Error("SvgRenderer.mount() cannot be called after destroy() (Contract §6.6)");
    }
    if (this.#mounted) {
      throw new Error("SvgRenderer.mount() may only be called once per instance (Contract §6.2)");
    }
    this.#mounted = true;

    this.#context = context;
    this.#container = container;
    this.#currentVariant = context.variant;
    this.#currentOrientation = context.orientation;

    const manifest = context.manifest as Manifest;
    const key = compositionKey(context.variant, context.orientation);
    const entrypoint = manifest.entrypoints[key];
    if (!entrypoint) {
      throw new EntrypointMissingError(
        context.theme,
        context.version,
        `entrypoints["${key}"]`,
        context.variant,
        context.orientation
      );
    }

    try {
      const root = await this.#mountComposition(key, entrypoint, context);
      // Contract §15.5 / §5.3 point 3: never impose overflow:hidden/clip on
      // the mount container or an ancestor this renderer owns -- so simply
      // never set one here, on `container` or on `root`, regardless of
      // `manifest.overflowVisible`. (A Theme that wants strict clipping is
      // responsible for its own composition CSS; that's a Theme authoring
      // choice, not a renderer-imposed one.)
      container.appendChild(root);
      this.#root = root;
      this.#compositionKey = key;

      if (manifest.capabilities?.mediaEmbed) {
        // Contract §10.5 src-swap lifecycle -- see class docstring "Story
        // #43" section. Only set up for Themes that actually declare the
        // capability, so this is a no-op for every other `engine: "svg"`
        // Theme (no `data-hud-variant` attribute appears on their container
        // either).
        container.setAttribute("data-hud-variant", context.variant);
        this.#variantObserver = watchVariantForMediaEmbed(container, () => this.#applyMediaEmbedLifecycleAll());
      }
    } catch (err) {
      if (err instanceof HudError) throw err;
      throw new ThemeMountFailedError(context.theme, context.version, err);
    }
  }

  setData(data: Record<string, unknown>): void {
    if (this.#destroyed) return; // Contract §20.3: never throw into the host; Hud already guards post-destroy calls, this is defense in depth.
    if (!this.#mounted || !this.#root) {
      throw new Error("SvgRenderer.setData() called before mount() resolved");
    }
    this.#lastData = { ...data };
    const mediaEmbedCapability = (this.#context?.manifest as Manifest | undefined)?.capabilities?.mediaEmbed;

    for (const [slotName, value] of Object.entries(data)) {
      const targets = this.#root.querySelectorAll<HTMLElement>(
        `[data-slot="${cssEscapeAttrValue(slotName)}"]`
      );
      if (targets.length === 0) {
        this.#warnUnknownSlot(slotName);
        continue; // Contract §6.3: unknown slot keys MUST be ignored, not throw.
      }
      for (const target of Array.from(targets)) {
        // Story #43: an allowlisted embed URL diverts to the iframe path;
        // everything else (including a plain photo URL) falls through to
        // the generic path below, unchanged -- see class docstring.
        if (slotName === "media" && this.#applyMediaSlotValue(target, value, mediaEmbedCapability)) {
          continue;
        }
        applySlotValue(target, slotName, value);
      }
    }

    safeCall(() => this.#scriptHandle?.setData?.(data));
  }

  resize(viewport: Viewport): void {
    if (this.#destroyed || !this.#mounted || !this.#root) return;
    this.#lastViewport = viewport;
    // Fluid compositions re-fit via CSS; this custom property is the only
    // renderer-driven signal, available to the Theme's own CSS/JS if it
    // wants to react (Contract §6.4 permits a no-op-beyond-storing re-fit
    // for intrinsically fluid compositions).
    this.#root.style.setProperty("--hud-viewport-width", `${viewport.width}px`);
    this.#root.style.setProperty("--hud-viewport-height", `${viewport.height}px`);
    safeCall(() => this.#scriptHandle?.resize?.(viewport));
  }

  async setVariant(variant: Variant): Promise<void> {
    if (!this.#mounted || !this.#context || !this.#root || !this.#currentOrientation) {
      throw new Error("SvgRenderer.setVariant() called before mount() resolved");
    }
    if (variant === this.#currentVariant) return; // Contract §6.5: idempotent no-op (Hud already short-circuits this too).

    const context = this.#context;
    const manifest = context.manifest as Manifest;
    // Contract §6.5: orientation never changes via setVariant. Hud has
    // already validated `variants.includes(variant)` and
    // `compositions[key].supported === true` at this fixed orientation
    // before calling us (see Hud.setVariant()) -- this lookup is
    // defense-in-depth, not the primary gate.
    const key = compositionKey(variant, this.#currentOrientation);
    const entrypoint = manifest.entrypoints[key];
    if (!entrypoint) {
      throw new VariantUnsupportedError(context.theme, context.version, variant, this.#currentOrientation);
    }

    let newRoot: HTMLElement;
    try {
      newRoot = await this.#mountComposition(key, entrypoint, {
        ...context,
        variant,
        orientation: this.#currentOrientation
      });
    } catch (err) {
      if (err instanceof HudError) throw err;
      throw new ThemeMountFailedError(context.theme, context.version, err);
    }

    // Tear down the outgoing composition only after the incoming one mounted
    // successfully -- never leave the instance with neither.
    safeCall(this.#scriptHandle?.destroy);
    // The outgoing composition's [data-slot="media"] target(s) are about to
    // be discarded wholesale along with `this.#root` -- blank/remove any
    // embed iframe mounted on them first (Contract §10.5/§17.2 point 4)
    // rather than leaving that to `this.#root.remove()` alone. Hud replays
    // the last `setData()` once this resolves (Contract §6.5, see below),
    // which re-mounts a fresh embed on the new composition's target if the
    // last `media` value was still an embed URL.
    this.#teardownMediaEmbeds();
    this.#root.remove();

    this.#container?.appendChild(newRoot);
    this.#root = newRoot;
    this.#compositionKey = key;
    this.#currentVariant = variant;
    if (this.#container && manifest.capabilities?.mediaEmbed) {
      // Reflects into the `MutationObserver` from `mount()` (still watching
      // this same container) so a later `data-hud-variant` change is
      // observed even without an intervening `setData()` -- mirrors
      // `CssRenderer`'s `#reflectVariantAttribute()`.
      this.#container.setAttribute("data-hud-variant", variant);
    }
    if (this.#lastViewport) this.resize(this.#lastViewport);
    // Contract §6.5 "MUST preserve slot data across the switch" is Hud's
    // job (it re-applies the last setData once this Promise resolves) --
    // see Hud.ts `setVariant()`.
  }

  /** Contract §6.6: synchronous, idempotent, MUST NOT throw. */
  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    try {
      safeCall(this.#scriptHandle?.destroy);
      this.#scriptHandle = undefined;
      // Contract §17.1/§17.2: disconnect the variant observer (a real
      // teardown target, mirroring -- and fixing -- HUD-04's own
      // un-disconnected `MutationObserver`) and blank every embed iframe
      // before it's removed.
      this.#variantObserver?.disconnect();
      this.#variantObserver = undefined;
      this.#teardownMediaEmbeds();
      if (this.#container) {
        this.#container.innerHTML = "";
        this.#container.removeAttribute("data-hud-variant");
      }
    } catch {
      // Contract §6.6: absolute guarantee -- never throw, even if the block
      // above somehow does (defensive; every call inside it is already
      // wrapped by `safeCall` or is a plain DOM mutation).
    } finally {
      this.#root = undefined;
      this.#container = undefined;
      this.#context = undefined;
      this.#compositionKey = undefined;
      this.#currentVariant = undefined;
      this.#currentOrientation = undefined;
      this.#lastData = {};
      this.#lastViewport = undefined;
      this.#warnedSlots.clear();
      this.#mediaEmbedByTarget.clear();
      this.#mounted = false;
    }
  }

  /**
   * The lazy dataSource/skyViewer extension point (Contract §10, §16.2-
   * §16.3, §10.4). Called only from within a mounted Theme's own script via
   * `hud.loadExternalResource(name)` (see `ThemeScriptApi`) -- NOT part of
   * `RendererLifecycle` and never reachable from the Hud consumer. Validates
   * `name` against this Theme's OWN declared `capabilities` before doing
   * anything (a Theme cannot request a resource it didn't declare), then
   * delegates the actual load to `this.#externalResourceLoader`.
   *
   * Left `public` (rather than only closed over inside `#runThemeScript`)
   * so it is directly unit-testable without needing a real script to
   * exercise it.
   */
  async requestExternalResource(name: string): Promise<void> {
    if (!this.#context) {
      throw new Error("SvgRenderer.requestExternalResource() called before mount() resolved");
    }
    const context = this.#context;
    const manifest = context.manifest as Manifest;
    const request = resolveLazyResourceRequest(name, manifest.capabilities);
    if (!request) {
      throw new Error(
        `SvgRenderer.requestExternalResource("${name}"): not declared in Theme "${context.theme}"'s capabilities (Contract §10.2/§16.2) -- add capabilities.skyViewer or list "${name}" in capabilities.dataSource.providers/hosts first`
      );
    }
    try {
      await this.#externalResourceLoader.load(request);
    } catch (err) {
      throw new AssetLoadFailedError(context.theme, context.version, `${request.kind}:${request.host}`);
    }
  }

  async #mountComposition(
    key: CompositionKey,
    entrypoint: EntrypointEntry,
    context: MountContext
  ): Promise<HTMLElement> {
    const markupUrl = resolveUrl(context.assetBaseUrl, entrypoint.markup);
    const markupText = await this.#loadResource(markupUrl, entrypoint.markup, context);

    const template = document.createElement("template");
    template.innerHTML = markupText.trim();
    const root = template.content.firstElementChild;
    if (!(root instanceof HTMLElement)) {
      throw new Error(
        `entrypoints["${key}"].markup ("${entrypoint.markup}") did not parse to a single root HTMLElement`
      );
    }

    // Contract §5.3 point 2: the markup document carries BOTH the inline
    // <svg> frame layer and the HTML/CSS content layer -- both arrive as
    // part of this one parsed fragment; nothing renderer-side needs to
    // special-case the <svg> subtree separately.
    for (const stylePath of entrypoint.styles) {
      const styleUrl = resolveUrl(context.assetBaseUrl, stylePath);
      const cssText = await this.#loadResource(styleUrl, stylePath, context);
      const styleEl = document.createElement("style");
      styleEl.setAttribute("data-hud-theme-style", stylePath);
      styleEl.textContent = cssText;
      root.insertBefore(styleEl, root.firstChild);
    }

    let handle: ThemeScriptHandle | undefined;
    for (const scriptPath of entrypoint.scripts) {
      const scriptUrl = resolveUrl(context.assetBaseUrl, scriptPath);
      const scriptText = await this.#loadResource(scriptUrl, scriptPath, context);
      const scriptHandle = this.#runThemeScript(scriptText, root, context);
      if (scriptHandle) handle = mergeHandles(handle, scriptHandle);
    }
    this.#scriptHandle = handle;

    return root;
  }

  async #loadResource(url: string, resourcePath: string, context: MountContext): Promise<string> {
    try {
      return await this.#loadText(url);
    } catch {
      throw new AssetLoadFailedError(context.theme, context.version, resourcePath);
    }
  }

  /**
   * Evaluates a Theme entry script's text (Contract §16.4, §17.1). Run via
   * `new Function` rather than a `<script>` tag: the baseline Themes are
   * already whole-document sources specifically BECAUSE Blogger strips
   * `<script>` from HTML gadgets (Contract §16.6) -- packaging (#11/#12)
   * reduces them to plain script text, and `new Function` gives this
   * renderer synchronous, directly-testable control over exactly what a
   * script receives (`root`, `context`, the `hud` lazy-resource API) without
   * relying on a live `<script>` element's load event or global scope.
   * The Theme script runs in the module's scope, not a sandbox in the
   * security sense -- Contract §16.1 already restricts script *origin* to
   * the trusted Registry; this is not an additional trust boundary.
   */
  #runThemeScript(scriptText: string, root: HTMLElement, context: MountContext): ThemeScriptHandle | undefined {
    const api: ThemeScriptApi = {
      loadExternalResource: (name: string) => this.requestExternalResource(name)
    };
    // eslint-disable-next-line no-new-func -- see docstring above.
    const factory = new Function("root", "context", "hud", `"use strict";\n${scriptText}`) as (
      root: HTMLElement,
      context: MountContext,
      hud: ThemeScriptApi
    ) => unknown;
    const result = factory(root, context, api);
    return result && typeof result === "object" ? (result as ThemeScriptHandle) : undefined;
  }

  /**
   * The `media` slot's mediaEmbed check (Story #43, `mediaEmbed.ts`'s
   * per-value routing). Returns `true` if `value` was handled here (an
   * iframe was mounted/updated on `target`) -- the caller must then skip
   * `applySlotValue` for this target. Returns `false` for every other value
   * (not a string, not an absolute URL, host not allowlisted, or no
   * `capabilities.mediaEmbed` declared at all) -- in which case the caller
   * MUST still run `applySlotValue`, and any embed previously mounted on
   * `target` (from an earlier `setData` call) is torn down here first so a
   * Theme reverting to a plain photo URL never leaves a stale iframe
   * covering it.
   */
  #applyMediaSlotValue(target: HTMLElement, value: unknown, mediaEmbed: Manifest["capabilities"]["mediaEmbed"]): boolean {
    const embedUrl = resolveMediaEmbedUrl(value, mediaEmbed);
    if (embedUrl !== undefined) {
      const state = mountMediaEmbed(target, embedUrl, this.#mediaEmbedByTarget.get(target));
      this.#mediaEmbedByTarget.set(target, state);
      applyMediaEmbedLifecycle(state, this.#currentVariant);
      return true;
    }
    const existing = this.#mediaEmbedByTarget.get(target);
    if (existing) {
      unmountMediaEmbed(existing);
      this.#mediaEmbedByTarget.delete(target);
    }
    return false;
  }

  #applyMediaEmbedLifecycleAll(): void {
    for (const state of this.#mediaEmbedByTarget.values()) {
      applyMediaEmbedLifecycle(state, this.#currentVariant);
    }
  }

  /** Blanks + removes every currently-mounted embed iframe (Contract §10.5/§17.2 point 4: blank before removal) and forgets their targets -- used by both `setVariant()` (the outgoing composition's targets are about to be discarded wholesale) and `destroy()`. */
  #teardownMediaEmbeds(): void {
    for (const state of this.#mediaEmbedByTarget.values()) {
      unmountMediaEmbed(state);
    }
    this.#mediaEmbedByTarget.clear();
  }

  #warnUnknownSlot(slotName: string): void {
    if (this.#warnedSlots.has(slotName)) return;
    this.#warnedSlots.add(slotName);
    const known = STANDARD_SLOTS.includes(slotName as (typeof STANDARD_SLOTS)[number]) ? "standard" : "custom/unknown";
    console.warn(
      `SvgRenderer("${this.#context?.theme}"): setData() key "${slotName}" (${known}) has no matching [data-slot="${slotName}"] element in the mounted composition -- ignored (Contract §6.3)`
    );
  }
}

function applySlotValue(target: HTMLElement, slotName: string, value: unknown): void {
  if (slotName === "content") {
    // Contract §9.3: htmlSlot Themes accept an HTML fragment; scripts inside it are stripped.
    target.innerHTML = typeof value === "string" ? stripScriptTags(value) : "";
    return;
  }
  if (target instanceof HTMLImageElement && typeof value === "string") {
    target.src = value;
    target.removeAttribute("data-hud-empty");
    return;
  }
  if (Array.isArray(value)) {
    // Contract §9.2: `primary`/`secondary` MAY be "structured rows".
    target.textContent = "";
    for (const item of value) {
      const row = document.createElement("div");
      row.className = "hud-slot-row";
      row.textContent = typeof item === "string" ? item : JSON.stringify(item);
      target.appendChild(row);
    }
    return;
  }
  target.textContent = value === null || value === undefined ? "" : String(value);
}

/** Minimal `CSS.escape`-alike for a `[data-slot="..."]` attribute selector value (avoids depending on the `CSS.escape` global for older/non-browser test hosts). */
function cssEscapeAttrValue(value: string): string {
  return value.replace(/["\\]/g, "\\$&");
}
