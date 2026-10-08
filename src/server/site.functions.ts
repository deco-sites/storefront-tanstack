/**
 * The site's own actions and per-shopper reads, as server functions. In v7 the browser reached them
 * through `/deco/invoke`; the next major has no invoke endpoint, so they're the framework's server
 * functions instead (/next/renames-and-migrations#loaders-actions-and-invoke).
 */
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
import { markPrivate } from "./private-response";

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

// The shopper's own wishlist and addresses: never shared, so never cached (src/server/edge-cache.ts).
export const getWishlistServerFn = createServerFn({ method: "GET" }).handler(() => {
  markPrivate();
  return loadWishlist(undefined, getRequest());
});

export const toggleWishlistServerFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ productID: z.string(), productGroupID: z.string() }))
  .handler(({ data }) => submitWishlist(data, getRequest(), getResponse().headers));

export const getAddressesServerFn = createServerFn({ method: "GET" }).handler(() => {
  markPrivate();
  return loadAddresses(getRequest());
});

export const submitAddressServerFn = createServerFn({ method: "POST" })
  .inputValidator(addressOp)
  .handler(({ data }) => submitAddress(data, getRequest(), getResponse().headers));

export const subscribeNewsletterServerFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string() }))
  .handler(({ data }) => subscribeNewsletter(data, getRequest(), getResponse().headers));

export const notifyMeServerFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ skuId: z.string(), email: z.string(), name: z.string().optional() }))
  .handler(({ data }) => subscribeNotifyMe(data));

export const simulateShippingServerFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ postalCode: z.string() }))
  .handler(({ data }) => simulateShipping(data));
