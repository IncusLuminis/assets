/**
 * The seam between Theme *resolution* (`ThemeResolver`) and wherever a
 * Theme's manifest actually lives (HUD Theme Contract 1.0 §12 steps 2-4:
 * requested version -> Registry resolution -> manifest fetch).
 *
 * Platform 0.1 ships no concrete Registry/CDN-backed implementation here --
 * a published `themes/<id>/<version>/manifest.json` fetched over HTTP
 * (Contract §2.2) is #1/#16's job. This Story defines only the interface,
 * plus a filesystem-backed implementation used by this repo's own test
 * suite (`tests/helpers/file-system-theme-source.js`) to resolve
 * `library/themes/<id>/` Theme *sources* (Contract §2.1) and prove the
 * resolution -> mount -> destroy pipeline end-to-end against the real
 * `fixture-hud` fixture. Swapping in a Registry-backed `ThemeSource` later
 * requires no change to `Hud` or `ThemeResolver` -- both depend only on this
 * interface.
 */
export interface ThemeSource {
  /**
   * Resolves a requested version string (an explicit SemVer, or `"latest"`
   * per Contract §4.4 / §14.1) to a concrete version. MUST reject with
   * `ThemeNotFoundError` if `themeId` is unknown, `VersionNotFoundError` if
   * the version does not exist for an otherwise-known Theme, or
   * `RegistryUnavailableError` on a network/fetch-level failure.
   */
  resolveVersion(themeId: string, requestedVersion: string): Promise<string>;

  /**
   * Fetches and parses the manifest for an already-resolved
   * `(themeId, version)` pair. Same rejection contract as `resolveVersion`.
   * Returns the raw parsed JSON -- `ThemeResolver` is responsible for
   * validating and narrowing it to `Manifest` (Contract §12 step 5).
   */
  loadManifest(themeId: string, version: string): Promise<unknown>;

  /**
   * The base a renderer resolves the manifest's package-relative paths
   * (`entrypoints[...]`, `assets/...`) against (Contract §11.3), passed
   * through verbatim as `MountContext.assetBaseUrl`. Synchronous and
   * side-effect-free.
   */
  assetBaseUrl(themeId: string, version: string): string;
}
