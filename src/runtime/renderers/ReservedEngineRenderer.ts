import type { MountContext, RendererLifecycle, Viewport } from "./RendererInterface.js";
import { RendererUnsupportedError } from "./RendererUnsupportedError.js";

/**
 * Shared base for the three reserved-but-unsupported `engine` stubs
 * (`video` | `static` | `gadget`, HUD Theme Contract 1.0 §5.1-§5.2).
 *
 * Every lifecycle method that does work throws `RendererUnsupportedError`
 * ("RendererUnsupported", §20.1) -- **except** `destroy()`, which Contract
 * §6.6 requires MUST NOT throw, even if `mount` never completed or failed,
 * and MUST be safe to call idempotently. Since a reserved-engine stub never
 * mounts anything, `destroy()` has nothing to tear down: a no-op is the
 * correct, conformant implementation, not just an exception to the rule
 * above.
 *
 * `VideoRenderer` / `StaticRenderer` / `GadgetRenderer` are otherwise
 * identical; this base exists so that shared behaviour lives in one place
 * rather than three copies that could drift out of sync with each other or
 * with Contract §6.6.
 */
export abstract class ReservedEngineRenderer implements RendererLifecycle {
  protected abstract readonly rendererName: string;

  async mount(_container: HTMLElement, _context: MountContext): Promise<void> {
    throw new RendererUnsupportedError(this.rendererName);
  }

  setData(_data: Record<string, unknown>): void {
    throw new RendererUnsupportedError(this.rendererName);
  }

  resize(_viewport: Viewport): void {
    throw new RendererUnsupportedError(this.rendererName);
  }

  async setVariant(_variant: "maxi" | "mini" | "micro"): Promise<void> {
    throw new RendererUnsupportedError(this.rendererName);
  }

  /** Contract §6.6: MUST NOT throw. Intentionally a no-op -- see class docstring. */
  destroy(): void {
    // no-op
  }
}
