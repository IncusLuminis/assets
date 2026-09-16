#!/usr/bin/env bash
#
# scripts/deploy/deploy-registry.sh
#
# Publishes a validated `dist/` build (scripts/build/build-all.ts's output,
# Story #1/#5) plus the committed `registry/index.json` to the existing
# Cloudflare Pages project named `assets` (https://assets-4gy.pages.dev/ --
# that pages.dev subdomain differs from the project NAME; see wrangler.toml
# for why `--project-name assets` is correct here and `assets-4gy` is not).
#
# Modelled directly on the sibling `scripts/deploy_gadgets_media.sh` pattern
# (Plan §2 decision 6): a gitignored staging directory, a direct
# `wrangler pages deploy` call, no GitHub-connected Pages project,
# content-hashed incremental upload, `wrangler` assumed already
# authenticated on the run host. No new/parallel CDN target is invented.
#
# Pipeline (Arch §49), enforced here in this exact order -- not just
# documented:
#
#   clean -> build -> validate -> stage -> deploy -> verify
#
#   1. clean -- removes `dist/themes/` and `dist/runtime/` BEFORE the build
#      runs. Required for "reproducible deployment from repository state
#      alone" (Arch §33, this Story's AC): without this, any stale/bogus
#      directory already sitting under `dist/themes/` on the run host (a
#      half-finished experiment, a renamed/removed Theme's leftover output,
#      anything) survives an incremental `build:all` run untouched --
#      `build-theme.ts`/`build-all.ts` only ever WRITE the known real Theme
#      ids, they don't own or clean the rest of `dist/themes/` -- and
#      `build-registry.ts`'s directory discovery is not scoped to the known
#      Theme ids, so it would silently pick the stray directory up as a
#      legitimate published Theme. This step makes every run start from a
#      guaranteed-clean `dist/`, so what gets built (and later staged) can
#      only ever be exactly what the current `library/themes/` source
#      produces -- never leftover cruft. (Root cause note: this is NOT an
#      `rsync --delete` problem in the staging step below -- `.deploy/` is
#      already `rm -rf`'d fresh every run, so `--delete` there would be a
#      no-op. The actual gap was upstream of staging entirely: nothing ever
#      cleared `dist/themes/` before asking the build to regenerate it.)
#   2. build + validate -- runs `npm run build:all` fresh, every run, against
#      that guaranteed-clean `dist/`. `build-theme.ts` (called by
#      `build-all.ts`) already fails closed on any invalid manifest, missing
#      `supported:true` composition dir, or missing entrypoint file (Story
#      #1 AC) and stops at the first Theme that fails -- so a *fresh* build
#      succeeding IS the validation gate. There is no separate "is dist/
#      stale?" heuristic beyond step 1's clean, because this script is
#      always the one producing dist/ immediately before staging it, in the
#      same run. If `npm run build:all` exits non-zero, this script aborts
#      before creating a stage directory or touching `wrangler` at all.
#   3. stage -- an explicit ALLOWLIST copy (Arch §44), not a blanket copy of
#      `dist/` or the repo root, into a gitignored `.deploy/` directory
#      (matches `deploy_gadgets_media.sh`'s convention; see `.gitignore`):
#
#        dist/themes/         -> .deploy/themes/
#        dist/runtime/        -> .deploy/runtime/
#        registry/index.json  -> .deploy/registry/index.json
#
#      Nothing else under `dist/` or the repo root is ever copied, so a
#      stray `.env`, secret, source file, or local artifact that somehow
#      ended up in `dist/` can never reach the stage directory or the CDN.
#
#      NOTE on `registry/index.json`'s placement: `build-all.ts` writes the
#      generated registry index to the repo-root `registry/index.json`
#      (checked into git for review, per Plan §3), NOT under `dist/` -- so
#      it is staged from its repo-root location, not from `dist/`. This
#      published layout (`themes/` + `runtime/` + `registry/index.json` all
#      at the site root) matches Arch §27's recommended structure
#      (`/themes/`, `/registry/index.json`) plus `runtime/`, which Arch §27
#      doesn't enumerate but 0.1 consumers need to load
#      (`dist/runtime/index.js`, Story #5) -- there is no `components/` or
#      `media/` yet because 0.1 doesn't build them (Plan §2 decision 9).
#      This choice is deliberate, not a guess left silent: see this file's
#      README.md for the same explanation in one place for a human reader.
#   4. deploy -- `wrangler pages deploy .deploy --project-name assets-4gy
#      --commit-dirty=true`. A REAL network call to Cloudflare. Skipped
#      entirely under `--dry-run`.
#   5. verify -- `node verify.mjs` fetches `registry/index.json` + every
#      staged Theme's manifest.json (not just the first) from the published
#      base URL and asserts HTTP 200 + sha256 content-hash match against
#      what was staged (Arch §33/§49, this Story's AC) -- so a broken
#      publish of ANY Theme is caught, not only a broken hud-01. Also
#      skipped under `--dry-run` (nothing has been deployed yet to verify).
#
# Usage:
#   scripts/deploy/deploy-registry.sh              # clean -> build -> stage -> DEPLOY -> verify (real)
#   scripts/deploy/deploy-registry.sh --dry-run     # clean -> build -> stage -> print plan; stop
#
# Flags:
#   --dry-run            Perform every step through staging, print the exact
#                         `wrangler` command and verify plan a real run would
#                         execute, then stop. Makes no network call, invokes
#                         no `wrangler` binary, needs no Cloudflare
#                         credentials -- safe to run any time.
#   --repo-root=<path>   Override the repo root this script operates on.
#                         Test hook only (mirrors `build-all.ts`'s own
#                         `--repo-root=`); defaults to this script's own
#                         repo (two directories up from `scripts/deploy/`).
#   --base-url=<url>     Override the published base URL the post-deploy
#                         verify step checks against. Test hook only;
#                         defaults to https://assets-4gy.pages.dev.
#   --branch=<name>       Override the Cloudflare Pages deployment branch
#                         label passed to `wrangler pages deploy`. Cloudflare
#                         Pages treats a deploy whose branch label matches the
#                         project's configured production branch (`main`) as
#                         the production deploy (served from the bare
#                         `https://assets-4gy.pages.dev/` URL); any other
#                         label is a preview deploy served only from a
#                         hash/branch-alias URL. Defaults to `main` so a plain
#                         run of this script always publishes to production
#                         regardless of which local git branch the worktree
#                         happens to be on -- this is a Cloudflare Pages
#                         deployment label, independent of and never a
#                         substitute for this repo's own git branches/PRs/
#                         merges (nothing here merges anything to this
#                         repo's `main` git branch).
#   -h, --help            Show this usage and exit 0.
#
# See scripts/deploy/README.md for real-deploy prerequisites.

