# AGENTS.md

Guidance for AI agents and automated tooling working in this repository.

## Stack

TanStack Start (React) storefront on the next major of Deco CMS
(`@decocms/blocks`), deployed to Cloudflare Workers via wrangler. Dev server:
`npm run dev` (Vite). Build: `npm run build`. Type-check: `npm run typecheck`.
Pages are rendered as described in the TanStack Start guide of the Deco docs
(descriptors): `src/open-page.server.ts` finds the page with `matchRoute` and
resolves each section, `src/views.ts` maps each section to its component.

## Deco CMS content (`.deco/`) — read before editing content

**Source of truth: `.deco/blocks/<encoded-key>.json`** — one JSON file per
saved block (pages, section props, loader config). The filename is the
URI-encoded name. For ANY content change, edit only the matching
`.deco/blocks/*.json` file(s), then run `npm run prebuild` (`deco schema`,
`deco content`, `deco check`): `deco check` must report 0 errors.

**The block map is `.deco/index.ts`**: every type content can name, with an
alias under each v7 type name saved content stores. A section returns a
descriptor; a new section needs an entry there and in `src/views.ts`.

**Never hand-edit generated files:**

- `.deco/schema.gen.json` (`deco schema`; committed)
- `.deco/blocks.gen.ts` (`deco content`; gitignored)
- `src/routeTree.gen.ts`

## Code changes

- Cite files as `path:line` when explaining code.
- Run `npm run typecheck` after TypeScript changes.
- `npm run format` (Prettier) before committing `src/**` changes.
