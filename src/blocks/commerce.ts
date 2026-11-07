/**
 * The commerce blocks v7 content calls by their app type names. The next major's apps ship no
 * loaders (/next/renames-and-migrations#loaders-actions-and-invoke), so these are the site's own,
 * over the vendored v7 Shopify loaders, called the way v7 called them on this site.
 */
import type {
  ProductDetailsPage,
  ProductListingPage,
} from "@decocms/compat-v7/commerce/types";
import { pageContext } from "../page-context.server";
import productDetailsPageLoader, {
  type Props as ProductDetailsPageProps,
} from "../vendor/shopify/loaders/ProductDetailsPage";
import productListingPageLoader, {
  type Props as ProductListingPageProps,
} from "../vendor/shopify/loaders/ProductListingPage";

/**
 * v7 resolved a failing commerce loader to null and logged it (src/setup.ts's onResolveError), so
 * the section rendered its empty state; without this the whole section would fail and render
 * nothing.
 */
const nullOnError = (loader: string) => (error: unknown) => {
  console.error(`[CMS] commerce loader "shopify/loaders/${loader}.ts" failed:`, error);
  return null;
};

/**
 * Shopify's product listing page with the page's URL, as v7's src/setup.ts wrapped it: filters,
 * sort, search and paging come from the URL being rendered (on a client-side navigation too), not
 * from the loader's `https://localhost` fallback.
 */
export const shopifyProductListingPage = (props: ProductListingPageProps) =>
  productListingPageLoader(props, pageContext()?.url).catch(nullOnError("ProductListingPage"));

/**
 * Shopify's product details page. v7 content took the slug from the URL with a block in the `slug`
 * field (website/functions/requestToParam.ts, which reads the request); a string field holds a plain
 * value in the next major, so the slug comes from the page's route param (`/products/:slug`) unless
 * one is saved. No URL argument, as v7 called it.
 */
export const shopifyProductDetailsPage = (
  props: Omit<ProductDetailsPageProps, "slug"> & { slug?: string },
) =>
  productDetailsPageLoader({ ...props, slug: props.slug ?? pageContext()?.params.slug ?? "" }).catch(
    nullOnError("ProductDetailsPage"),
  );

/** v7's commerce extension wrappers. No extensions are saved, so each returns its data as is. */
export const listingPageExtensions = (props: {
  data: ProductListingPage | null;
  extensions?: unknown[];
}): ProductListingPage | null => props.data;

export const detailsPageExtensions = (props: {
  data: ProductDetailsPage | null;
  extensions?: unknown[];
}): ProductDetailsPage | null => props.data;
