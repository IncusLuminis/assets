/**
 * The `maxi` / `mini` / `micro` variant set and the `landscape` / `portrait`
 * orientation set (HUD Theme Contract 1.0 §7-§8). These replace the removed
 * `ratios` / `aspectRatios` field (Contract §3.3) -- form factor is a loose
 * orientation, not an exact aspect ratio (Contract §1.4, §8.1).
 */

export const VARIANTS = ["maxi", "mini", "micro"] as const;
export type Variant = (typeof VARIANTS)[number];

export const ORIENTATIONS = ["landscape", "portrait"] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

/** `"<variant>:<orientation>"`, the `compositions` / `entrypoints` map key (Contract §3.9). */
export type CompositionKey = `${Variant}:${Orientation}`;

/** All six `variant x orientation` keys, in a stable order. Contract §3.9: every 1.0 manifest has exactly one entry per key. */
export const COMPOSITION_KEYS: readonly CompositionKey[] = VARIANTS.flatMap((variant) =>
  ORIENTATIONS.map((orientation) => compositionKey(variant, orientation))
);

export function compositionKey(variant: Variant, orientation: Orientation): CompositionKey {
  return `${variant}:${orientation}`;
}

export function isVariant(value: unknown): value is Variant {
  return typeof value === "string" && (VARIANTS as readonly string[]).includes(value);
}

export function isOrientation(value: unknown): value is Orientation {
  return typeof value === "string" && (ORIENTATIONS as readonly string[]).includes(value);
}
