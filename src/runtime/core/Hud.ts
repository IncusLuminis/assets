/**
 * `Hud` -- the consumer-facing Runtime class (HUD Theme Contract 1.0 §14).
 * Carries no application/domain logic (Arch §23): every Theme-specific
 * behaviour lives in the renderer a `RendererRegistry` hands back for
 * `manifest.engine` (Contract §5, §12 step 7).
 */
import type { HudData } from "../contract/types.js";
import type { Manifest } from "../contract/manifest.js";
import { compositionKey, isOrientation, isVariant } from "../contract/variants.js";
import type { Orientation, Variant } from "../contract/variants.js";
import { HudError, ThemeMountFailedError, ThemeRuntimeError, VariantUnsupportedError } from "../contract/errors.js";
import { RendererUnsupportedError } from "../renderers/RendererUnsupportedError.js";
import type { MountContext, RendererLifecycle, Viewport } from "../renderers/RendererInterface.js";
import { ThemeResolver } from "./ThemeResolver.js";
import { createDefaultRendererRegistry, RendererRegistry } from "./RendererRegistry.js";
import type { ThemeSource } from "./ThemeSource.js";

/** HUD Theme Contract 1.0 §14.1's options object -- field names and requiredness match verbatim. Note `orientation`, NOT `ratio` (removed, Contract §3.3). */
export interface HudOptions {
  /** REQUIRED -- Theme id. */
  theme: string;
  /** SHOULD be an explicit SemVer in production; MAY be `"latest"` in dev (Contract §4.4, §14.1). */
  version: string;
  /** REQUIRED -- `"maxi" | "mini" | "micro"` (Contract §7). */
  variant: Variant;
  /** REQUIRED -- `"landscape" | "portrait"` (Contract §8). */
  orientation: Orientation;
  /** OPTIONAL -- Theme capability configuration (`mode`, `objectName`, ...) (Contract §14.1, §11.1). */
  config?: Record<string, unknown>;
}

/**
 * Constructor dependencies -- NOT part of the Contract §14.1 options object.
 * A Theme's data source and the renderer-dispatch table are Runtime wiring
 * concerns the Contract deliberately leaves unspecified (a Registry/CDN
 * client is #1/#16's job, per this Story's brief). DOCUMENTED
 * INTERPRETATION: rather than build that wiring into the options object (or
 * silently reach for `fetch()` against a hardcoded URL, which would bake a
 * default in ahead of #1/#16's design), `Hud` takes these as an optional
 * second constructor argument alongside process-wide defaults
 * (`configureHudRuntime`) -- so every production call site still reads
 * exactly `new Hud({theme, version, variant, orientation, config})` once a
 * default `ThemeSource` is configured once per page, while this repo's own
 * tests can inject a local filesystem `ThemeSource` (`tests/helpers/
 * file-system-theme-source.js`) to mount `library/themes/fixture-hud/`
 * without a Registry. Flagged for a human/owner call if a different seam is
 * preferred once #1/#16 exist.
 */
export interface HudDependencies {
  themeSource: ThemeSource;
  rendererRegistry: RendererRegistry;
}

type HudState = "constructed" | "mounting" | "mounted" | "destroyed";

const defaultDependencies: { themeSource?: ThemeSource; rendererRegistry: RendererRegistry } = {
  themeSource: undefined,
  rendererRegistry: createDefaultRendererRegistry()
};

/**
 * Sets the process-wide default `ThemeSource`/`RendererRegistry` so plain
 * `new Hud({theme, version, variant, orientation})` calls work once a
 * Registry-backed `ThemeSource` exists (#1/#16) and/or once #9/#10 register
 * their renderers. Passing `deps` directly to `new Hud(options, deps)`
 * always overrides this for that instance.
 */
export function configureHudRuntime(deps: Partial<HudDependencies>): void {
  if (deps.themeSource) defaultDependencies.themeSource = deps.themeSource;
  if (deps.rendererRegistry) defaultDependencies.rendererRegistry = deps.rendererRegistry;
}

let instanceCounter = 0;

export class Hud {
  readonly #options: HudOptions;
  readonly #themeSource: ThemeSource | undefined;
  readonly #rendererRegistry: RendererRegistry;
  readonly #instanceId = `hud-${++instanceCounter}`;

  #state: HudState = "constructed";
  #renderer: RendererLifecycle | undefined;
  #root: HTMLElement | undefined;
  #currentVariant: Variant;
  #currentOrientation: Orientation;
  #manifest: Manifest | undefined;
  #pendingSetData: HudData[] = [];
  #lastData: HudData | undefined;
  #variantSwitch: Promise<void> | null = null;
  #onErrorCallback: ((error: HudError | RendererUnsupportedError) => void) | undefined;

