import { describe, it, expect } from "vitest";
import { validateManifest, loadFixture, listFixtures, formatErrors } from "../helpers/validator.js";
import { semanticCheck } from "../helpers/semantics.js";

describe("registry/schemas/manifest.schema.json -- structural (ajv) validation", () => {
  describe("valid fixtures all pass", () => {
    for (const file of listFixtures("valid")) {
      it(`fixtures/valid/${file}`, () => {
        const manifest = loadFixture("valid", file);
        const ok = validateManifest(manifest);
        expect(ok, formatErrors(validateManifest.errors)).toBe(true);
      });
    }
  });

  describe("invalid fixtures are all rejected", () => {
    for (const file of listFixtures("invalid")) {
      it(`fixtures/invalid/${file}`, () => {
        const manifest = loadFixture("invalid", file);
        const ok = validateManifest(manifest);
        expect(ok).toBe(false);
        expect(validateManifest.errors.length).toBeGreaterThan(0);
      });
    }
  });

  it("rejects an entirely empty object with actionable, path-pointing errors", () => {
    const ok = validateManifest({});
    expect(ok).toBe(false);
    const missing = validateManifest.errors
      .filter((e) => e.keyword === "required")
      .map((e) => e.params.missingProperty);
    expect(missing).toEqual(
      expect.arrayContaining([
        "schemaVersion", "contractVersion", "id", "name", "version",
        "engine", "baseVersion", "variants", "orientations", "compositions",
        "slots", "capabilities", "entrypoints", "isolation"
      ])
    );
  });

  it("error messages point at a JSON path (instancePath), not just a bare boolean", () => {
    const manifest = loadFixture("invalid", "id-invalid-pattern.json");
    validateManifest(manifest);
    const idError = validateManifest.errors.find((e) => e.instancePath === "/id");
    expect(idError).toBeTruthy();
  });
});

describe("semantic (cross-field) validation layered on top of the schema", () => {
  describe("valid fixtures produce no semantic errors", () => {
    for (const file of listFixtures("valid")) {
      it(`fixtures/valid/${file}`, () => {
        const manifest = loadFixture("valid", file);
        const { errors } = semanticCheck(manifest);
        expect(errors, errors.join("\n")).toEqual([]);
      });
    }
  });

  it("flags the reserved-engine fixture as a warning, not an error", () => {
    const manifest = loadFixture("valid", "reserved-engine-warning.json");
    // Schema-valid: reserved engines are accepted enum values (Contract §5.2).
    expect(validateManifest(manifest)).toBe(true);
    const { errors, warnings } = semanticCheck(manifest);
    expect(errors).toEqual([]);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toMatch(/reserved-but-unsupported/);
  });

  describe("semantic-invalid fixtures are schema-valid but semantically rejected", () => {
    for (const file of listFixtures("semantic-invalid")) {
      it(`fixtures/semantic-invalid/${file}`, () => {
        const manifest = loadFixture("semantic-invalid", file);
        // Proves these exercise the semantic layer specifically: the schema
        // alone accepts them structurally.
        expect(validateManifest(manifest), formatErrors(validateManifest.errors)).toBe(true);
        const { errors } = semanticCheck(manifest);
        expect(errors.length).toBeGreaterThan(0);
      });
    }
  });
});
