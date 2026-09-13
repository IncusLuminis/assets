import { ReservedEngineRenderer } from "./ReservedEngineRenderer.js";

/**
 * `engine: "video"` is a reserved-but-unsupported enum value in Platform 0.1
 * (HUD Theme Contract 1.0 §5.1-§5.2). This stub exists only so manifests
 * declaring it are schema-valid and Registry-listable ahead of Runtime
 * support (§5.2) -- see `ReservedEngineRenderer` for the shared lifecycle
 * behaviour. A real video renderer is out of 0.1 scope entirely -- not
 * scheduled as #9/#10 (those are `svg`/`css`).
 */
export class VideoRenderer extends ReservedEngineRenderer {
  protected readonly rendererName = "VideoRenderer";
}
