/**
 * SEO blocks. The page's `seo` field holds v7's SeoV2 section, which returns its settings for the
 * site's head builder (src/head.ts). The SEO sections saved inside `sections` (SeoPLPV2, SeoPDPV2)
 * rendered nothing in v7, which kept them out of the page, so they resolve to nothing here too. Their
 * product data is a lazy argument (/next/lazy-blocks), so it's never fetched for them; to turn one on,
 * call `jsonLD()` and return the head data it should add.
 *
 * Each block's props keep v7's fields, titles and descriptions, so its editor form stays the one
 * editors know (v7's forms came from @decocms/blocks 7.77.1, src/cms/schema.ts).
 */
import type { Lazy } from "@decocms/blocks";
import type { BlockDescriptor, PageSeo } from "../model";
import type { ProductDetailsPage, ProductListingPage } from "../vendor/commerce/types";

/** v7's `website/sections/Seo/SeoV2.tsx`. */
export interface SeoV2Props {
  /** @title Title */
  title?: string;
  /** @title Description */
  description?: string;
  /** @title Canonical URL */
  canonical?: string;
  /**
   * @title Favicon
   * @format image-uri
   */
  favicon?: string;
  /** @title No Indexing */
  noIndexing?: boolean;
  /** @title Title Template */
  titleTemplate?: string;
  /** @title Description Template */
  descriptionTemplate?: string;
  /** @title Page Type */
  type?: string;
  /**
   * @title OG Image
   * @format image-uri
   */
  image?: string;
  /**
   * @title Theme Color
   * @format color
   */
  themeColor?: string;
  /** @title JSON-LD Structured Data */
  jsonLDs?: Record<string, unknown>[];
}

export const seo = (props: SeoV2Props): PageSeo => props;

/** v7's `commerce/sections/Seo/SeoPLPV2.tsx`. */
export interface SeoListingPageProps {
  /** @title Data Source */
  jsonLD?: Lazy<ProductListingPage | null>;
  /** @title Title Override */
  title?: string;
  /** @title Description Override */
  description?: string;
  /** @title Disable indexing */
  noIndexing?: boolean;
  /** @title Structured Data */
  configJsonLD?: {
    /**
     * @title Remove videos (deprecated)
     * @description No effect: listing structured data is an ItemList, which carries no videos.
     */
    removeVideos?: boolean;
    /**
     * @title Ignore Structured Data
     * @description By default, Structured Data (JSON-LD) is sent to everyone. Turn this on to omit it for regular visitors while crawlers and bots still receive the full Structured Data. When this block is the page's SEO source, the product fetch is also skipped for visitors, so the page loads faster. Some integrations may rely on Structured Data being present for all users.
     */
    ignoreStructuredData?: boolean;
  };
}

export const seoListingPage = (_props: SeoListingPageProps): BlockDescriptor | undefined =>
  undefined;

/** v7's `commerce/sections/Seo/SeoPDPV2.tsx`. */
export interface SeoDetailsPageProps {
  /** @title Data Source */
  jsonLD?: Lazy<ProductDetailsPage | null>;
  /** @title Omit variants */
  omitVariants?: boolean;
  /** @title Title Override */
  title?: string;
  /** @title Description Override */
  description?: string;
  /** @title Disable indexing */
  noIndexing?: boolean;
  /**
   * @title Ignore Structured Data
   * @description By default, Structured Data (JSON-LD) is sent to everyone. Turn this on to omit it for regular visitors while crawlers and bots still receive the full Structured Data. When this block is the page's SEO source, the product fetch is also skipped for visitors, so the page loads faster. Some integrations may rely on Structured Data being present for all users.
   */
  ignoreStructuredData?: boolean;
}

export const seoDetailsPage = (_props: SeoDetailsPageProps): BlockDescriptor | undefined =>
  undefined;
