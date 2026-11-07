// The Workers runtime module the site reads its variables and bindings from (/next/hosted#cloudflare-workers).
// Only what the site uses is declared; `wrangler types` can generate the full set.
declare module "cloudflare:workers" {
  export const env: Record<string, unknown>;
}
