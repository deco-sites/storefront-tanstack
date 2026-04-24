# Storefront — deco.cx template

A multi-platform e-commerce storefront template powered by [TanStack Start](https://tanstack.com/start), React 19, and Cloudflare Workers. Ships with integrations for VTEX, Shopify, Wake, and other commerce platforms through [`@decocms/apps`](https://github.com/decocms/apps-start).

## Stack

- **Runtime:** Cloudflare Workers (Node.js compat) + Vite 7 for dev
- **Framework:** [TanStack Start](https://tanstack.com/start) on React 19
- **CMS & commerce:** [`@decocms/start`](https://github.com/decocms/deco-start) + [`@decocms/apps`](https://github.com/decocms/apps-start)
- **Styling:** Tailwind CSS 4 + daisyUI 5
- **Deploy:** `wrangler deploy` via GitHub Actions

## Quick start

### 1. Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [npm](https://www.npmjs.com/) (ships with Node)

### 2. Clone and install

```sh
git clone https://github.com/deco-sites/storefront-tanstack.git my-storefront
cd my-storefront
npm install
```

### 3. Configure environment

Copy the example env and adjust if needed:

```sh
cp .env .env.local  # optional, Vite picks up both
```

Defaults in `.env`:

```env
DECO_SITE_NAME=storefront
DECO_ENV_NAME=localhost
```

### 4. Run the dev server

```sh
npm run dev
```

The site is available at **http://localhost:5173**. Changes to sections, loaders, and routes hot-reload.

### 5. Build for production

```sh
npm run build
```

This runs the full code-generation pipeline (blocks, schema, sections, loaders, TanStack routes) and then `vite build`.

## Scripts reference

| Script                 | What it does                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Start Vite dev server on port 5173                               |
| `npm run dev:clean`    | Wipe Vite/Wrangler cache and start dev fresh                     |
| `npm run build`        | Generate all block/schema/section/loader files + `vite build`    |
| `npm run preview`      | Preview the production build locally via `vite preview`          |
| `npm run deploy`       | Build + `wrangler deploy` to Cloudflare Workers                  |
| `npm run typecheck`    | `tsc --noEmit` — no code emitted, only type errors               |
| `npm run format`       | Format `src/**/*.{ts,tsx}` with Prettier                         |
| `npm run tailwind:fix` | Auto-fix Tailwind class issues                                   |
| `npm run clean`        | Nuke all caches + reinstall                                      |

## Deploying

Two GitHub Actions workflows handle deployment automatically:

- **`preview.yml`** — on every pull request, uploads a versioned preview to Cloudflare Workers and comments the URL on the PR
- **`deploy.yml`** — on every push to `main`, runs `wrangler deploy` to production

See [`.github/workflows/README.md`](./.github/workflows/README.md) for configuration details (secrets, worker naming, custom domains).

To deploy manually from your machine:

```sh
npm run deploy
```

You'll need `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exported in your shell.

## Project structure

```
src/
├── routes/          # TanStack Router routes (file-based)
│   └── deco/        # Admin protocol endpoints (meta, render, invoke)
├── sections/        # CMS-composable UI blocks (Header, ProductShelf, etc.)
├── components/      # Shared React components
├── sdk/             # Hooks, helpers, client utilities
├── server/          # Generated CMS resolution code
├── setup.ts         # App/site wiring (VTEX, Shopify, etc.)
└── worker-entry.ts  # Cloudflare Worker entry point
```

## Recommended VS Code extensions

- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

## Resources

- 📚 [deco.cx docs](https://www.deco.cx/docs)
- 🔧 [`@decocms/start` (framework)](https://github.com/decocms/deco-start)
- 🛒 [`@decocms/apps` (commerce integrations)](https://github.com/decocms/apps-start)
- ⚡ [TanStack Start docs](https://tanstack.com/start/latest)
- ☁️ [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)
- 👥 [deco.cx Discord](https://deco.cx/discord)

## Contributing

Issues and PRs welcome on the framework repos:

- [decocms/deco-start](https://github.com/decocms/deco-start) — the TanStack Start framework
- [decocms/apps-start](https://github.com/decocms/apps-start) — commerce integrations (VTEX, Shopify, Wake, etc.)