set -euo pipefail

DRY_RUN=0
REPO_ROOT=""
BASE_URL="https://assets-4gy.pages.dev"
PROJECT_NAME="assets"
BRANCH="main"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Prints the header comment block above (from the `#!` line down to the
# first non-comment line), reformatted as plain usage text. Uses awk rather
# than a fixed line count so this stays correct however long the header
# comment grows or shrinks.
usage() {
  awk '
    NR == 1 { next }                          # skip the #!/usr/bin/env bash line
    /^#/    { line = $0; sub(/^#[ ]?/, "", line); print line; next }
    { exit }
  ' "$0"
}

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=1
      ;;
    --repo-root=*)
      REPO_ROOT="${arg#--repo-root=}"
      ;;
    --base-url=*)
      BASE_URL="${arg#--base-url=}"
      ;;
    --branch=*)
      BRANCH="${arg#--branch=}"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "deploy-registry.sh: unknown argument: $arg" >&2
      echo "Run with --help for usage." >&2
      exit 2
      ;;
  esac
done

if [ -z "$REPO_ROOT" ]; then
  REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi
cd "$REPO_ROOT"

STAGE="$REPO_ROOT/.deploy"
DIST_THEMES="$REPO_ROOT/dist/themes"
DIST_RUNTIME="$REPO_ROOT/dist/runtime"
REGISTRY_INDEX="$REPO_ROOT/registry/index.json"

echo "==> [1/5] clean (removing dist/themes/ and dist/runtime/ before rebuilding)"
rm -rf "$DIST_THEMES" "$DIST_RUNTIME"

echo "==> [2/5] build + validate (npm run build:all)"
npm run build:all

for required in "$DIST_THEMES" "$DIST_RUNTIME" "$REGISTRY_INDEX"; do
  if [ ! -e "$required" ]; then
    echo "deploy-registry.sh: refusing to deploy -- expected build output missing: $required" >&2
    echo "    (npm run build:all reported success but did not produce it; aborting before staging)" >&2
    exit 1
  fi
done
if [ -z "$(ls -A "$DIST_THEMES" 2>/dev/null)" ]; then
  echo "deploy-registry.sh: refusing to deploy -- $DIST_THEMES is empty" >&2
  exit 1
fi
if [ -z "$(ls -A "$DIST_RUNTIME" 2>/dev/null)" ]; then
  echo "deploy-registry.sh: refusing to deploy -- $DIST_RUNTIME is empty" >&2
  exit 1
fi

echo "==> [3/5] stage (allowlist-only copy into $STAGE)"
rm -rf "$STAGE"
mkdir -p "$STAGE/themes" "$STAGE/runtime" "$STAGE/registry"
rsync -a "$DIST_THEMES/" "$STAGE/themes/"
rsync -a "$DIST_RUNTIME/" "$STAGE/runtime/"
cp "$REGISTRY_INDEX" "$STAGE/registry/index.json"

STAGED_FILE_COUNT="$(find "$STAGE" -type f | wc -l | tr -d ' ')"
echo "    staged $STAGED_FILE_COUNT file(s) under $STAGE (themes/, runtime/, registry/index.json only)"

WRANGLER_CMD=(wrangler pages deploy "$STAGE" --project-name "$PROJECT_NAME" --branch "$BRANCH" --commit-dirty=true)

if [ "$DRY_RUN" = "1" ]; then
  echo "==> [dry-run] would deploy:"
  printf '   '
  printf ' %q' "${WRANGLER_CMD[@]}"
  echo
  echo "==> [dry-run] would then verify against $BASE_URL:"
  echo "    registry/index.json + every staged theme's manifest.json (per the staged registry index)"
  echo "==> [dry-run] stopping before the real wrangler call. No network access, no wrangler invocation, no Cloudflare credentials used."
  exit 0
fi

echo "==> [4/5] deploy (wrangler pages deploy)"
"${WRANGLER_CMD[@]}"

echo "==> [5/5] verify (post-deploy)"
VERIFY_STATUS=0
node "$SCRIPT_DIR/verify.mjs" --stage-dir="$STAGE" --base-url="$BASE_URL" || VERIFY_STATUS=$?

rm -rf "$STAGE"

if [ "$VERIFY_STATUS" -ne 0 ]; then
  echo "deploy-registry.sh: deploy completed but post-deploy verification FAILED -- investigate before relying on the published content." >&2
  exit 1
fi

echo "==> done."
