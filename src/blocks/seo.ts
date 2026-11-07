/**
 * The SEO blocks saved content names. The page's `seo` field holds v7's SeoV2 section, which returns
 * its settings for the page's head (src/open-page.server.ts builds it as v7's buildPageSeo did). The
 * SEO sections saved inside `sections` (SeoPLPV2, SeoPDPV2) rendered nothing on this v7 site, so
 * they resolve to nothing here too; their product data is a lazy argument, so it isn't fetched for
 * them (the PDP and PLP sections render their own JSON-LD, as in v7).
 */
import type { Lazy } from "@decocms/blocks";
import type {
  ProductDetailsPage,
  ProductListingPage,
} from "@decocms/compat-v7/commerce/types";
import type { BlockDescriptor, PageSeo } from "../../.deco";

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
  /** @title JSON-LDs */
  jsonLDs?: Record<string, unknown>[];
}

export const seoDetailsPage = (_props: SeoDetailsPageProps): BlockDescriptor | undefined =>
  undefined;
