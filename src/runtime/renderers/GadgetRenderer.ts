import { ReservedEngineRenderer } from "./ReservedEngineRenderer.js";

/**
 * `engine: "gadget"` is a reserved-but-unsupported enum value in Platform
 * 0.1 (HUD Theme Contract 1.0 §5.1-§5.2). See `VideoRenderer.ts` /
 * `ReservedEngineRenderer.ts` for the full rationale -- identical here.
 */
export class GadgetRenderer extends ReservedEngineRenderer {
  protected readonly rendererName = "GadgetRenderer";
}
