import fs from "node:fs/promises";
import path from "node:path";
import {
  ThemeNotFoundError,
  VersionNotFoundError
} from "../../src/runtime/contract/errors.ts";

/**
 * A minimal, filesystem-backed `ThemeSource` (see
 * `src/runtime/core/ThemeSource.ts`) that resolves Themes from
 * `library/themes/<id>/` -- the Theme *source* form (Contract §2.1), not a
 * published `dist/themes/<id>/<version>/` package.
 *
 * This is a Story #8 test fixture, not a production Registry client:
 * `library/themes/<id>/` carries exactly one manifest (no version
 * subdirectories -- only the *published* layout is normative for the
 * Runtime, Contract §2.1). It intentionally lives under `tests/helpers/`
 * (plain JS, not TypeScript) rather than `src/runtime/core/` -- it needs
 * `node:fs`, which would either require adding `@types/node` for no other
 * reason in this repo or leak a Node-only dependency into the
 * browser-bundled Runtime entry point (`src/runtime/index.ts`) if placed
 * under `src/`. A Registry/CDN-backed `ThemeSource` implementing the same
 * three-method interface against `themes/<id>/<version>/manifest.json` over
 * HTTP is #1/#16's job; nothing in `Hud`/`ThemeResolver` needs to change to
 * swap it in.
 */
export class FileSystemThemeSource {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async resolveVersion(themeId, requestedVersion) {
    const manifest = await this.#readManifest(themeId);
    if (requestedVersion === "latest") return manifest.version;
    if (requestedVersion !== manifest.version) {
      throw new VersionNotFoundError(themeId, requestedVersion);
    }
    return manifest.version;
  }

  async loadManifest(themeId, _version) {
    return this.#readManifest(themeId);
  }

  assetBaseUrl(themeId, _version) {
    return `file://${path.join(this.basePath, themeId)}/`;
  }

  async #readManifest(themeId) {
    const manifestPath = path.join(this.basePath, themeId, "manifest.json");
    let text;
    try {
      text = await fs.readFile(manifestPath, "utf8");
    } catch {
      throw new ThemeNotFoundError(themeId);
    }
    return JSON.parse(text);
  }
}
