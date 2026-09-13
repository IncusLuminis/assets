/**
 * The Contract §12 step-7 extension point: maps a manifest's `engine` value
 * to a renderer instance.
 *
 * `createDefaultRendererRegistry()` pre-registers the Story #5
 * reserved-engine stubs (`video`/`static`/`gadget` -> `RendererUnsupportedError`
 * on every working method, per Contract §5.2). `svg`/`css` are deliberately
 * left UNREGISTERED here -- #9/#10 each register their real renderer with:
 *
 *   registry.register("svg", () => new SvgRenderer());
 *   registry.register("css", () => new CssRenderer());
 *
 * and nothing in `Hud.ts` / `ThemeResolver.ts` needs to change. An engine
 * with no registered factory (including `svg`/`css` until #9/#10 land)
 * raises the same `RendererUnsupportedError` (Contract §20.1
 * `RendererUnsupported`) the reserved stubs throw -- see
 * `ThemeResolver.resolve()`.
 */
import type { EngineId } from "../contract/manifest.js";
import type { RendererLifecycle } from "../renderers/RendererInterface.js";
import { GadgetRenderer, StaticRenderer, VideoRenderer } from "../renderers/index.js";

export type RendererFactory = () => RendererLifecycle;

export class RendererRegistry {
  readonly #factories = new Map<EngineId, RendererFactory>();

  register(engine: EngineId, factory: RendererFactory): void {
    this.#factories.set(engine, factory);
  }

  has(engine: EngineId): boolean {
    return this.#factories.has(engine);
  }

  /** Returns a fresh renderer instance for `engine`, or `undefined` if none is registered. */
  create(engine: EngineId): RendererLifecycle | undefined {
    return this.#factories.get(engine)?.();
  }
}

export function createDefaultRendererRegistry(): RendererRegistry {
  const registry = new RendererRegistry();
  registry.register("video", () => new VideoRenderer());
  registry.register("static", () => new StaticRenderer());
  registry.register("gadget", () => new GadgetRenderer());
  return registry;
}
