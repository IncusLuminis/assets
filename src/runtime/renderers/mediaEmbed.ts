/**
 * Shared `capabilities.mediaEmbed` handling (Contract §10.5, allowlist
 * §16.2), factored out of `CssRenderer.ts` (its original, Story #10 home)
 * so `SvgRenderer.ts` can offer the same YouTube/HeyGen embed support to
 * HUD-01/HUD-02 (Story #43) without duplicating the iframe/allowlist/
 * src-swap-lifecycle logic. Deliberately engine-agnostic: every function
 * here operates on plain DOM elements + a manifest's `capabilities.mediaEmbed`
 * object, never on either renderer's own internal state shape.
 *
 * ## Per-value routing, not a per-manifest gate (Story #43)
 *
 * The original (Story #10) implementation gated this per *manifest*: once
 * `capabilities.mediaEmbed` was declared at all, EVERY `media` slot value
 * had to resolve to an allowlisted embed host, or it was refused and
 * dropped -- even a plain photo URL. That is fine for HUD-04, whose `media`
 * slot only ever holds a HeyGen embed URL, but it breaks HUD-01/HUD-02
 * (Story #43): their `media` slot is (and stays) a plain astronomical photo
 * URL that should now ALSO be able to carry a YouTube/HeyGen embed URL
 * through that same slot.
 *
 * `resolveMediaEmbedUrl` below is therefore a per-VALUE check: does *this*
 * value parse as an absolute URL whose host is in both
 * `capabilities.mediaEmbed.hosts` and the fixed `MEDIA_EMBED_ALLOWLIST`? If
 * yes, the caller routes to the iframe/embed path (`mountMediaEmbed`
 * et al. below). If no -- for ANY reason (not a string, not an absolute
 * URL, no `mediaEmbed` capability declared on the manifest at all, host not
 * allowlisted) -- the caller MUST fall through to its own ordinary
 * plain-image/attribute handling, unconditionally, exactly as if
 * `mediaEmbed` had never been declared. This is strictly additive: HUD-04
 * never sends a non-allowlisted `media` value today, so its behaviour is
 * bit-for-bit unchanged; it only adds a working fallback path that
 * previously silently dropped the value.
 */
import type { MediaEmbedCapability } from "../contract/manifest.js";
import type { Variant } from "../contract/variants.js";

/** Contract §16.2 -- the media-embed slice of the fixed allowlist. */
export const MEDIA_EMBED_ALLOWLIST: readonly string[] = ["app.heygen.com", "www.youtube.com", "player.vimeo.com"];

/**
 * Per-value host check (see module docstring). Returns the validated,
 * absolute URL string to embed, or `undefined` if `value` is not an
 * embeddable URL under this manifest's capability -- in which case the
 * caller MUST fall through to its own plain slot handling; this is never an
 * error case, just "not an embed this time".
 */
export function resolveMediaEmbedUrl(value: unknown, mediaEmbed: MediaEmbedCapability | undefined): string | undefined {
  if (!mediaEmbed || typeof value !== "string" || value.length === 0) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    // Not an absolute URL at all (e.g. a relative path, or plain text) --
    // never "refused", just not an embed candidate.
    return undefined;
  }
  if (!mediaEmbed.hosts.includes(url.hostname) || !MEDIA_EMBED_ALLOWLIST.includes(url.hostname)) {
    // Contract §16.2: not on both the manifest's declared hosts AND the
    // fixed allowlist (e.g. a photo CDN URL) -- falls through to plain
    // handling, not a warn-and-drop.
    return undefined;
  }
  return url.href;
}

/** Renderer-owned bookkeeping for one mounted embed, opaque to callers beyond passing it back into these functions. */
export interface MediaEmbedState {
  el: HTMLIFrameElement;
  realSrc: string;
  /**
   * Only set when `mountMediaEmbed` took over an `<img>`-based slot (Story
   * #43 -- see that function's docstring) so `unmountMediaEmbed` can
   * restore it exactly.
   */
  hiddenImage?: HTMLImageElement;
}

/**
 * Mounts (or, if `existing` is passed, updates) an embed iframe targeting
 * `slotEl`. Handles two shapes of `data-slot="media"` markup:
 *
 * - HUD-04-style: an empty `<div data-slot="media">` container -- the
 *   iframe is simply appended inside it (the original Story #10 shape,
 *   unchanged).
 * - HUD-01/02-style (Story #43): the slot element itself IS the
 *   `<img data-slot="media">` -- there is no spare container to append
 *   into, and hud-01/02 ship no such container (their `media` slot has
 *   always been, and stays, a plain photo `<img>`). Replacing the `<img>`
 *   outright would lose the very element `applySlotValue`/`applyMediaSlot`
 *   key off when the Theme later reverts to a plain photo URL, so instead
 *   the image is hidden (`display:none` + a `data-hud-media-embed-active`
 *   marker) and the iframe is inserted as its next sibling.
 *   `unmountMediaEmbed` reverses this exactly -- removes the iframe,
 *   restores the image's visibility -- so a Theme flipping between an
 *   embed URL and a photo URL via repeated `setData()` calls never leaves
 *   stale DOM behind either way.
 */
export function mountMediaEmbed(slotEl: HTMLElement, src: string, existing: MediaEmbedState | undefined): MediaEmbedState {
  if (existing) {
    existing.realSrc = src;
    return existing;
  }
  const iframe = document.createElement("iframe");
  iframe.setAttribute("allow", "autoplay; encrypted-media");
  iframe.setAttribute("loading", "lazy");
  iframe.className = "hud-media-embed-iframe";

  let hiddenImage: HTMLImageElement | undefined;
  if (slotEl instanceof HTMLImageElement) {
    hiddenImage = slotEl;
    hiddenImage.setAttribute("data-hud-media-embed-active", "");
    hiddenImage.style.display = "none";
    hiddenImage.insertAdjacentElement("afterend", iframe);
  } else {
    slotEl.appendChild(iframe);
  }

  return { el: iframe, realSrc: src, hiddenImage };
}

/** Reverses `mountMediaEmbed` exactly -- restores an `<img>` slot's visibility if one was hidden. Contract §10.5/§17.2 point 4: blank the src before removal. */
export function unmountMediaEmbed(state: MediaEmbedState): void {
  state.el.src = "about:blank";
  state.el.remove();
  if (state.hiddenImage) {
    state.hiddenImage.style.display = "";
    state.hiddenImage.removeAttribute("data-hud-media-embed-active");
  }
}

/** Contract §10.5 `lifecycle: "src-swap"`: parked at `about:blank` except at `maxi`, mirroring the HUD-04 baseline's collapse/expand pause behaviour. */
export function applyMediaEmbedLifecycle(state: MediaEmbedState, variant: Variant | undefined): void {
  state.el.src = variant === "maxi" ? state.realSrc : "about:blank";
}

/**
 * A real teardown target (the caller's `destroy()`/composition-teardown
 * MUST `disconnect()` the returned observer): watches `container`'s
 * `data-hud-variant` attribute (set by the renderer on
 * `mount()`/`setVariant()`) and invokes `onVariantChange` -- which the
 * caller wires to re-run `applyMediaEmbedLifecycle` -- whenever it changes.
 */
export function watchVariantForMediaEmbed(container: HTMLElement, onVariantChange: () => void): MutationObserver {
  const observer = new MutationObserver(onVariantChange);
  observer.observe(container, { attributes: true, attributeFilter: ["data-hud-variant"] });
  return observer;
}
