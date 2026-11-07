/**
 * v7's /deco/invoke calls, one server function per key the site invoked (/next/renames-and-migrations#loaders-actions-and-invoke).
 * Written by the deco-v7-to-v8-migration skill and finished by hand. Each calls its handler as v7's
 * invoke endpoint did, with the props (v7 sent {} for none) and the request, plus the response
 * headers for the handlers that set cookies (v7 gave them RequestContext.responseHeaders, which v8
 * doesn't have). These are public endpoints, as /deco/invoke was: each input is validated here.
 */
import { markPrivate } from "@decocms/tanstack/server";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, getResponse } from "@tanstack/react-start/server";
import { z } from "zod";
import submitAddress from "../actions/address/submit";
import subscribeNewsletter from "../actions/newsletter/subscribe";
import subscribeNotifyMe from "../actions/notifyMe/subscribe";
import simulateShipping from "../actions/shipping/simulate";
import submitWishlist from "../actions/wishlist/submit";
import loadAddresses from "../loaders/address";
import loadWishlist from "../loaders/wishlist";
import productList, { type Props as ProductListProps } from "../vendor/shopify/loaders/ProductList";

const request = () => getRequest();
const responseHeaders = () => getResponse().headers;

const notifyMeInput = z.object({
  skuId: z.string(),
  email: z.string(),
  name: z.string().optional(),
});

/** site/actions/notifyMe/subscribe */
export const $siteActionsNotifyMeSubscribe = createServerFn({ method: "POST" })
  .inputValidator(notifyMeInput)
  .handler(({ data }) => subscribeNotifyMe(data));

/** The search box's product suggestions: a query and a count, the only call the site makes. */
const productListInput = z.object({
  props: z.object({ query: z.string().max(200), count: z.number().int().min(1).max(50) }),
});

/** shopify/loaders/ProductList (a loader: per visitor, never shared) */
export const $shopifyLoadersProductList = createServerFn({ method: "GET" })
  .inputValidator(productListInput)
  .handler(({ data }) => {
    markPrivate();
    // v7's invoke passed the request as the loader's second argument, which reads it as its URL.
    return productList(data as ProductListProps, request() as unknown as URL);
  });

/** site/actions/shipping/simulate */
export const $siteActionsShippingSimulate = createServerFn({ method: "POST" })
  .inputValidator(z.object({ postalCode: z.string().max(32) }))
  .handler(({ data }) => simulateShipping(data, request()));

/** site/loaders/address (a loader: per visitor, never shared) */
export const $siteLoadersAddress = createServerFn({ method: "GET" }).handler(() => {
  markPrivate();
  return loadAddresses({}, request());
});

const addressInput = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  recipient: z.string().optional(),
  streetAddress: z.string().optional(),
  addressLocality: z.string().optional(),
  addressRegion: z.string().optional(),
  postalCode: z.string().optional(),
  addressCountry: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const addressOp = z.discriminatedUnion("op", [
  z.object({ op: z.literal("save"), address: addressInput }),
  z.object({ op: z.literal("remove"), id: z.string() }),
  z.object({ op: z.literal("setDefault"), id: z.string() }),
]);

/** site/actions/address/submit */
export const $siteActionsAddressSubmit = createServerFn({ method: "POST" })
  .inputValidator(addressOp)
  .handler(({ data }) => submitAddress(data, request(), responseHeaders()));

/** site/loaders/wishlist (a loader: per visitor, never shared) */
export const $siteLoadersWishlist = createServerFn({ method: "GET" }).handler(() => {
  markPrivate();
  return loadWishlist({}, request());
});

/** site/actions/wishlist/submit */
export const $siteActionsWishlistSubmit = createServerFn({ method: "POST" })
  .inputValidator(z.object({ productID: z.string(), productGroupID: z.string() }))
  .handler(({ data }) => submitWishlist(data, request(), responseHeaders()));

/** site/actions/newsletter/subscribe */
export const $siteActionsNewsletterSubscribe = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string() }))
  .handler(({ data }) => subscribeNewsletter(data, request(), responseHeaders()));
