# CI workflows

Cloudflare Workers deployments for this storefront:

- **Per-PR previews** — handled by the Cloudflare **Workers Builds** GitHub App
  (connected on the Cloudflare side). It builds each PR and posts a sticky
  comment with the Commit/Branch preview URLs. No workflow file is needed.
- **`deploy.yml`** — deploys to production on every push to `main`.

## Required secrets

Both workflows need the following GitHub secrets (Settings → Secrets and variables → Actions):

| Secret                  | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | API token with `Workers Scripts:Edit` permission           |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID that owns the worker                 |

The worker name is set in `wrangler.jsonc` (currently `storefront-tanstack-template`). Rename it in your fork to avoid colliding with other workers on the same Cloudflare account.

## Preview (Cloudflare Workers Builds)

Per-PR previews are produced by the Cloudflare **Workers Builds** GitHub App,
configured on the Cloudflare dashboard (not by a workflow in this repo). On each
PR it builds the branch and posts a sticky comment with a **Commit Preview URL**
(immutable, per-commit) and a **Branch Preview URL** (stable per branch). These
are isolated versions and do not replace the production deployment.

> The previous `preview.yml` workflow was removed — it duplicated this and was
> failing on every PR (`bun: not found`, it never set up Bun). Workers Builds
> covers preview end to end.

## Deploy (`deploy.yml`)

Trigger: `push` to `main`.

What it does:

1. Syncs `package-lock.json` if missing/stale (commits it back to the repo as `github-actions[bot]`)
2. Runs `npm ci && npm run build`
3. Runs `npx wrangler deploy --var BUILD_HASH:$(git rev-parse --short HEAD)` — injects the short commit SHA as a runtime var so the worker can expose its build version

Concurrency group `deploy-main` with `cancel-in-progress: false` — queues deploys instead of cancelling, so a fast sequence of merges never leaves production mid-deploy.

## Custom domain

`wrangler.jsonc` ships with `routes` commented out. To map a custom domain, uncomment and fill in the pattern + `zone_name`, then run a deploy. Until then, the worker is only reachable at `<name>.<subdomain>.workers.dev`.
