/**
 * SEO blocks. The page's `seo` field holds v7's SeoV2 section, which returns its settings for the
 * site's head builder (src/head.ts). The SEO sections saved inside `sections` (SeoPLPV2, SeoPDPV2)
 * rendered nothing in v7, which kept them out of the page, so they resolve to nothing here too. Their
 * product data is a lazy argument (/next/lazy-blocks), so it's never fetched for them; to turn one on,
 * call `jsonLD()` and return the head data it should add.
 */
import type { Lazy } from "@decocms/blocks";
import type { BlockDescriptor, PageSeo } from "../model";
import type { ProductDetailsPage, ProductListingPage } from "../vendor/commerce/types";

export const seo = (props: PageSeo): PageSeo => props;

export const seoListingPage = (_props: {
  jsonLD?: Lazy<ProductListingPage | null>;
  title?: string;
  description?: string;
}): BlockDescriptor | undefined => undefined;

export const seoDetailsPage = (_props: {
  jsonLD?: Lazy<ProductDetailsPage | null>;
  jsonLDs?: Record<string, unknown>[];
  title?: string;
  description?: string;
}): BlockDescriptor | undefined => undefined;
