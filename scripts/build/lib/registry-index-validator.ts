/**
 * ajv-based validator for `registry/schemas/registry-index.schema.json`,
 * used by `build-registry.ts` to validate its own generated output before
 * writing `registry/index.json` (Story #1 AC: "the generated index
 * validates against it").
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// See lib/manifest-validator.ts's header comment for why this is
// `createRequire` + a `typeof import(...)` annotation rather than a plain
// ESM default import (a known ajv/TypeScript NodeNext typing gap).
const require = createRequire(import.meta.url);
const Ajv2020: typeof import("ajv/dist/2020.js").default = require("ajv/dist/2020.js").default;
const addFormats: typeof import("ajv-formats").default = require("ajv-formats").default;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_INDEX_SCHEMA_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "registry",
  "schemas",
  "registry-index.schema.json"
);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

type AjvValidateFn = ((data: unknown) => boolean) & {
  errors?: Array<{ instancePath: string; message?: string; params: unknown }> | null;
};

let cachedValidate: AjvValidateFn | null = null;

function getRegistryIndexValidator(): AjvValidateFn {
  if (cachedValidate) return cachedValidate;
  const schema = JSON.parse(fs.readFileSync(REGISTRY_INDEX_SCHEMA_PATH, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  cachedValidate = ajv.compile(schema) as AjvValidateFn;
  return cachedValidate;
}

function formatAjvErrors(errors: AjvValidateFn["errors"]): string[] {
  return (errors ?? []).map(
    (e) => `${e.instancePath || "(root)"} ${e.message ?? ""} ${JSON.stringify(e.params)}`
  );
}

/** Validates `index` against `registry/schemas/registry-index.schema.json`. */
export function validateRegistryIndex(index: unknown): ValidationResult {
  const validate = getRegistryIndexValidator();
  const valid = validate(index);
  return { valid, errors: valid ? [] : formatAjvErrors(validate.errors) };
}
