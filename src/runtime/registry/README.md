# src/runtime/registry/

Reserved for `RegistryClient.ts` — the Runtime-side client that fetches
`registry/index.json` (discovery metadata) and resolves a Theme `id` +
`version` to a published package URL (Architecture §27–29, Contract §12).

Deliberately empty in Story #5 (repo scaffold only). Populated by Story
**#8** (Runtime logic). Registry *index generation* (the build-side tooling
that produces `registry/index.json`) is a separate concern — Story **#1** —
and lives under `scripts/build/`, not here.
