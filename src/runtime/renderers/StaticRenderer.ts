import type { MountContext, RendererLifecycle, Viewport } from "./RendererInterface.js";
import { RendererUnsupportedError } from "./RendererUnsupportedError.js";

/**
 * `engine: "static"` is a reserved-but-unsupported enum value in Platform 0.1
 * (HUD Theme Contract 1.0 §5.1-§5.2). See VideoRenderer.ts for the full
 * rationale -- identical here. Every lifecycle method throws
 * `RendererUnsupportedError` ("RendererUnsupported", §20.1).
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

  destroy(): void {
    throw new RendererUnsupportedError("StaticRenderer");
  }
}
