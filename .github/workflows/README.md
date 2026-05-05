# CI workflows

Two workflows manage Cloudflare Workers deployments for this storefront:

- **`preview.yml`** — uploads a versioned preview on every PR (and on pushes to `env/**`)
- **`deploy.yml`** — deploys to production on every push to `main`

## Required secrets

Both workflows need the following GitHub secrets (Settings → Secrets and variables → Actions):

| Secret                  | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | API token with `Workers Scripts:Edit` permission           |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID that owns the worker                 |

The worker name is set in `wrangler.jsonc` (currently `storefront-tanstack-template`). Rename it in your fork to avoid colliding with other workers on the same Cloudflare account.

## Preview (`preview.yml`)

Triggers:

- `pull_request` — opened, synchronize, reopened
- `push` to branches matching `env/**` (e.g. `env/staging`)
- `repository_dispatch` with type `preview-deploy` (for external triggers)

What it does:

1. Computes a preview alias:
   - `env/staging` → `staging`
   - PR #42 → `pr-42`
   - any other ref → slug (`[^a-z0-9-]` replaced with `-`)
2. Runs `npm install && npm run build`
3. Runs `npx wrangler versions upload --preview-alias <alias>`
4. Parses the two URLs from wrangler output:
   - **Version URL** — immutable, unique per upload
   - **Alias URL** — stable, overwritten on each push for the same alias
5. Posts a sticky comment on the PR (header `preview-url`) with both URLs

`wrangler versions upload` does **not** replace the production deployment — it creates an isolated version that only traffic hitting the preview URLs reaches. Production is promoted manually via the Cloudflare dashboard or `wrangler versions deploy`.

## Deploy (`deploy.yml`)

Trigger: `push` to `main`.

What it does:

1. Syncs `package-lock.json` if missing/stale (commits it back to the repo as `github-actions[bot]`)
2. Runs `npm ci && npm run build`
3. Runs `npx wrangler deploy --var BUILD_HASH:$(git rev-parse --short HEAD)` — injects the short commit SHA as a runtime var so the worker can expose its build version

Concurrency group `deploy-main` with `cancel-in-progress: false` — queues deploys instead of cancelling, so a fast sequence of merges never leaves production mid-deploy.

## Custom domain

`wrangler.jsonc` ships with `routes` commented out. To map a custom domain, uncomment and fill in the pattern + `zone_name`, then run a deploy. Until then, the worker is only reachable at `<name>.<subdomain>.workers.dev`.
