/**
 * Semantic (cross-field) checks layered on top of JSON Schema validation.
 *
 * These rules from HUD Theme Contract 1.0 §27.8 reference dynamic keys across
 * two different array/object fields (e.g. "every slot name is either standard
 * or registered as a customSlot", "an external host is on the allowlist OR
 * justified by a knownDeviations entry") and are not expressible in plain
 * JSON Schema without bespoke keywords. Per the Story #3 brief, they are
 * wired into the test suite instead of the schema file itself, so
 * registry/schemas/manifest.schema.json stays consumable by any standard
 * draft 2020-12 validator.
 *
 * See registry/schemas/README.md for the split between what the schema
 * enforces structurally and what this module enforces semantically.
 */

export const STANDARD_SLOTS = [
  "title", "subtitle", "status", "primary", "secondary",
  "media", "visualization", "controls", "content", "footer"
];

// Contract §16.2 -- the fixed host set Themes may load from without
// per-Theme externalResources declaration.
export const ALLOWLISTED_HOSTS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "aladin.cds.unistra.fr",
  "simbad.cds.unistra.fr",
  "vizier.cds.unistra.fr",
  "ui.adsabs.harvard.edu",
  "app.heygen.com",
  "www.youtube.com",
  "player.vimeo.com"
];

// Contract §10.3 -- each dataSource provider's single canonical host.
export const DATA_SOURCE_PROVIDER_HOSTS = {
  simbad: "simbad.cds.unistra.fr",
  vizier: "vizier.cds.unistra.fr",
  ads: "ui.adsabs.harvard.edu"
};

// Contract §5.1 -- reserved-but-unsupported engine values (schema-valid, but
// no 1.0 Runtime can mount them; §19.1 requires a WARN, not a rejection).
export const RESERVED_ENGINES = ["video", "static", "gadget"];

/**
 * Runs every semantic rule against an already schema-valid manifest object.
 * Returns { errors: string[], warnings: string[] }. `errors` mirrors what a
 * strict publication validator (Contract §19) would reject; `warnings` are
 * SHOULD-level or explicitly non-blocking per the Contract.
 */
export function semanticCheck(manifest) {
  const errors = [];
  const warnings = [];

  // Rule: slots.required ∩ slots.optional === ∅ (§27.8 rule 7).
  const required = manifest.slots?.required ?? [];
  const optional = manifest.slots?.optional ?? [];
  const overlap = required.filter((s) => optional.includes(s));
  if (overlap.length > 0) {
    errors.push(
      `slots.required and slots.optional overlap on: ${overlap.join(", ")} (Contract §27.8 rule 7 -- required ∩ optional must be empty)`
    );
  }

  // Rule: every slot name is standard or declared in customSlots[] (§9.4, §27.8 rule 7).
  const customNames = new Set((manifest.customSlots ?? []).map((c) => c.name));
  for (const slotList of [["slots.required", required], ["slots.optional", optional]]) {
    const [label, names] = slotList;
    for (const name of names) {
      if (!STANDARD_SLOTS.includes(name) && !customNames.has(name)) {
        errors.push(
          `${label} references "${name}", which is neither a standard slot (Contract §27.9) nor declared in customSlots[] (Contract §9.4)`
        );
      }
    }
  }

  // Rule: externalResources / dataSource / mediaEmbed hosts on the §16.2
  // allowlist, or justified by a knownDeviations entry that scopes to "all"
  // or names the host in its scope/note. NOTE: the Contract's closed
  // knownDeviations code enum (§22.3) has no code that specifically means
  // "external host outside the allowlist" -- see registry/schemas/README.md
  // "Contract gaps flagged" for why this match is a best-effort heuristic
  // rather than a specific recognised code (none exists to check against).
  const deviations = manifest.knownDeviations ?? [];
  const hostJustifiedByDeviation = (host) =>
    deviations.some(
      (d) => d.scope === "all" || d.scope?.includes(host) || d.note?.includes(host)
    );
  const allHosts = [
    ...(manifest.externalResources ?? []).map((r) => r.host),
    ...(manifest.capabilities?.dataSource?.hosts ?? []),
    ...(manifest.capabilities?.mediaEmbed?.hosts ?? [])
  ];
  for (const host of allHosts) {
    if (!ALLOWLISTED_HOSTS.includes(host) && !hostJustifiedByDeviation(host)) {
      errors.push(
        `host "${host}" is not on the Contract §16.2 allowlist and no knownDeviations entry justifies it`
      );
    }
  }

  // Rule: dataSource.hosts must correspond to the *declared* providers, not
  // just be any allowlisted dataSource host (Contract §10.3, §27.8 rule 11).
  const dataSource = manifest.capabilities?.dataSource;
  if (dataSource) {
    const allowedForDeclaredProviders = new Set(
      (dataSource.providers ?? []).map((p) => DATA_SOURCE_PROVIDER_HOSTS[p]).filter(Boolean)
    );
    for (const host of dataSource.hosts ?? []) {
      if (!allowedForDeclaredProviders.has(host)) {
        errors.push(
          `capabilities.dataSource.hosts includes "${host}", which does not correspond to a provider in capabilities.dataSource.providers (Contract §10.3)`
        );
      }
    }
  }

  // Rule (bonus, not separately numbered in §27.8 but implied by §11.1):
  // capabilities.modes.default must be one of capabilities.modes.values.
  const modes = manifest.capabilities?.modes;
  if (modes && !modes.values?.includes(modes.default)) {
    errors.push(
      `capabilities.modes.default "${modes.default}" is not in capabilities.modes.values [${(modes.values ?? []).join(", ")}]`
    );
  }

  // Rule: reserved engine => WARN, not fail (Contract §5.2, §19.1 rule 8).
  if (RESERVED_ENGINES.includes(manifest.engine)) {
    warnings.push(
      `engine "${manifest.engine}" is reserved-but-unsupported in 1.0 -- no 1.0 Runtime can mount this Theme (Contract §5.2)`
    );
  }

  return { errors, warnings };
}
