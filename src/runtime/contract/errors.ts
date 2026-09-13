/**
 * The Contract §20 error model: "The Runtime MUST surface exactly these
 * typed errors" (HUD Theme Contract 1.0 §20.1). Names below are taken
 * VERBATIM from the frozen Contract's §20.1 table -- including
 * `RatioUnsupported`, which the Contract explicitly keeps under that name
 * "for traceability even though form factor is now expressed as
 * orientation" (§20.1 note). Do not rename it to something
 * orientation-flavoured; the Contract is the authority here, not the older
 * issue text that also happened to guess this name right while getting the
 * constructor parameter name (`ratio` -> should be `orientation`) wrong.
 *
 * `RendererUnsupportedError` (§20.1 `RendererUnsupported`) is deliberately
 * NOT redefined here. Story #5 already implemented it in
 * `../renderers/RendererUnsupportedError.ts`, with tests passing against it;
 * the Runtime (`ThemeResolver`/`Hud`) reuses that exact class wherever the
 * Contract calls for `RendererUnsupported`; see `../core/RendererRegistry.ts`.
 *
 * Structure (§20.2): "Each error MUST carry: `code`, `message`, `theme`,
 * `version`, and where relevant `variant`/`orientation`/`resource`."
 */

export type HudErrorCode =
  | "ThemeNotFound"
  | "VersionNotFound"
  | "RegistryUnavailable"
  | "ManifestInvalid"
  | "ContractUnsupported"
  | "RendererUnsupported"
  | "VariantUnsupported"
  | "RatioUnsupported"
  | "EntrypointMissing"
  | "AssetLoadFailed"
  | "ThemeMountFailed"
  | "ThemeRuntimeError";

export interface HudErrorContext {
  theme?: string;
  version?: string;
  variant?: string;
  orientation?: string;
  resource?: string;
}

/**
 * Common shape (Contract §20.2) for every §20.1 error except
 * `RendererUnsupportedError` (see module docstring for why that one stays in
 * `../renderers/`).
 */
export abstract class HudError extends Error {
  abstract readonly code: HudErrorCode;
  readonly theme?: string;
  readonly version?: string;
  readonly variant?: string;
  readonly orientation?: string;
  readonly resource?: string;

  protected constructor(message: string, context: HudErrorContext = {}) {
    super(message);
    this.theme = context.theme;
    this.version = context.version;
    this.variant = context.variant;
    this.orientation = context.orientation;
    this.resource = context.resource;
  }
}

/** §20.1: `id` not in the Registry. */
export class ThemeNotFoundError extends HudError {
  readonly code = "ThemeNotFound" as const;
  constructor(theme: string) {
    super(`Theme "${theme}" was not found in the Registry`, { theme });
    this.name = "ThemeNotFoundError";
  }
}

/** §20.1: `id` exists, requested `version` does not. */
export class VersionNotFoundError extends HudError {
  readonly code = "VersionNotFound" as const;
  constructor(theme: string, version: string) {
    super(`Theme "${theme}" has no published version "${version}"`, { theme, version });
    this.name = "VersionNotFoundError";
  }
}

/** §20.1: Registry/index/manifest fetch fails at the network level. */
export class RegistryUnavailableError extends HudError {
  readonly code = "RegistryUnavailable" as const;
  constructor(theme: string, version: string, detail?: string) {
    super(
      `Registry/manifest fetch failed for "${theme}"@${version}${detail ? `: ${detail}` : ""}`,
      { theme, version }
    );
    this.name = "RegistryUnavailableError";
  }
}

/** §20.1: manifest fails schema or §3 validation. */
export class ManifestInvalidError extends HudError {
  readonly code = "ManifestInvalid" as const;
  constructor(theme: string, version: string, detail: string) {
    super(`Manifest for "${theme}"@${version} failed validation: ${detail}`, { theme, version });
    this.name = "ManifestInvalidError";
  }
}

/** §20.1: manifest `contractVersion` major not implemented by this Runtime. */
export class ContractUnsupportedError extends HudError {
  readonly code = "ContractUnsupported" as const;
  constructor(theme: string, version: string, contractVersion: string) {
    super(
      `Theme "${theme}"@${version} targets Contract ${contractVersion}, which this Runtime does not implement`,
      { theme, version }
    );
    this.name = "ContractUnsupportedError";
  }
}

/** §20.1: requested `variant` not in `variants`, or the composition is `supported: false` (see §20.1 note for the Ratio/Variant disambiguation). */
export class VariantUnsupportedError extends HudError {
  readonly code = "VariantUnsupported" as const;
  constructor(theme: string, version: string, variant: string, orientation?: string) {
    super(
      `Theme "${theme}"@${version} does not support variant "${variant}"${
        orientation ? ` at orientation "${orientation}"` : ""
      }`,
      { theme, version, variant, orientation }
    );
    this.name = "VariantUnsupportedError";
  }
}

/** §20.1: requested `orientation` not in `orientations`, or the composition is `supported: false`/absent. Name retained verbatim from Arch §45 -- see module docstring. */
export class RatioUnsupportedError extends HudError {
  readonly code = "RatioUnsupported" as const;
  constructor(theme: string, version: string, variant: string, orientation: string) {
    super(
      `Theme "${theme}"@${version} does not support orientation "${orientation}" for variant "${variant}"`,
      { theme, version, variant, orientation }
    );
    this.name = "RatioUnsupportedError";
  }
}

/** §20.1: a `styles`/`markup`/`scripts` path does not resolve in the package. */
export class EntrypointMissingError extends HudError {
  readonly code = "EntrypointMissing" as const;
  constructor(theme: string, version: string, resource: string, variant?: string, orientation?: string) {
    super(`Theme "${theme}"@${version} is missing entrypoint resource "${resource}"`, {
      theme,
      version,
      variant,
      orientation,
      resource
    });
    this.name = "EntrypointMissingError";
  }
}

/** §20.1: a required in-package asset or required base fails to load. */
export class AssetLoadFailedError extends HudError {
  readonly code = "AssetLoadFailed" as const;
  constructor(theme: string, version: string, resource: string) {
    super(`Theme "${theme}"@${version} failed to load required asset "${resource}"`, {
      theme,
      version,
      resource
    });
    this.name = "AssetLoadFailedError";
  }
}

/** §20.1: renderer `mount` throws / rejects. */
export class ThemeMountFailedError extends HudError {
  readonly code = "ThemeMountFailed" as const;
  constructor(theme: string, version: string, cause?: unknown) {
    super(`Theme "${theme}"@${version} failed to mount${causeSuffix(cause)}`, { theme, version });
    this.name = "ThemeMountFailedError";
    if (cause !== undefined) this.cause = cause instanceof Error ? cause : new Error(String(cause));
  }
}

/** §20.1: a Theme script throws after a successful mount. */
export class ThemeRuntimeError extends HudError {
  readonly code = "ThemeRuntimeError" as const;
  constructor(theme: string, version: string, cause?: unknown) {
    super(`Theme "${theme}"@${version} threw at runtime after mount${causeSuffix(cause)}`, {
      theme,
      version
    });
    this.name = "ThemeRuntimeError";
    if (cause !== undefined) this.cause = cause instanceof Error ? cause : new Error(String(cause));
  }
}

function causeSuffix(cause: unknown): string {
  return cause instanceof Error ? `: ${cause.message}` : "";
}
