#!/usr/bin/env bash
#
# scripts/deploy/deploy-registry.sh
#
# Publishes a validated `dist/` build (scripts/build/build-all.ts's output,
# Story #1/#5) plus the committed `registry/index.json` to the existing
# `assets-4gy` Cloudflare Pages project (https://assets-4gy.pages.dev/).
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
#   build -> validate -> stage -> deploy -> verify
#
#   1. build + validate -- runs `npm run build:all` fresh, every run.
#      `build-theme.ts` (called by `build-all.ts`) already fails closed on
#      any invalid manifest, missing `supported:true` composition dir, or
#      missing entrypoint file (Story #1 AC) and stops at the first Theme
#      that fails -- so a *fresh* build succeeding IS the validation gate.
#      There is no separate "is dist/ stale?" heuristic, because this
#      script is always the one producing dist/ immediately before staging
#      it, in the same run. If `npm run build:all` exits non-zero, this
#      script aborts before creating a stage directory or touching
#      `wrangler` at all.
#   2. stage -- an explicit ALLOWLIST copy (Arch §44), not a blanket copy of
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
#   3. deploy -- `wrangler pages deploy .deploy --project-name assets-4gy
#      --commit-dirty=true`. A REAL network call to Cloudflare. Skipped
#      entirely under `--dry-run`.
#   4. verify -- `node verify.mjs` fetches `registry/index.json` + one
#      versioned asset from the published base URL and asserts HTTP 200 +
#      sha256 content-hash match against what was staged (Arch §33/§49,
#      this Story's AC). Also skipped under `--dry-run` (nothing has been
#      deployed yet to verify).
#
# Usage:
#   scripts/deploy/deploy-registry.sh              # build -> stage -> DEPLOY -> verify (real)
#   scripts/deploy/deploy-registry.sh --dry-run     # build -> stage -> print plan; stop
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
#   -h, --help            Show this usage and exit 0.
#
# See scripts/deploy/README.md for real-deploy prerequisites.

set -euo pipefail

DRY_RUN=0
REPO_ROOT=""
BASE_URL="https://assets-4gy.pages.dev"
PROJECT_NAME="assets-4gy"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

usage() {
  sed -n '1,70p' "$0" | grep '^#' | sed 's/^#$//; s/^# //'
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

echo "==> [1/4] build + validate (npm run build:all)"
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

echo "==> [2/4] stage (allowlist-only copy into $STAGE)"
rm -rf "$STAGE"
mkdir -p "$STAGE/themes" "$STAGE/runtime" "$STAGE/registry"
rsync -a "$DIST_THEMES/" "$STAGE/themes/"
rsync -a "$DIST_RUNTIME/" "$STAGE/runtime/"
cp "$REGISTRY_INDEX" "$STAGE/registry/index.json"

STAGED_FILE_COUNT="$(find "$STAGE" -type f | wc -l | tr -d ' ')"
echo "    staged $STAGED_FILE_COUNT file(s) under $STAGE (themes/, runtime/, registry/index.json only)"

WRANGLER_CMD=(wrangler pages deploy "$STAGE" --project-name "$PROJECT_NAME" --commit-dirty=true)

if [ "$DRY_RUN" = "1" ]; then
  echo "==> [dry-run] would deploy:"
  printf '   '
  printf ' %q' "${WRANGLER_CMD[@]}"
  echo
  echo "==> [dry-run] would then verify against $BASE_URL:"
  echo "    registry/index.json + one versioned asset (first theme's manifest.json, per the staged registry index)"
  echo "==> [dry-run] stopping before the real wrangler call. No network access, no wrangler invocation, no Cloudflare credentials used."
  exit 0
fi

echo "==> [3/4] deploy (wrangler pages deploy)"
"${WRANGLER_CMD[@]}"

echo "==> [4/4] verify (post-deploy)"
VERIFY_STATUS=0
node "$SCRIPT_DIR/verify.mjs" --stage-dir="$STAGE" --base-url="$BASE_URL" || VERIFY_STATUS=$?

rm -rf "$STAGE"

if [ "$VERIFY_STATUS" -ne 0 ]; then
  echo "deploy-registry.sh: deploy completed but post-deploy verification FAILED -- investigate before relying on the published content." >&2
  exit 1
fi

echo "==> done."
