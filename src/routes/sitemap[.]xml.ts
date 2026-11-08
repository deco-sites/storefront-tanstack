import { createFileRoute } from "@tanstack/react-router";
import { client } from "../cms";

/**
 * The CMS pages' sitemap, read from the release's index alone (`entries("page")`): no page body is
 * fetched. A page is listed when its path is a plain URL (no `:param` or `*` segment, which are
 * templates: products, the category catch-all) and its SEO doesn't say `noIndexing` (Studio writes
 * `noIndex` on the page's index entry when it publishes; an index older than that carries none).
 *
 * v7 (the TanStack base) answered /sitemap.xml with the `/*` category page; the Deno site's Shopify
 * proxy merged deco's pages into Shopify's sitemap. Products and collections stay Shopify's
 * (https://<store>/sitemap.xml); this lists the pages Studio publishes.
 */

/** A path template: a `:param` or `*` segment. */
const TEMPLATE = /(^|\/)(:|\*)/;

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const c = await client(request);
        const [pages, error] = await c.entries("page");
        if (error) throw error;
        const origin = new URL(request.url).origin;
        const paths = [
          ...new Set(
            pages.flatMap((p) => (p.path && !p.noIndex && !TEMPLATE.test(p.path) ? [p.path] : [])),
          ),
        ].sort();
        const urls = paths.map((path) => `  <url><loc>${escapeXml(origin + path)}</loc></url>`);
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls,
          "</urlset>",
          "",
        ].join("\n");
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
      },
    },
  },
});
