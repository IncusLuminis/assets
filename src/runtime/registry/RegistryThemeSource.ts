/**
 * A `ThemeSource` (`../core/ThemeSource.ts`) that resolves HUD Themes from
 * the *published* Registry/CDN: HUD Theme Contract 1.0 §2.2's
 * `themes/<id>/<version>/` package layout, discovered via a fetched
 * `registry/index.json` (Contract §12 steps 2-4, Architecture §27-29).
 *
 * This is the Story #1/#16 implementation `../core/ThemeSource.ts`'s
 * docstring and `../index.ts`'s module docstring both point at -- Platform
 * 0.1's other `ThemeSource`
 * (`tests/helpers/file-system-theme-source.js`) reads Contract §2.1 *source*
 * layout off disk for this repo's own test suite; this one is the
 * browser/HTTP-backed counterpart real consumers (HUD Playground,
 * `stellar-attractor-site`) use against a deployed CDN.
 */
import { RegistryUnavailableError, ThemeNotFoundError, VersionNotFoundError } from "../contract/errors.js";
import type { ThemeSource } from "../core/ThemeSource.js";

/**
 * The `registry/index.json` document shape this class fetches and reads.
 * There is no shared TS type for this elsewhere under `src/` -- the only
 * existing validator for it is `scripts/build/lib/registry-index-validator.ts`,
 * which is Node/build-side tooling (uses `ajv`) that generates/validates the
 * index at build time and is deliberately not imported into the
 * browser-bundled Runtime. This is a plain structural type, not validated at
 * runtime by this class: a malformed index (wrong shape, but valid JSON)
 * will surface as a `TypeError` from the lookup code below rather than a
 * typed Contract §20 error, same as the original JS implementation this was
 * ported from.
 */
interface RegistryIndex {
  schemaVersion: string;
  themes: RegistryThemeEntry[];
}

interface RegistryThemeEntry {
  id: string;
  /** The version string `resolveVersion(id, "latest")` resolves to. */
  latest: string;
  /** Root-relative path to `latest`'s manifest.json. Unused by this class -- `versions[].manifest` is authoritative per version. */
  manifest: string;
  versions: RegistryVersionEntry[];
}

interface RegistryVersionEntry {
  version: string;
  /** Root-relative path, e.g. `/themes/<id>/<version>/manifest.json`. */
  manifest: string;
  /** Root-relative package directory, trailing slash, e.g. `/themes/<id>/<version>/`. */
  package: string;
}

/**
 * Browser `ThemeSource` that resolves HUD Themes from the published
 * Registry/CDN (Contract §2.2 package layout, `registry/index.json`
 * discovery metadata).
 */
export class RegistryThemeSource implements ThemeSource {
  readonly #baseUrl: string;
  #registryPromise: Promise<RegistryIndex> | null = null;
  #registry: RegistryIndex | null = null;

  constructor(baseUrl = "https://assets-4gy.pages.dev/") {
    this.#baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  }

  async resolveVersion(themeId: string, requestedVersion: string): Promise<string> {
    const entry = await this.#findThemeEntry(themeId, requestedVersion);
    if (requestedVersion === "latest") {
      return entry.latest;
    }
    const match = entry.versions.find((v) => v.version === requestedVersion);
    if (!match) {
      throw new VersionNotFoundError(themeId, requestedVersion);
    }
    return match.version;
  }

  /** Returns the raw parsed manifest JSON -- `ThemeResolver` validates/narrows it (Contract §12 step 5), not this class. */
  async loadManifest(themeId: string, version: string): Promise<unknown> {
    const entry = await this.#findThemeEntry(themeId, version);
    const match = entry.versions.find((v) => v.version === version);
    if (!match) {
      throw new VersionNotFoundError(themeId, version);
    }
    const url = new URL(match.manifest, this.#baseUrl).href;
    let response: Response;
    try {
      response = await fetch(url);
    } catch (err) {
      throw new RegistryUnavailableError(
        themeId,
        version,
        `manifest fetch failed at "${url}" (${err instanceof Error ? err.message : String(err)})`
      );
    }
    if (response.status === 404) {
      throw new VersionNotFoundError(themeId, version);
    }
    if (!response.ok) {
      throw new RegistryUnavailableError(
        themeId,
        version,
        `HTTP ${response.status} ${response.statusText} fetching manifest at "${url}"`
      );
    }
    try {
      return await response.json();
    } catch (err) {
      throw new RegistryUnavailableError(
        themeId,
        version,
        `manifest at "${url}" is not valid JSON (${err instanceof Error ? err.message : String(err)})`
      );
    }
  }

  assetBaseUrl(themeId: string, version: string): string {
    if (!this.#registry) {
      throw new Error(
        `RegistryThemeSource#assetBaseUrl("${themeId}", "${version}") called before the registry index ` +
          `resolved -- resolveVersion()/loadManifest() must be awaited first (Contract §12 steps 2-4)`
      );
    }
    const entry = this.#registry.themes.find((t) => t.id === themeId);
    const match = entry?.versions.find((v) => v.version === version);
    if (!match) {
      throw new VersionNotFoundError(themeId, version);
    }
    return new URL(match.package, this.#baseUrl).href;
  }

  async #findThemeEntry(themeId: string, version: string): Promise<RegistryThemeEntry> {
    const registry = await this.#getRegistry(themeId, version);
    const entry = registry.themes.find((t) => t.id === themeId);
    if (!entry) {
      throw new ThemeNotFoundError(themeId);
    }
    return entry;
  }

  /** Fetches+caches the registry index once; a failed fetch is not cached, so the next call retries the network. */
  #getRegistry(themeId: string, version: string): Promise<RegistryIndex> {
    if (!this.#registryPromise) {
      this.#registryPromise = this.#fetchRegistry(themeId, version)
        .then((registry) => {
          this.#registry = registry;
          return registry;
        })
        .catch((err) => {
          this.#registryPromise = null;
          throw err;
        });
    }
    return this.#registryPromise;
  }

  async #fetchRegistry(themeId: string, version: string): Promise<RegistryIndex> {
    const url = new URL("registry/index.json", this.#baseUrl).href;
    let response: Response;
    try {
      response = await fetch(url);
    } catch (err) {
      throw new RegistryUnavailableError(
        themeId,
        version,
        `registry index fetch failed at "${url}" (${err instanceof Error ? err.message : String(err)})`
      );
    }
    if (!response.ok) {
      throw new RegistryUnavailableError(
        themeId,
        version,
        `HTTP ${response.status} ${response.statusText} fetching registry index at "${url}"`
      );
    }
    try {
      return (await response.json()) as RegistryIndex;
    } catch (err) {
      throw new RegistryUnavailableError(
        themeId,
        version,
        `registry index at "${url}" is not valid JSON (${err instanceof Error ? err.message : String(err)})`
      );
    }
  }
}
