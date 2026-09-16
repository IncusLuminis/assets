/**
 * Unit tests for `RegistryThemeSource` (Story #16) -- the Registry/CDN-backed
 * `ThemeSource` that fetches `registry/index.json` and per-Theme
 * manifest.json files over HTTP (Contract §12 steps 2-4, §2.2 package
 * layout). `global.fetch` is fully mocked throughout; no real network call
 * is ever made (matches this repo's existing convention, e.g.
 * `tests/unit/hud-01-e2e.test.js`'s `vi.stubGlobal("fetch", ...)` usage).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { RegistryThemeSource } from "../../src/runtime/registry/RegistryThemeSource.ts";
import {
  ThemeNotFoundError,
  VersionNotFoundError,
  RegistryUnavailableError
} from "../../src/runtime/contract/errors.ts";

const BASE_URL = "https://example.invalid/";

const REGISTRY_INDEX = {
  schemaVersion: "1.0",
  themes: [
    {
      id: "hud-01",
      latest: "0.2.0",
      manifest: "/themes/hud-01/0.2.0/manifest.json",
      versions: [
        {
          version: "0.1.0",
          manifest: "/themes/hud-01/0.1.0/manifest.json",
          package: "/themes/hud-01/0.1.0/"
        },
        {
          version: "0.2.0",
          manifest: "/themes/hud-01/0.2.0/manifest.json",
          package: "/themes/hud-01/0.2.0/"
        }
      ]
    }
  ]
};

const SAMPLE_MANIFEST = { schemaVersion: "1.0", id: "hud-01", version: "0.2.0" };

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Not OK",
    json: async () => body
  };
}

function invalidJsonResponse(status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "OK",
    json: async () => {
      throw new SyntaxError("Unexpected token in JSON");
    }
  };
}

/** Routes a mocked `fetch` by URL suffix -- `handlers` maps a substring to a response-producing function. */
function fetchRouter(handlers) {
  return vi.fn(async (url) => {
    for (const [substr, respond] of handlers) {
      if (url.includes(substr)) return respond();
    }
    throw new Error(`unmapped fetch in test: ${url}`);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RegistryThemeSource#resolveVersion", () => {
  it('"latest" resolves to the entry\'s latest field', async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter([["registry/index.json", () => jsonResponse(200, REGISTRY_INDEX)]])
    );
    const source = new RegistryThemeSource(BASE_URL);
    await expect(source.resolveVersion("hud-01", "latest")).resolves.toBe("0.2.0");
  });

  it("an explicit matching version resolves to itself", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter([["registry/index.json", () => jsonResponse(200, REGISTRY_INDEX)]])
    );
    const source = new RegistryThemeSource(BASE_URL);
    await expect(source.resolveVersion("hud-01", "0.1.0")).resolves.toBe("0.1.0");
  });

  it("an explicit non-matching version rejects with VersionNotFoundError", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter([["registry/index.json", () => jsonResponse(200, REGISTRY_INDEX)]])
    );
    const source = new RegistryThemeSource(BASE_URL);
    await expect(source.resolveVersion("hud-01", "9.9.9")).rejects.toBeInstanceOf(VersionNotFoundError);
  });

  it("an unknown theme id rejects with ThemeNotFoundError", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter([["registry/index.json", () => jsonResponse(200, REGISTRY_INDEX)]])
    );
    const source = new RegistryThemeSource(BASE_URL);
    await expect(source.resolveVersion("no-such-theme", "latest")).rejects.toBeInstanceOf(ThemeNotFoundError);
  });
});

