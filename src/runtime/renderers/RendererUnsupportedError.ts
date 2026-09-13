/**
 * The typed error a 1.0 Runtime MUST raise when asked to mount a Theme whose
 * `engine` is a reserved-but-unsupported enum value (`video` | `static` |
 * `gadget`) -- HUD Theme Contract 1.0 §5.2, §20.1 (`RendererUnsupported`).
 * The Contract is explicit that the Runtime MUST NOT attempt a fallback
 * renderer in this case (§5.2, §20.4).
 *
 * This is intentionally the *only* piece of the Contract's §20 error model
 * implemented in this Story -- just enough for the renderer stubs below to
 * throw the documented, named error. The full error set / error sink lives
 * with the real Runtime (#8).
 */
export class RendererUnsupportedError extends Error {
  /** Matches HUD Theme Contract 1.0 §20.1's `RendererUnsupported` error code. */
  readonly code = "RendererUnsupported";

  constructor(rendererName: string) {
    super(`${rendererName} is reserved and unsupported in Platform 0.1`);
    this.name = "RendererUnsupportedError";
  }
}
