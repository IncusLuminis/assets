/**
 * The internal Runtime <-> renderer lifecycle boundary.
 *
 * Normative source: HUD Theme Contract 1.0 §6 (docs/architecture/HUD_Theme_Contract_1.0.md).
 * This is a TS mirror of that lifecycle, not a reinterpretation of it -- see
 * the Contract for the authoritative ordering guarantees (§6.7), the
 * idempotency/throw-free requirements on `destroy()` (§6.6), and the queueing
 * responsibility the Contract places on the Runtime (not the renderer) for
 * `setData` calls issued before `mount` resolves (§6.3).
 *
 * This interface itself carries no logic. The real Runtime that drives it
 * (ThemeLoader/Lifecycle in `src/runtime/core/`) is Story #8's job -- out of
 * scope here. Only the shape exists so the renderer stubs in this directory
 * (and the real `SvgRenderer`/`CssRenderer` landing in #9/#10) can compile
 * against a single, shared contract.
 */

export interface MountContext {
  theme: string;
  version: string;
  variant: "maxi" | "mini" | "micro";
  orientation: "landscape" | "portrait";
  manifest: unknown;
  baseVersion: string;
  assetBaseUrl: string;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface RendererLifecycle {
  /** Contract §6.2. MUST be called exactly once; a second call MUST throw. */
  mount(container: HTMLElement, context: MountContext): Promise<void>;

  /** Contract §6.3. Synchronous; idempotent for equal input. */
  setData(data: Record<string, unknown>): void;

  /** Contract §6.4. Synchronous; MUST NOT switch composition/variant/orientation. */
  resize(viewport: Viewport): void;

  /** Contract §6.5. Asynchronous; rejects with VariantUnsupported when applicable. */
  setVariant(variant: "maxi" | "mini" | "micro"): Promise<void>;

  /** Contract §6.6. Synchronous, idempotent, MUST NOT throw. */
  destroy(): void;
}
