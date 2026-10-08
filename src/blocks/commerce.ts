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

/**
 * Shopify's product listing page reads filters, sort and pagination from the page URL, which a block
 * function doesn't get as an argument: it reads it from the page being rendered.
 */
export const shopifyProductListingPage = (props: ProductListingPageProps) =>
  productListingPageLoader(props, pageState().url);

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
