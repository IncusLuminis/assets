import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { validateManifestShape } from "../../src/runtime/contract/validateManifest.ts";
import { validateManifest, listFixtures, loadFixture, formatErrors } from "../helpers/validator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureHudManifestPath = path.resolve(
  __dirname,
  "..",
  "..",
  "library",
  "themes",
  "fixture-hud",
  "manifest.json"
);

/**
 * Structural sanity proof for Story #8 AC 1: "TS types ... are checked
 * against manifest.schema.json ... at minimum, write a test that validates
 * a schema-valid fixture manifest also type-checks as your Manifest TS
 * type." `validateManifestShape`'s declared return type is `Manifest`
 * (`src/runtime/contract/manifest.ts`); `npm run typecheck` fails if that
 * signature does not compile, and this test proves a real, independently
 * schema-valid manifest is accepted by it at runtime -- structural sanity,
 * not codegen (no generator ties the two together, so this is the check
 * that stands in for one).
 */
describe("contract/manifest.ts Manifest type vs registry/schemas/manifest.schema.json", () => {
  it("the fixture-hud manifest is schema-valid (ajv) AND accepted by validateManifestShape() (Manifest-typed)", () => {
    const raw = JSON.parse(fs.readFileSync(fixtureHudManifestPath, "utf8"));

    const schemaOk = validateManifest(raw);
    expect(schemaOk, formatErrors(validateManifest.errors)).toBe(true);

    const manifest = validateManifestShape(raw, "fixture-hud", "0.1.0");
    expect(manifest.id).toBe("fixture-hud");
    expect(manifest.engine).toBe("css");
    expect(manifest.variants).toEqual(["maxi", "mini", "micro"]);
    expect(manifest.orientations).toEqual(["landscape", "portrait"]);
    expect(manifest.compositions["maxi:landscape"].supported).toBe(true);
    expect(manifest.entrypoints["maxi:landscape"]?.markup).toBe("maxi/landscape/hud.html");
  });

  describe("every #3 schema-valid manifest fixture also passes validateManifestShape()", () => {
    for (const file of listFixtures("valid")) {
      it(`fixtures/valid/${file}`, () => {
        const raw = loadFixture("valid", file);
        expect(validateManifest(raw), formatErrors(validateManifest.errors)).toBe(true);
        expect(() => validateManifestShape(raw, raw.id ?? "unknown", raw.version ?? "0.0.0")).not.toThrow();
      });
    }
  });

  it("rejects a manifest missing required fields with a ManifestInvalid-flavoured message", () => {
    expect(() => validateManifestShape({}, "some-theme", "1.0.0")).toThrow(/schemaVersion/);
  });

  it("rejects the removed `ratios` field the same way as the schema/Contract §3.3 -- an unrecognised manifest is still structurally invalid", () => {
    const raw = JSON.parse(fs.readFileSync(fixtureHudManifestPath, "utf8"));
    delete raw.variants;
    expect(() => validateManifestShape(raw, "fixture-hud", "0.1.0")).toThrow(/variants/);
  });
});
