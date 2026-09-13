# scripts/deploy/

Reserved for `deploy-registry.sh` — deploys the validated `dist/` output to
the existing `assets-4gy` Cloudflare Pages project
(`https://assets-4gy.pages.dev/`) via direct `wrangler pages deploy`,
modelled on `deploy_gadgets_media.sh` (Plan §2 decision 6). Reuses existing
CDN infrastructure deliberately — no new Cloudflare Pages/CDN target is
stood up for this repo.

Deliberately empty in Story #5 (explicitly out of scope: "deploy tooling
(#7)").
