/**
 * The page `<head>`, built by the site from the page's name, its SEO block and the site-wide SEO
 * defaults (in v7 this was `cmsRouteConfig`'s head builder in @decocms/tanstack; the tags and their
 * order are the same).
 */
import type { PageSeo } from "./model";

export const SITE_NAME = "Storefront-tanstack";

/**
 * The site-wide SEO defaults: the `seo` of v7's `site` block (`.deco/blocks/site.json`, removed in
 * the move to the next major). Since @decocms 7.48.4 v7 applies it to every CMS page (its
 * `getSiteSeo` had read only a block named `Site`, so this site's lowercase `site` block was
 * ignored before): a field the page's SEO block leaves empty takes the site's value, and the
 * page's template, or else the site's, wraps the title and the description. In the next major a
 * page without SEO gets the site's defaults (`Page.seo` in @decocms/blocks), which are these.
 */
export const SITE_SEO: PageSeo = {
  title: "Storefront",
  description: "Build profitable websites with deco.cx",
  titleTemplate: "%s | deco.cx",
  descriptionTemplate: "%s | deco.cx",
  image:
    "https://decoims.com/storefront-tanstack/bfe00763-d6fa-40f0-9fa9-77e6769fe02d/1742560188441-74d13a55-4c18-4a5c-8cb4-dcaa27aae923.png",
};

/** A template that does something: not empty and not a bare "%s". */
function effectiveTemplate(template: string | undefined): string | undefined {
  if (!template || template.trim() === "" || template.trim() === "%s") return undefined;
  return template;
}

/**
 * The page's SEO with the site's defaults applied, as v7 7.77.1 does (`buildPageSeo` in
 * @decocms/tanstack): empty title, description and image take the site's, then the page's template
 * (or the site's) wraps the title and the description.
 */
function withSiteDefaults(pageSeo: PageSeo | undefined): PageSeo {
  const seo: PageSeo = { ...pageSeo };
  if (!seo.title && SITE_SEO.title) seo.title = SITE_SEO.title;
  if (!seo.description && SITE_SEO.description) seo.description = SITE_SEO.description;
  if (!seo.image && SITE_SEO.image) seo.image = SITE_SEO.image;
  const titleTemplate =
    effectiveTemplate(pageSeo?.titleTemplate) ?? effectiveTemplate(SITE_SEO.titleTemplate);
  const descriptionTemplate =
    effectiveTemplate(pageSeo?.descriptionTemplate) ??
    effectiveTemplate(SITE_SEO.descriptionTemplate);
  if (titleTemplate && seo.title) seo.title = titleTemplate.replace("%s", seo.title);
  if (descriptionTemplate && seo.description) {
    seo.description = descriptionTemplate.replace("%s", seo.description);
  }
  return seo;
}

export function buildHead(page: { name?: string; seo?: PageSeo } | undefined) {
  const seo = page ? withSiteDefaults(page.seo) : undefined;
  const title = seo?.title
    ? seo.title
    : page?.name
      ? `${page.name} | ${SITE_NAME}`
      : SITE_NAME;
  const description = seo?.description || undefined;
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
