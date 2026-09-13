# scripts/validate/

Reserved for publish-time validation tooling: `validate-theme.ts` (a Theme
package against the Contract §19 minimum checklist), `validate-manifest.ts`
(a `manifest.json` against `registry/schemas/manifest.schema.json` — the
`ajv`-based check this repo's own test suite already exercises via
`tests/helpers/validator.js`, wired here as a standalone CLI), and
`validate-registry.ts` (`registry/index.json` once it exists, Story #1).

Deliberately empty as standalone CLI tools in Story #5 — the validation
*logic* already exists and is proven by the Vitest suite
(`tests/unit/manifest.schema.test.js`, `tests/unit/library-fixture-theme.test.js`);
wrapping it as a `scripts/validate/*.ts` CLI is left to whichever Story first
needs it invoked outside of tests (likely #1 or #7).
