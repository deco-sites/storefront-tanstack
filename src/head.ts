/**
 * The page `<head>`, built by the site from the page's name and its SEO block (in v7 this was
 * `cmsRouteConfig`'s head builder in @decocms/tanstack; the tags and their order are the same).
 */
import type { PageSeo } from "./model";

export const SITE_NAME = "Storefront-tanstack";

/** A template that does something: not empty and not a bare "%s". */
function effectiveTemplate(template: string | undefined): string | undefined {
  if (!template || template.trim() === "" || template.trim() === "%s") return undefined;
  return template;
}

export function buildHead(page: { name?: string; seo?: PageSeo } | undefined) {
  const seo = page?.seo;
  const titleTemplate = effectiveTemplate(seo?.titleTemplate);
  const descriptionTemplate = effectiveTemplate(seo?.descriptionTemplate);
  const title = seo?.title
    ? (titleTemplate?.replace("%s", seo.title) ?? seo.title)
    : page?.name
      ? `${page.name} | ${SITE_NAME}`
      : SITE_NAME;
  const description = seo?.description
    ? (descriptionTemplate?.replace("%s", seo.description) ?? seo.description)
    : undefined;
  const image = seo?.image;
  const canonical = seo?.canonical;

  const meta: Record<string, string>[] = [{ title }];
  if (description) meta.push({ name: "description", content: description });
  // Robots: always an explicit directive.
  meta.push({
    name: "robots",
    content: seo?.noIndexing
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  });
  meta.push({ property: "og:title", content: title });
  if (description) meta.push({ property: "og:description", content: description });
  if (image) meta.push({ property: "og:image", content: image });
  meta.push({ property: "og:type", content: seo?.type || "website" });
  if (canonical) meta.push({ property: "og:url", content: canonical });
  meta.push({ name: "twitter:card", content: image ? "summary_large_image" : "summary" });
  meta.push({ name: "twitter:title", content: title });
  if (description) meta.push({ name: "twitter:description", content: description });
  if (image) meta.push({ name: "twitter:image", content: image });

  const links: Record<string, string>[] = canonical ? [{ rel: "canonical", href: canonical }] : [];
  return { meta, links };
}
