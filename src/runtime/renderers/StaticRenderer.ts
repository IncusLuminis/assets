import type { MountContext, RendererLifecycle, Viewport } from "./RendererInterface.js";
import { RendererUnsupportedError } from "./RendererUnsupportedError.js";

/**
 * `engine: "static"` is a reserved-but-unsupported enum value in Platform 0.1
 * (HUD Theme Contract 1.0 §5.1-§5.2). See VideoRenderer.ts for the full
 * rationale -- identical here. Every lifecycle method that does work throws
 * `RendererUnsupportedError` ("RendererUnsupported", §20.1) -- **except**
 * `destroy()`, which Contract §6.6 requires MUST NOT throw.
 */
export class StaticRenderer implements RendererLifecycle {
  async mount(_container: HTMLElement, _context: MountContext): Promise<void> {
    throw new RendererUnsupportedError("StaticRenderer");
  }

  setData(_data: Record<string, unknown>): void {
    throw new RendererUnsupportedError("StaticRenderer");
  }

  resize(_viewport: Viewport): void {
    throw new RendererUnsupportedError("StaticRenderer");
  }

  async setVariant(_variant: "maxi" | "mini" | "micro"): Promise<void> {
    throw new RendererUnsupportedError("StaticRenderer");
  }

  /**
   * Contract §6.6: `destroy()` MUST NOT throw, even if `mount` never
   * completed or failed, and MUST be safe to call idempotently. Since this
   * renderer never mounted anything, there is nothing to tear down -- a
   * no-op is the correct, conformant implementation.
   */
  destroy(): void {
    // Intentionally a no-op -- see docstring above.
  }
}
