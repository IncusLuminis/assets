# scripts/deploy/

`deploy-registry.sh` publishes a validated `dist/` build (from
`npm run build:all`, Story #1/#5) plus the committed `registry/index.json`
to the existing Cloudflare Pages project named **`assets`**
(`https://assets-4gy.pages.dev/` — the project's custom pages.dev subdomain
differs from its project name; see "Project name vs. published domain"
below). It is modelled directly on the sibling
`scripts/deploy_gadgets_media.sh` (Plan §2 decision 6): a gitignored staging
directory, a direct `wrangler pages deploy` upload, no GitHub-connected
Pages project, content-hashed incremental upload. Reuses existing CDN
infrastructure deliberately — no new Cloudflare Pages/CDN target is stood
up for this repo.

See the script's own header comment for the full build → validate → stage
→ deploy → verify pipeline design, and `verify.mjs`'s header for the
post-deploy verification design.

## Real-deploy prerequisites (DevOps / human operator)

Before running a **real** (non-`--dry-run`) deploy:

1. **The `assets` Cloudflare Pages project must already exist.** It does —
   confirmed by the owner (Implementation Plan §7 Q1). This tooling does
   not create it; `wrangler pages deploy` publishes *into* an existing
   project, it does not provision one.
2. **`wrangler` must be authenticated on the run host** (`wrangler login`,
   or `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` in the environment),
   with access to the Cloudflare account that owns the `assets` project —
   same assumption `scripts/deploy_gadgets_media.sh` makes. This script does
   not perform or check authentication itself; an unauthenticated `wrangler`
   invocation will simply fail at the deploy step with wrangler's own error.
   Note also that `wrangler pages deploy`/`project list` refuse to run in a
   non-interactive shell without `CLOUDFLARE_API_TOKEN` set, even with a
   valid cached OAuth login — run this from a genuinely interactive
   terminal (a real Terminal.app/iTerm window), not from a subprocess/CI
   shell, unless `CLOUDFLARE_API_TOKEN` is exported. If the account has more
   than one Cloudflare account under the same login, also pin
   `CLOUDFLARE_ACCOUNT_ID` explicitly rather than relying on whichever
   account `wrangler` resolves by default — an unpinned account can differ
   between runs and has, in practice, caused `wrangler` to not find the
   `assets` project and offer to create a stray duplicate instead.
3. **`npm install` has been run** in this repo (build tooling
   dependencies — esbuild, ajv, etc.).
4. Run from the repo root (or anywhere — the script resolves its own repo
   root from its own location, unless `--repo-root=` is passed).

### Project name vs. published domain

The Cloudflare Pages **project name** is `assets`; its **pages.dev
subdomain** is `assets-4gy.pages.dev` — Cloudflare allows these to differ,
and here they do. `--project-name` (this script's `$PROJECT_NAME`,
`wrangler.toml`'s `name`) must always be `assets`, never `assets-4gy`:
passing `assets-4gy` makes `wrangler` look for a project literally *named*
`assets-4gy`, which does not exist, and it will offer to create one
interactively. Because pages.dev subdomains are unique **platform-wide**
(not just within this Cloudflare account), each such accidental creation
collides on the subdomain and gets a random suffix instead of erroring —
this happened twice during the 2026-09-16 rollout (`assets-4gy` project →
`assets-4gy-e40.pages.dev`, then `assets-4gy-e40` project →
`assets-4gy-e40-7o7.pages.dev`), leaving two stray empty duplicate projects
that need manual cleanup (`wrangler pages project delete <name>`) — they
are not part of the real deploy target and nothing publishes to them.

## Invoking it

```sh
# Sanity-check first: clean + build + validate + stage, print the exact
# wrangler command and verify plan, and stop. No network call, no wrangler
# invocation, no Cloudflare credentials touched — safe to run any time.
scripts/deploy/deploy-registry.sh --dry-run

# The real thing: clean -> build -> validate -> stage -> DEPLOY -> verify.
# Publishes to https://assets-4gy.pages.dev/, tagged as the Cloudflare
# Pages "main" (production) deployment branch label by default -- pass
# --branch=<name> to publish a preview instead. This is a Pages deployment
# label only; it never touches or merges this repo's own git branches.
scripts/deploy/deploy-registry.sh
```

A real run:

1. **cleans** `dist/themes/` and `dist/runtime/` before rebuilding, so any
   stale/bogus directory left over from a previous local run (a
   half-finished experiment, a renamed/removed Theme's leftover output)
   can never survive into the build, the registry index, or the deploy —
   required for "reproducible deployment from repository state alone"
   (Arch §33);
2. runs `npm run build:all` (aborts here, before touching anything else, on
   any build/manifest-validation failure);
3. stages an **allowlist-only** copy — `dist/themes/`, `dist/runtime/`, and
   the repo-root `registry/index.json` — into gitignored `.deploy/`
   (nothing else from `dist/` or the repo can reach the CDN, Arch §44);
4. runs `wrangler pages deploy .deploy --project-name assets --branch main
   --commit-dirty=true` (a real, outward-facing Cloudflare publish, tagged
   as the production branch label so it serves from the bare
   `https://assets-4gy.pages.dev/` URL rather than a preview
   hash/branch-alias URL);
5. fetches `registry/index.json` + **every** staged Theme's manifest back
   from `https://assets-4gy.pages.dev/` (not just one Theme — every Theme
   the staged registry index lists) and asserts HTTP 200 + a sha256
   content-hash match against what was staged, then removes `.deploy/`.

If step 5 (verify) fails, the script exits non-zero and says so loudly —
the deploy has already happened at that point (there is no automatic
rollback in 0.1; investigate manually).

## What this Story does *not* do

- **It does not perform the actual first publish.** That is issue **#6**,
  a separate Story — and per the team's outward-facing-action policy,
  running `deploy-registry.sh` for real (issue #6 or any later real
  deploy) needs a human to run it themselves, or to explicitly authorize
  an agent to do so. It does not happen automatically just because this
  tooling exists.
- **`assets.nebulacast.app` custom-domain DNS** is a later, separate,
  out-of-scope concern (post-0.1). Until it's configured,
  `https://assets-4gy.pages.dev/` is the published URL.
- CDN-divergence maintenance tooling (`scripts/maintenance/`) — not this
  Story.

## Why `registry/index.json` is staged from the repo root, not `dist/`

`scripts/build/build-all.ts` writes the generated Registry index to the
repo-root `registry/index.json` (checked into git for review, per
Implementation Plan §3), not under `dist/`. `dist/` only ever contains
`themes/` and `runtime/` in 0.1 (Plan §2 decision 9 — no `components/` or
`media/` yet). So the staging step in `deploy-registry.sh` explicitly
copies from three separate allowlisted sources — `dist/themes/`,
`dist/runtime/`, and repo-root `registry/index.json` — rather than
mirroring `dist/` as a single blanket copy. The resulting published tree
(`themes/`, `runtime/`, `registry/index.json` all at the site root) matches
Architecture §27's recommended published structure (`/themes/`,
`/registry/index.json`) plus `runtime/`, which §27 doesn't enumerate but
0.1 consumers need in order to load `@incus/hud-runtime` from the CDN.
