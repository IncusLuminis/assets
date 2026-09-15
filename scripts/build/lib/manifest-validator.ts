/**
 * ajv-based validator for `registry/schemas/manifest.schema.json`, used by
 * the build pipeline (`build-theme.ts`, `build-registry.ts`) to fail closed
 * on an invalid Theme manifest (Story #1 AC; Arch §49).
 *
 * Deliberately independent of `tests/helpers/validator.js` -- that helper is
 * test-only scaffolding (fixtures, `formatErrors`) and production build
 * tooling under `scripts/build/` should not import from `tests/`. The ajv
 * configuration here is kept identical to `tests/helpers/validator.js`'s
 * (same `strict`/`strictRequired` rationale -- see that file's comment) so
 * both surfaces validate manifests the same way.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// ajv/ajv-formats ship CJS output that reassigns `module.exports` to the
// callable/constructable value itself (`module.exports = exports =
// Ajv2020;`), with `.default` bolted on only for interop compatibility.
// Real Node ESM-importing-CJS binds a default import to that whole
// `module.exports` value, so `import Ajv2020 from "ajv/dist/2020.js"`
// resolves *correctly at runtime* -- but under `module`/`moduleResolution:
// NodeNext` from a genuinely-ESM file (this repo's root package.json sets
// `"type": "module"`), tsc's static *type* for that default import is the
// whole CJS module's declared namespace shape (matching its .d.ts, which
// declares a separate `default` property), not `typeof Ajv2020` -- a known
// ajv/TypeScript NodeNext typing gap, distinct from (and not fixable by)
// this repo's own `esModuleInterop` setting. `tests/helpers/validator.js`
// (plain JS, not type-checked) doesn't hit this; `npm run typecheck` does.
// Loading via `createRequire` + an explicit `typeof import(...)` type
// annotation sidesteps the gap: the runtime value is unaffected (same CJS
// `require()` Node would do internally either way), and the type is taken
// directly from the declared `.default` export.
const require = createRequire(import.meta.url);
const Ajv2020: typeof import("ajv/dist/2020.js").default = require("ajv/dist/2020.js").default;
const addFormats: typeof import("ajv-formats").default = require("ajv-formats").default;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_SCHEMA_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "registry",
  "schemas",
  "manifest.schema.json"
);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

type AjvValidateFn = ((data: unknown) => boolean) & {
  errors?: Array<{ instancePath: string; message?: string; params: unknown }> | null;
};

let cachedValidate: AjvValidateFn | null = null;

function getManifestValidator(): AjvValidateFn {
  if (cachedValidate) return cachedValidate;
  const schema = JSON.parse(fs.readFileSync(MANIFEST_SCHEMA_PATH, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  cachedValidate = ajv.compile(schema) as AjvValidateFn;
  return cachedValidate;
}

function formatAjvErrors(errors: AjvValidateFn["errors"]): string[] {
  return (errors ?? []).map(
    (e) => `${e.instancePath || "(root)"} ${e.message ?? ""} ${JSON.stringify(e.params)}`
  );
}

/** Validates `manifest` against `registry/schemas/manifest.schema.json`. */
export function validateManifestAgainstSchema(manifest: unknown): ValidationResult {
  const validate = getManifestValidator();
  const valid = validate(manifest);
  return { valid, errors: valid ? [] : formatAjvErrors(validate.errors) };
}
