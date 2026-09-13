import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

/**
 * A `CssResourceFetcher` (see `src/runtime/renderers/CssRenderer.ts`) backed
 * by `node:fs` instead of the global `fetch`. `fetch()` has no `file:`
 * support in Node/jsdom (verified directly: it rejects with "fetch failed"),
 * and `FileSystemThemeSource.assetBaseUrl()` (Story #8's own test helper,
 * `tests/helpers/file-system-theme-source.js`) is the only `ThemeSource`
 * this repo's test suite has -- it returns a `file://` base. A real
 * (browser) Runtime always uses `CssRenderer`'s default `fetchText`
 * (plain `fetch`, see the class docstring); this helper exists only so the
 * test suite can drive `CssRenderer` against real `library/themes/<id>/`
 * fixtures on disk without a real HTTP server. Kept in `tests/helpers/`
 * (plain JS), not `src/`, for the same reason `FileSystemThemeSource` is --
 * see that file's docstring.
 */
export async function fileFetchText(url) {
  if (!url.startsWith("file://")) {
    throw new Error(`fileFetchText: only file:// URLs are supported in tests, got "${url}"`);
  }
  return fs.readFile(fileURLToPath(url), "utf8");
}
