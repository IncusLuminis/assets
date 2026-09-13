/**
 * The standard semantic slot vocabulary (HUD Theme Contract 1.0 §9.2) and the
 * shapes a Theme declares/consumes slots through. A closed set in 1.0 --
 * extended only via `customSlots` (§9.4) or a Contract MINOR bump.
 */

export const STANDARD_SLOTS = [
  "title",
  "subtitle",
  "status",
  "primary",
  "secondary",
  "media",
  "visualization",
  "controls",
  "content",
  "footer"
] as const;

export type StandardSlotName = (typeof STANDARD_SLOTS)[number];

export type CustomSlotKind = "text" | "html" | "url" | "ref" | "config";

/** Contract §9.4. */
export interface CustomSlot {
  name: string;
  kind: CustomSlotKind;
  required?: boolean;
  description: string;
}

/** Contract §3.1 `slots` field: `{ required: [], optional: [] }`. Either list MAY be empty. */
export interface SlotDeclaration {
  required: string[];
  optional: string[];
}
