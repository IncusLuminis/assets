/**
 * Implements HUD Theme Contract 1.0 §12's resolution flow, steps 2-10.
 *
 * Step 1 (the Theme id) is the caller's input. Steps 11-12 (resource
 * loading, `renderer.mount()`) are deliberately `Hud.mount()`'s job, not
 * this class's: per Contract §6.2/§5.3/§5.4, the RENDERER is the thing that
 * fetches/injects a composition's `styles`/`markup`/`scripts` against
 * `context.assetBaseUrl` -- `MountContext` (Story #5's
 * `RendererInterface.ts`) hands the renderer the full `manifest` plus
 * `assetBaseUrl` precisely so it can do that itself. `ThemeResolver`'s job
 * ends once it has proven the requested `(theme, version, variant,
 * orientation)` combination is valid and has picked the renderer instance
 * that will do the mounting.
 */
import type { CompositionKey, Orientation, Variant } from "../contract/variants.js";
import { compositionKey } from "../contract/variants.js";
import type { EntrypointEntry, Manifest } from "../contract/manifest.js";
import { validateManifestShape } from "../contract/validateManifest.js";
import {
  AssetLoadFailedError,
  ContractUnsupportedError,
  EntrypointMissingError,
  HudError,
  RatioUnsupportedError,
  RegistryUnavailableError,
  VariantUnsupportedError
} from "../contract/errors.js";
import { RendererUnsupportedError } from "../renderers/RendererUnsupportedError.js";
import type { RendererLifecycle } from "../renderers/RendererInterface.js";
import type { ThemeSource } from "./ThemeSource.js";
import type { RendererRegistry } from "./RendererRegistry.js";

/** The only Contract major this 0.1 Runtime implements (Contract §1.3, §20.1 `ContractUnsupported`). */
const IMPLEMENTED_CONTRACT_MAJOR = "1";

const EXACT_SEMVER = /^\d+\.\d+\.\d+$/;
const CARET_SEMVER = /^\^\d+\.\d+\.\d+$/;

export interface ThemeResolveRequest {
  theme: string;
  version: string;
  variant: Variant;
  orientation: Orientation;
}

export interface ResolvedTheme {
  manifest: Manifest;
  theme: string;
  version: string;
  variant: Variant;
  orientation: Orientation;
  compositionKey: CompositionKey;
  entrypoint: EntrypointEntry;
  assetBaseUrl: string;
  renderer: RendererLifecycle;
}

export class ThemeResolver {
  constructor(
    private readonly themeSource: ThemeSource,
    private readonly rendererRegistry: RendererRegistry
  ) {}

  async resolve(request: ThemeResolveRequest): Promise<ResolvedTheme> {
    const { theme, variant, orientation } = request;

    // Steps 2-3: requested version -> concrete version.
    const version = await this.#viaSource(theme, request.version, () =>
      this.themeSource.resolveVersion(theme, request.version)
    );

    // Step 4: manifest fetch.
    const raw = await this.#viaSource(theme, version, () => this.themeSource.loadManifest(theme, version));

    // Step 5: manifest validation (schema + Contract §3 rules).
    const manifest = validateManifestShape(raw, theme, version);

    // Step 6: Contract-compatibility check.
    const contractMajor = manifest.contractVersion.split(".")[0];
    if (contractMajor !== IMPLEMENTED_CONTRACT_MAJOR) {
      throw new ContractUnsupportedError(theme, version, manifest.contractVersion);
    }

    // Step 7: renderer selection -- the #9/#10 extension point (RendererRegistry).
    const renderer = this.rendererRegistry.create(manifest.engine);
    if (!renderer) {
      throw new RendererUnsupportedError(
        `No renderer is registered for engine "${manifest.engine}" (Theme "${theme}"@${version})`
      );
    }

    // Step 8: base resolution. See `assertBaseVersionResolvable` docstring
    // for why this is format-only in Platform 0.1.
    assertBaseVersionResolvable(manifest.baseVersion, theme, version);

    // Step 9: variant + orientation -> composition.
    const key = resolveCompositionKey(manifest, variant, orientation, theme, version);

    // Step 10: entrypoint set.
    const entrypoint = manifest.entrypoints[key];
    if (!entrypoint) {
      throw new EntrypointMissingError(theme, version, `entrypoints["${key}"]`, variant, orientation);
    }

    const assetBaseUrl = this.themeSource.assetBaseUrl(theme, version);

    return {
      manifest,
      theme,
      version,
      variant,
      orientation,
      compositionKey: key,
      entrypoint,
      assetBaseUrl,
      renderer
    };
  }

  async #viaSource<T>(theme: string, version: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof HudError) throw err;
      throw new RegistryUnavailableError(theme, version, err instanceof Error ? err.message : String(err));
    }
  }
}

/**
 * Contract §3.8: "The Runtime MUST resolve a compatible base or fail with
 * `AssetLoadFailed`." DOCUMENTED INTERPRETATION: Platform 0.1 has not yet
 * built the shared-foundation base-injection mechanism (Contract §11.2)
 * anywhere in this repo -- no other Story has scaffolded it, and it is not
 * in this Story's scope list. Format-only validation (exact SemVer or caret
 * range, per Contract §3.8's grammar) is this Story's conservative
 * placeholder for "resolve a compatible base" until that infrastructure
 * exists; actually injecting the base bundle once per page is out of #8's
 * scope as briefed. Flagged for a human/owner call if base injection should
 * land as part of this Story instead.
 */
function assertBaseVersionResolvable(baseVersion: string, theme: string, version: string): void {
  if (!EXACT_SEMVER.test(baseVersion) && !CARET_SEMVER.test(baseVersion)) {
    throw new AssetLoadFailedError(theme, version, `baseVersion "${baseVersion}"`);
  }
}

function resolveCompositionKey(
  manifest: Manifest,
  variant: Variant,
  orientation: Orientation,
  theme: string,
  version: string
): CompositionKey {
  if (!manifest.variants.includes(variant)) {
    throw new VariantUnsupportedError(theme, version, variant, orientation);
  }
  if (!manifest.orientations.includes(orientation)) {
    throw new RatioUnsupportedError(theme, version, variant, orientation);
  }

  const key = compositionKey(variant, orientation);
  const composition = manifest.compositions[key];
  if (composition?.supported === true) {
    return key;
  }

  // Contract §20.1 note: "prefer RatioUnsupported if the variant is
  // otherwise valid at another orientation, else VariantUnsupported; both
  // are acceptable and consumers should handle both."
  const variantSupportedElsewhere = manifest.orientations.some((otherOrientation) => {
    if (otherOrientation === orientation) return false;
    return manifest.compositions[compositionKey(variant, otherOrientation)]?.supported === true;
  });

  if (variantSupportedElsewhere) {
    throw new RatioUnsupportedError(theme, version, variant, orientation);
  }
  throw new VariantUnsupportedError(theme, version, variant, orientation);
}