  constructor(options: HudOptions, deps: Partial<HudDependencies> = {}) {
    // Contract §14.2: "validates options synchronously; an invalid
    // theme/variant/orientation shape throws a TypeError (programmer error,
    // not a Theme error)."
    if (typeof options !== "object" || options === null) {
      throw new TypeError("new Hud(options): options must be an object");
    }
    if (typeof options.theme !== "string" || options.theme.length === 0) {
      throw new TypeError("new Hud(options): options.theme must be a non-empty string");
    }
    if (typeof options.version !== "string" || options.version.length === 0) {
      throw new TypeError("new Hud(options): options.version must be a non-empty string");
    }
    if (!isVariant(options.variant)) {
      throw new TypeError('new Hud(options): options.variant must be "maxi" | "mini" | "micro"');
    }
    if (!isOrientation(options.orientation)) {
      throw new TypeError(
        'new Hud(options): options.orientation must be "landscape" | "portrait" (Contract §3.3 removed "ratio")'
      );
    }
    if (
      options.config !== undefined &&
      (typeof options.config !== "object" || options.config === null || Array.isArray(options.config))
    ) {
      throw new TypeError("new Hud(options): options.config must be an object when present");
    }

    this.#options = { ...options };
    this.#currentVariant = options.variant;
    this.#currentOrientation = options.orientation;
    this.#themeSource = deps.themeSource ?? defaultDependencies.themeSource;
    this.#rendererRegistry = deps.rendererRegistry ?? defaultDependencies.rendererRegistry;
    // Contract §14.2: "Construction does no network I/O; resolution starts at mount."
  }

  /**
   * Subscribes to Theme/renderer failures that occur after `mount()` has
   * already resolved (Contract §20.2: "delivered to a Runtime error sink/
   * callback the consumer can subscribe to"; §20.3: "MUST NOT rethrow into
   * host code paths"). DOCUMENTED INTERPRETATION: `mount()` itself still
   * communicates its own failure by rejecting its Promise (§6.2, §14.3
   * table) -- that channel is explicit in the Contract. This callback
   * covers `setData`/`resize`, which are synchronous `void`-returning
   * methods (§6.3, §6.4) with no other way to report a failure without
   * throwing into the host's call stack, which §20.3 forbids. This is the
   * most conservative reading of §20.2/§20.3 consistent with the rest of
   * the imperative API staying synchronous; a human/owner call is welcome
   * if a different sink shape (e.g. an `error` DOM event on the mount
   * element) is preferred.
   */
  onError(callback: (error: HudError | RendererUnsupportedError) => void): void {
    this.#onErrorCallback = callback;
  }

