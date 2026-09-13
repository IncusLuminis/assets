/**
 * TypeScript mirror of the manifest shape defined by HUD Theme Contract 1.0
 * §3 (prose authority) and encoded by `registry/schemas/manifest.schema.json`
 * (#3). Field-for-field against Contract §3.1's table; where the schema and
 * this file could drift, the Contract (and the schema it governs) wins --
 * see `validateManifest.ts` for the structural check that a real manifest
 * (e.g. `library/themes/fixture-hud/manifest.json`) satisfies this type, and
 * `tests/unit/contract-manifest-types.test.js` for the sanity proof.
 */

import type { CompositionKey, Orientation, Variant } from "./variants.js";
import type { CustomSlot, SlotDeclaration } from "./slots.js";

/** Contract §5.1. `video`/`static`/`gadget` are reserved-but-unsupported in 1.0. */
export type EngineId = "svg" | "css" | "video" | "static" | "gadget";

/** Contract §15.1. */
export type IsolationMode = "scoped-root" | "shadow-dom" | "shadow-dom-preferred" | "iframe";

/** Contract §3.9. */
export interface CompositionEntry {
  /** Package-relative directory. REQUIRED when `supported` is `true`. */
  dir?: string;
  supported: boolean;
  /** REQUIRED when `supported` is `false`. */
  reason?: string;
}

/** Exactly one entry per `variant x orientation` (6 in 1.0) -- Contract §3.9. */
export type Compositions = Record<CompositionKey, CompositionEntry>;

/** Contract §3.10. Order within `styles`/`scripts` is significant. */
export interface EntrypointEntry {
  styles: string[];
  /** Exactly one package-relative entry document (`.svg`/`.html` for `svg`, `.html` fragment for `css`). */
  markup: string;
  scripts: string[];
}

/** Only compositions with `supported: true` have an entry (Contract §3.10 rule 5). */
export type Entrypoints = Partial<Record<CompositionKey, EntrypointEntry>>;

export type ExternalResourceKind = "script" | "style" | "font" | "fetch" | "iframe";
export type ExternalResourceTiming = "page-load" | "lazy";

/** Contract §3.13. */
export interface ExternalResource {
  host: string;
  kind: ExternalResourceKind;
  timing: ExternalResourceTiming;
  required?: boolean;
  note?: string;
}

export type DataSourceProvider = "simbad" | "vizier" | "ads";

/** Contract §10.2. */
export interface DataSourceCapability {
  providers: DataSourceProvider[];
  hosts: string[];
  input: string;
  timing?: Partial<Record<DataSourceProvider, ExternalResourceTiming>>;
}

/** Contract §10.5. */
export interface MediaEmbedCapability {
  hosts: string[];
  lifecycle: "src-swap" | "static";
}

/** Contract §11.1. */
export interface ModesCapability {
  values: string[];
  default: string;
  config: string;
}

/** Contract §3.11. Absent flag = capability not present. */
export interface Capabilities {
  animation?: boolean;
  interactive?: boolean;
  background?: boolean;
  htmlSlot?: boolean;
  multiInstance?: boolean;
  skyViewer?: boolean;
  dataSource?: DataSourceCapability;
  mediaEmbed?: MediaEmbedCapability;
  modes?: ModesCapability;
}

/** Contract §22 / §22.3. */
export type KnownDeviationCode =
  | "no-maxi-portrait"
  | "no-maxi-landscape"
  | "external-io-on-mount"
  | "shadow-dom-fallback"
  | "shared-base-host-selectors-stripped";

export interface KnownDeviation {
  code: KnownDeviationCode;
  scope: string;
  clause?: string;
  note: string;
  plannedResolution?: string;
}

/** The full manifest shape -- Contract §3.1's field table. */
export interface Manifest {
  schemaVersion: string;
  contractVersion: string;
  id: string;
  name: string;
  version: string;
  description?: string;
  engine: EngineId;
  baseVersion: string;
  /** 1.0 MUST include all of `maxi`/`mini`/`micro` (Contract §7.1). */
  variants: Variant[];
  /** 1.0 MUST include both `landscape`/`portrait` (Contract §8.2). */
  orientations: Orientation[];
  compositions: Compositions;
  slots: SlotDeclaration;
  customSlots?: CustomSlot[];
  capabilities: Capabilities;
  entrypoints: Entrypoints;
  externalResources?: ExternalResource[];
  animations?: string[];
  isolation: IsolationMode;
  overflowVisible?: boolean;
  knownDeviations?: KnownDeviation[];
  preview?: Partial<Record<CompositionKey, string>>;
  metadata?: Record<string, unknown>;
}
