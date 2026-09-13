# src/tooling/

Reserved for shared TypeScript helpers consumed by the scripts under
`scripts/{build,validate,deploy,maintenance}/` — e.g. manifest loading,
package-path resolution, logging — so those scripts don't duplicate logic
(Plan §3, Architecture §7).

Deliberately empty in Story #5. Populated as `scripts/` gains real build /
validate / deploy / maintenance tooling (#1, #7, and downstream Stories that
need it).
