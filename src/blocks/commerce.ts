/**
 * The data blocks v7 content calls by their app type names. In the next major the apps ship no
 * loaders (/next/renames-and-migrations#loaders-actions-and-invoke), so these are the site's own
 * functions over the vendored Shopify loaders and the upstream client.
 */
import type { ProductDetailsPage, ProductListingPage } from "../vendor/commerce/types";
import productListingPageLoader, {
  type Props as ProductListingPageProps,
} from "../vendor/shopify/loaders/ProductListingPage";
import productDetailsPageLoader, {
  type Props as ProductDetailsPageProps,
} from "../vendor/shopify/loaders/ProductDetailsPage";
import { pageState } from "../request-state.server";

/** The loader inputs v7 filled from the page's query string when the saved block left them unset. */
const QUERY_STRING_INPUTS = [
  "query",
  "collectionName",
  "startCursor",
  "endCursor",
  "pageHref",
  "languageCode",
  "countryCode",
] as const;
const NUMERIC_QUERY_STRING_INPUTS = ["count", "pageOffset"] as const;

/**
 * Shopify's product listing page, called the way production (v7) calls it: with the saved inputs,
 * the page's query-string values for inputs left unset (`page` excepted, numbers for `count` and
 * `pageOffset`), and no URL argument. Without a URL the loader reads `https://localhost`, so a
 * listing that isn't a search names no collection, Shopify rejects the query, the loader resolves to
 * null and the section shows "Not Found!" (what production renders on /shirts). Search differs:
 * production (7.77.1) renders /s?q=shirt with the breadcrumb "Home > shirt", Filters and "12 of 0
 * results" over an empty grid, while this shows "Not Found!"; the product owner approved keeping
 * "Not Found!" on 2026-10-22.
 */
export const shopifyProductListingPage = (props: ProductListingPageProps) => {
  const search = pageState().url.searchParams;
  const input: Record<string, unknown> & ProductListingPageProps = { ...props };
  for (const key of QUERY_STRING_INPUTS) {
    const value = search.get(key);
    if (input[key] === undefined && value !== null) input[key] = value;
  }
  for (const key of NUMERIC_QUERY_STRING_INPUTS) {
    const value = search.get(key);
    if (input[key] === undefined && value !== null && Number.isFinite(Number(value))) {
      input[key] = Number(value);
    }
  }
  // v7 resolved a failing commerce loader to null (logging the error), so the section got no page.
  return productListingPageLoader(input).catch((error: unknown) => {
    console.error('[CMS] Commerce loader "shopify/loaders/ProductListingPage.ts" failed:', error);
    return null;
  });
};

/** v7's commerce extension wrappers. No extensions are saved, so each returns its data as is. */
export const listingPageExtensions = (props: {
  data: ProductListingPage | null;
  extensions?: unknown[];
}): ProductListingPage | null => props.data;

export const detailsPageExtensions = (props: {
  data: ProductDetailsPage | null;
  extensions?: unknown[];
}): ProductDetailsPage | null => props.data;

/**
 * Shopify's product details page. v7 content took the slug from the URL with a block in the `slug`
 * field (website/functions/requestToParam.ts); a string field holds a plain value in the next major,
 * so the slug now comes from the route param of the page being rendered (`/products/:slug`), unless
 * one is saved. The URL argument stays unset, as v7 called it.
 */
export const shopifyProductDetailsPage = (
  props: Omit<ProductDetailsPageProps, "slug"> & { slug?: string },
) => productDetailsPageLoader({ ...props, slug: props.slug ?? pageState().params.slug ?? "" });
