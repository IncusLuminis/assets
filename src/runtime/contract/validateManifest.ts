/**
 * Runtime-side manifest validation (HUD Theme Contract 1.0 §12 step 5:
 * "manifest validation -- against manifest.schema.json + this Contract's §3
 * rules").
 *
 * DOCUMENTED INTERPRETATION: this is a hand-written structural check
 * mirroring the required-field / type / enum rules from Contract §3 -- it
 * does NOT load and re-run `registry/schemas/manifest.schema.json` through
 * ajv inside the Runtime. Full JSON-Schema conformance (Contract §19) is
 * already enforced once, at publication time, by this repo's own build/
 * validate tooling and Story #3's ajv-based test suite
 * (`tests/helpers/validator.js`). Re-validating the same schema a second
 * time inside the browser-shipped Runtime bundle would mean bundling ajv
 * (tens of KB) into every consumer page to re-check something the Registry
 * has already guaranteed for anything it actually serves -- for a manifest
 * that did NOT come through that pipeline (e.g. a hand-edited local Theme
 * source during development), this function still catches the shapes that
 * would make `Hud`/`ThemeResolver` unsafe to destructure. Flagged here for
 * an owner/human call if live full-schema re-validation in the Runtime is
 * actually wanted for 0.1.
 */

import type { Manifest } from "./manifest.js";
import { COMPOSITION_KEYS, ORIENTATIONS, VARIANTS } from "./variants.js";
import { ManifestInvalidError } from "./errors.js";

const ENGINES = ["svg", "css", "video", "static", "gadget"];
const ISOLATIONS = ["scoped-root", "shadow-dom", "shadow-dom-preferred", "iframe"];
const REQUIRED_STRING_FIELDS = [
  "schemaVersion",
  "contractVersion",
  "id",
  "name",
  "version",
  "engine",
  "baseVersion",
  "isolation"
];

export function validateManifestShape(raw: unknown, theme: string, version: string): Manifest {
  const errors: string[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new ManifestInvalidError(theme, version, "manifest is not a JSON object");
  }
  const m = raw as Record<string, unknown>;

  for (const key of REQUIRED_STRING_FIELDS) {
    if (typeof m[key] !== "string" || m[key] === "") {
      errors.push(`"${key}" is required and must be a non-empty string`);
    }
  }

  if (typeof m.engine === "string" && !ENGINES.includes(m.engine)) {
    errors.push(`"engine" must be one of ${ENGINES.join(", ")}, got "${m.engine}"`);
  }
  if (typeof m.isolation === "string" && !ISOLATIONS.includes(m.isolation)) {
    errors.push(`"isolation" must be one of ${ISOLATIONS.join(", ")}, got "${m.isolation}"`);
  }

  if (!Array.isArray(m.variants) || !VARIANTS.every((v) => (m.variants as unknown[]).includes(v))) {
    errors.push(`"variants" must include all of ${VARIANTS.join(", ")} (Contract §7.1)`);
  }
  if (
    !Array.isArray(m.orientations) ||
    !ORIENTATIONS.every((o) => (m.orientations as unknown[]).includes(o))
  ) {
    errors.push(`"orientations" must include all of ${ORIENTATIONS.join(", ")} (Contract §8.2)`);
  }

  let compositions: Record<string, { supported?: unknown } | undefined> | undefined;
  if (typeof m.compositions !== "object" || m.compositions === null) {
    errors.push('"compositions" is required and must be an object');
  } else {
    compositions = m.compositions as Record<string, { supported?: unknown } | undefined>;
    for (const key of COMPOSITION_KEYS) {
      const entry = compositions[key];
      if (typeof entry !== "object" || entry === null) {
        errors.push(`compositions["${key}"] is required`);
        continue;
      }
      const c = entry as Record<string, unknown>;
      if (typeof c.supported !== "boolean") {
        errors.push(`compositions["${key}"].supported must be a boolean`);
      } else if (c.supported && typeof c.dir !== "string") {
        errors.push(`compositions["${key}"].dir is required when supported is true`);
      } else if (!c.supported && typeof c.reason !== "string") {
        errors.push(`compositions["${key}"].reason is required when supported is false`);
      }
    }
  }

  const slots = m.slots as { required?: unknown; optional?: unknown } | undefined;
  if (
    typeof m.slots !== "object" ||
    m.slots === null ||
    !Array.isArray(slots?.required) ||
    !Array.isArray(slots?.optional)
  ) {
    errors.push('"slots" is required and must be { required: string[], optional: string[] }');
  }

  if (typeof m.capabilities !== "object" || m.capabilities === null || Array.isArray(m.capabilities)) {
    errors.push('"capabilities" is required and must be an object');
  }

  if (typeof m.entrypoints !== "object" || m.entrypoints === null) {
    errors.push('"entrypoints" is required and must be an object');
  } else if (compositions) {
    const entrypoints = m.entrypoints as Record<string, unknown>;
    for (const key of COMPOSITION_KEYS) {
      const supported = compositions[key]?.supported === true;
      const entry = entrypoints[key];
      if (supported) {
        if (typeof entry !== "object" || entry === null) {
          errors.push(`entrypoints["${key}"] is required because compositions["${key}"].supported is true`);
        } else {
          const e = entry as Record<string, unknown>;
          if (!Array.isArray(e.styles)) errors.push(`entrypoints["${key}"].styles must be an array`);
          if (typeof e.markup !== "string" || e.markup === "")
            errors.push(`entrypoints["${key}"].markup is required`);
          if (!Array.isArray(e.scripts)) errors.push(`entrypoints["${key}"].scripts must be an array`);
        }
      } else if (entry !== undefined) {
        errors.push(
          `entrypoints["${key}"] MUST NOT be present because compositions["${key}"].supported is false (Contract §3.10)`
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new ManifestInvalidError(theme, version, errors.join("; "));
  }

  return m as unknown as Manifest;
}
