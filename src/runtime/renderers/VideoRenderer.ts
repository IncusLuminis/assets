import type { MountContext, RendererLifecycle, Viewport } from "./RendererInterface.js";
import { RendererUnsupportedError } from "./RendererUnsupportedError.js";

/**
 * `engine: "video"` is a reserved-but-unsupported enum value in Platform 0.1
 * (HUD Theme Contract 1.0 §5.1-§5.2). This stub exists only so manifests
 * declaring it are schema-valid and Registry-listable ahead of Runtime
 * support (§5.2). Every lifecycle method that does work throws
 * `RendererUnsupportedError` ("RendererUnsupported", §20.1) -- **except**
 * `destroy()`, which Contract §6.6 requires MUST NOT throw, even if `mount`
 * never completed or failed. A real video renderer is out of 0.1 scope
 * entirely -- not scheduled as #9/#10 (those are `svg`/`css`).
 */
export class VideoRenderer implements RendererLifecycle {
  async mount(_container: HTMLElement, _context: MountContext): Promise<void> {
    throw new RendererUnsupportedError("VideoRenderer");
  }

  setData(_data: Record<string, unknown>): void {
    throw new RendererUnsupportedError("VideoRenderer");
  }

  resize(_viewport: Viewport): void {
    throw new RendererUnsupportedError("VideoRenderer");
  }

  async setVariant(_variant: "maxi" | "mini" | "micro"): Promise<void> {
    throw new RendererUnsupportedError("VideoRenderer");
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