  async mount(el: HTMLElement): Promise<void> {
    if (this.#state !== "constructed") {
      throw new Error("Hud.mount() may only be called once per instance (Contract §6.2, §14.3)");
    }
    if (!this.#themeSource) {
      throw new Error(
        'Hud.mount(): no ThemeSource configured -- call configureHudRuntime({ themeSource }) once, or pass "new Hud(options, { themeSource })"'
      );
    }
    this.#state = "mounting";

    // Contract §15.1: scoped-root isolation baseline -- one dedicated mount
    // container per instance, namespaced so build-time Theme CSS scoping
    // (Theme-package concern, §15.1) has a stable root to scope under.
    const root = document.createElement("div");
    root.setAttribute("data-hud-instance", this.#instanceId);
    root.setAttribute("data-hud-theme", this.#options.theme);
    root.className = `hud-scoped-root ${this.#instanceId}`;
    // Contract §15.7: establish a stacking context so Theme z-index cannot
    // collide with host stacking.
    root.style.isolation = "isolate";
    el.appendChild(root);
    this.#root = root;

    const resolver = new ThemeResolver(this.#themeSource, this.#rendererRegistry);

    try {
      const resolved = await resolver.resolve({
        theme: this.#options.theme,
        version: this.#options.version,
        variant: this.#currentVariant,
        orientation: this.#currentOrientation
      });

      this.#manifest = resolved.manifest;
      this.#renderer = resolved.renderer;
      this.#currentVariant = resolved.variant;
      this.#currentOrientation = resolved.orientation;

      const context: MountContext = {
        theme: this.#options.theme,
        version: resolved.version,
        variant: resolved.variant,
        orientation: resolved.orientation,
        manifest: resolved.manifest,
        baseVersion: resolved.manifest.baseVersion,
        assetBaseUrl: resolved.assetBaseUrl
      };

      await this.#renderer.mount(root, context);

      this.#state = "mounted";

      // Contract §6.3: replay queued setData calls in issue order.
      const queued = this.#pendingSetData;
      this.#pendingSetData = [];
      for (const data of queued) {
        this.#lastData = data;
        this.#renderer.setData(data);
      }
    } catch (err) {
      // Contract §6.2: on any mount failure, leave `container` empty (no
      // partial DOM) and reject with a typed error.
      root.remove();
      this.#root = undefined;
      this.#renderer = undefined;
      this.#state = "destroyed";
      throw normalizeError(err, this.#options.theme, this.#options.version, ThemeMountFailedError);
    }
  }

  /** Contract §6.3 / §14.3: synchronous; queued and replayed if called before `mount()` resolves. */
  setData(data: HudData): void {
    if (this.#state === "destroyed") {
      // Contract §6.6: "after destroy(), any further setData ... MUST throw
      // (or be ignored with a logged warning)". Ignoring is the more
      // host-friendly, non-throwing choice, consistent with §20.3.
      console.warn(`Hud("${this.#options.theme}"): setData() called after destroy(); ignored`);
      return;
    }
    if (this.#state !== "mounted") {
      this.#pendingSetData.push(data);
      return;
    }
    this.#lastData = data;
    const apply = (): void => {
      try {
        this.#renderer?.setData(data);
      } catch (err) {
        this.#deliver(err);
      }
    };
    if (this.#variantSwitch) {
      // Contract §6.7.4: "a setData issued during a pending setVariant is
      // applied after it resolves."
      this.#variantSwitch.then(apply, apply);
    } else {
      apply();
    }
  }

  /** Contract §6.4 / §14.3: synchronous; measures the container if `viewport` is omitted. */
  resize(viewport?: Viewport): void {
    if (this.#state !== "mounted" || !this.#root) return;
    const vp = viewport ?? { width: this.#root.clientWidth, height: this.#root.clientHeight };
    try {
      this.#renderer?.resize(vp);
    } catch (err) {
      this.#deliver(err);
    }
  }

  /** Contract §6.5 / §14.3: rejects `VariantUnsupportedError` for an unknown/unsupported variant. */
  async setVariant(variant: Variant): Promise<void> {
    if (this.#state !== "mounted" || !this.#manifest) {
      throw new Error("Hud.setVariant() may only be called after mount() has resolved");
    }
    if (!isVariant(variant)) {
      throw new VariantUnsupportedError(
        this.#options.theme,
        this.#options.version,
        String(variant),
        this.#currentOrientation
      );
    }
    if (variant === this.#currentVariant) {
      // Contract §6.5: "If the target variant is already active, setVariant
      // MUST resolve without work (idempotent)."
      return;
    }

    const manifest = this.#manifest;
    const key = compositionKey(variant, this.#currentOrientation);
    const composition = manifest.compositions[key];
    if (!manifest.variants.includes(variant) || composition?.supported !== true) {
      // Contract §6.5: setVariant always rejects VariantUnsupported here --
      // orientation is fixed for the life of the instance (§14.4), so the
      // Ratio/Variant disambiguation in §20.1's note (which applies to
      // initial mount-time resolution) does not apply.
      throw new VariantUnsupportedError(this.#options.theme, this.#options.version, variant, this.#currentOrientation);
    }

    // Contract §6.7.4: "setVariant serialises: the Runtime MUST NOT overlap
    // two setVariant calls."
    const previous = this.#variantSwitch ?? Promise.resolve();
    const switchPromise: Promise<void> = previous.catch(() => {}).then(async () => {
      await this.#renderer?.setVariant(variant);
      this.#currentVariant = variant;
      if (this.#lastData !== undefined) {
        // Contract §6.5: "MUST preserve slot data across the switch (the
        // Runtime re-applies the last setData)."
        this.#renderer?.setData(this.#lastData);
      }
    });

    this.#variantSwitch = switchPromise.finally(() => {
      if (this.#variantSwitch === switchPromise) this.#variantSwitch = null;
    });

    try {
      await switchPromise;
    } catch (err) {
      throw normalizeError(err, this.#options.theme, this.#options.version, ThemeMountFailedError);
    }
  }

  /** Contract §6.6 / §14.3: synchronous, idempotent, MUST NOT throw. */
  destroy(): void {
    if (this.#state === "destroyed") return;
    this.#state = "destroyed";
    try {
      this.#renderer?.destroy();
    } catch {
      // Defensive only: renderer.destroy() must already never throw
      // (Contract §6.6) -- this guards Hud's own teardown regardless of a
      // misbehaving renderer, since Hud.destroy() itself MUST NOT throw.
    }
    // Runtime's own bookkeeping (Contract §15.1 scoped-root): remove the
    // dedicated mount container this instance created. Hud creates no
    // listeners/timers/animation loops of its own in 0.1 (the consumer
    // drives resize() explicitly per Contract §14.1's example), so there is
    // nothing else for the Runtime layer itself to tear down here --
    // renderer-specific cleanup is the renderer's own job (§6.6/§17).
    this.#root?.remove();
    this.#root = undefined;
    this.#renderer = undefined;
    this.#manifest = undefined;
    this.#pendingSetData = [];
    this.#lastData = undefined;
    this.#variantSwitch = null;
  }

  #deliver(err: unknown): void {
    const hudError = normalizeError(err, this.#options.theme, this.#options.version, ThemeRuntimeError);
    if (this.#onErrorCallback) {
      this.#onErrorCallback(hudError);
    } else {
      // Contract §20.3: "MUST NOT rethrow into host code paths" -- even with
      // no subscriber, this stays a log line, never a throw.
      console.error(`Hud("${this.#options.theme}") runtime error with no onError() subscriber:`, hudError);
    }
  }
}

function normalizeError(
  err: unknown,
  theme: string,
  version: string,
  Fallback: new (theme: string, version: string, cause?: unknown) => HudError
): HudError | RendererUnsupportedError {
  if (err instanceof HudError || err instanceof RendererUnsupportedError) return err;
  return new Fallback(theme, version, err);
}
