import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, "../../registry/schemas/manifest.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

// strict: true keeps ajv's schema-quality lint on (catches typos, unreachable
// keywords, etc). strictRequired is turned off specifically: several of this
// schema's cross-field `if`/`then` blocks (Contract §27.8 rule 6) express
// "entrypoints must/must not contain key X" via a `required`/`not.required`
// on a bare `{ "<key>": {...} }` object without repeating that key's full
// schema locally (its real schema lives once, under the top-level
// `properties.entrypoints.properties`) -- perfectly valid, standard JSON
// Schema, but ajv's strictRequired heuristic flags it as a possible typo.
// This does not relax anything a non-ajv, spec-compliant validator would
// enforce differently.
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
addFormats(ajv);

export const validateManifest = ajv.compile(schema);

export function loadFixture(...segments) {
  const p = path.resolve(__dirname, "..", "fixtures", ...segments);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function listFixtures(...segments) {
  const dir = path.resolve(__dirname, "..", "fixtures", ...segments);
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
}

export function formatErrors(errors) {
  return (errors ?? [])
    .map((e) => `${e.instancePath || "(root)"} ${e.message} ${JSON.stringify(e.params)}`)
    .join("\n");
}