describe("RegistryThemeSource#loadManifest", () => {
  it("success returns the parsed manifest JSON", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter([
        ["registry/index.json", () => jsonResponse(200, REGISTRY_INDEX)],
        ["themes/hud-01/0.2.0/manifest.json", () => jsonResponse(200, SAMPLE_MANIFEST)]
      ])
    );
    const source = new RegistryThemeSource(BASE_URL);
    await expect(source.loadManifest("hud-01", "0.2.0")).resolves.toEqual(SAMPLE_MANIFEST);
  });

  it("registry index fetch throwing at the network level rejects with RegistryUnavailableError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("network down");
      })
    );
    const source = new RegistryThemeSource(BASE_URL);
    await expect(source.loadManifest("hud-01", "0.2.0")).rejects.toBeInstanceOf(RegistryUnavailableError);
  });

  it("registry index fetch returning a non-ok status rejects with RegistryUnavailableError", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter([["registry/index.json", () => jsonResponse(500, {})]])
    );
    const source = new RegistryThemeSource(BASE_URL);
    await expect(source.loadManifest("hud-01", "0.2.0")).rejects.toBeInstanceOf(RegistryUnavailableError);
  });

  it("registry index fetch returning invalid JSON rejects with RegistryUnavailableError", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter([["registry/index.json", () => invalidJsonResponse(200)]])
    );
    const source = new RegistryThemeSource(BASE_URL);
    await expect(source.loadManifest("hud-01", "0.2.0")).rejects.toBeInstanceOf(RegistryUnavailableError);
  });

  it("a 404 on the manifest fetch (registry claims the version exists, CDN does not) rejects with VersionNotFoundError", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter([
        ["registry/index.json", () => jsonResponse(200, REGISTRY_INDEX)],
        ["manifest.json", () => jsonResponse(404, {})]
      ])
    );
    const source = new RegistryThemeSource(BASE_URL);
    await expect(source.loadManifest("hud-01", "0.2.0")).rejects.toBeInstanceOf(VersionNotFoundError);
  });

  it("a network-level failure on the manifest fetch rejects with RegistryUnavailableError", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter([
        ["registry/index.json", () => jsonResponse(200, REGISTRY_INDEX)],
        [
          "manifest.json",
          () => {
            throw new TypeError("network down");
          }
        ]
      ])
    );
    const source = new RegistryThemeSource(BASE_URL);
    await expect(source.loadManifest("hud-01", "0.2.0")).rejects.toBeInstanceOf(RegistryUnavailableError);
  });

  it("a non-ok (non-404) manifest response rejects with RegistryUnavailableError", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter([
        ["registry/index.json", () => jsonResponse(200, REGISTRY_INDEX)],
        ["manifest.json", () => jsonResponse(503, {})]
      ])
    );
    const source = new RegistryThemeSource(BASE_URL);
    await expect(source.loadManifest("hud-01", "0.2.0")).rejects.toBeInstanceOf(RegistryUnavailableError);
  });

  it("invalid JSON in the manifest response rejects with RegistryUnavailableError", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter([
        ["registry/index.json", () => jsonResponse(200, REGISTRY_INDEX)],
        ["manifest.json", () => invalidJsonResponse(200)]
      ])
    );
    const source = new RegistryThemeSource(BASE_URL);
    await expect(source.loadManifest("hud-01", "0.2.0")).rejects.toBeInstanceOf(RegistryUnavailableError);
  });
});

describe("RegistryThemeSource#assetBaseUrl", () => {
  it("throws a plain Error if called before resolveVersion()/loadManifest() has run", () => {
    const source = new RegistryThemeSource(BASE_URL);
    expect(() => source.assetBaseUrl("hud-01", "0.2.0")).toThrow(Error);
    expect(() => source.assetBaseUrl("hud-01", "0.2.0")).not.toThrow(VersionNotFoundError);
  });

  it("after a successful resolveVersion()+loadManifest(), returns the correct absolute URL built from the entry's package path", async () => {
    vi.stubGlobal(
      "fetch",
      fetchRouter([
        ["registry/index.json", () => jsonResponse(200, REGISTRY_INDEX)],
        ["manifest.json", () => jsonResponse(200, SAMPLE_MANIFEST)]
      ])
    );
    const source = new RegistryThemeSource(BASE_URL);
    await source.resolveVersion("hud-01", "0.2.0");
    await source.loadManifest("hud-01", "0.2.0");
    expect(source.assetBaseUrl("hud-01", "0.2.0")).toBe("https://example.invalid/themes/hud-01/0.2.0/");
  });
});

describe("RegistryThemeSource registry index caching", () => {
  it("fetches the registry index only once across multiple calls", async () => {
    const fetchMock = fetchRouter([
      ["registry/index.json", () => jsonResponse(200, REGISTRY_INDEX)],
      ["manifest.json", () => jsonResponse(200, SAMPLE_MANIFEST)]
    ]);
    vi.stubGlobal("fetch", fetchMock);
    const source = new RegistryThemeSource(BASE_URL);

    await source.resolveVersion("hud-01", "latest");
    await source.resolveVersion("hud-01", "0.1.0");
    await source.loadManifest("hud-01", "0.2.0");

    const indexFetches = fetchMock.mock.calls.filter(([url]) => url.includes("registry/index.json"));
    expect(indexFetches).toHaveLength(1);
  });

  it("does NOT cache a failed registry index fetch -- a subsequent call retries the network", async () => {
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        if (url.includes("registry/index.json")) {
          call += 1;
          if (call === 1) {
            throw new TypeError("network down");
          }
          return jsonResponse(200, REGISTRY_INDEX);
        }
        throw new Error(`unmapped fetch in test: ${url}`);
      })
    );
    const source = new RegistryThemeSource(BASE_URL);

    await expect(source.resolveVersion("hud-01", "latest")).rejects.toBeInstanceOf(RegistryUnavailableError);
    expect(call).toBe(1);

    await expect(source.resolveVersion("hud-01", "latest")).resolves.toBe("0.2.0");
    expect(call).toBe(2);
  });
});
