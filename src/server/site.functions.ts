/**
 * The site's own actions and per-shopper reads, as server functions. In v7 the browser reached them
 * through `/deco/invoke`; the next major has no invoke endpoint, so they're the framework's server
 * functions instead (/next/renames-and-migrations#loaders-actions-and-invoke).
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest, getResponse } from "@tanstack/react-start/server";
import submitAddress, { type AddressOp } from "../actions/address/submit";
import subscribeNewsletter, {
  type SubscribeNewsletterProps,
} from "../actions/newsletter/subscribe";
import subscribeNotifyMe, { type NotifyMeProps } from "../actions/notifyMe/subscribe";
import simulateShipping from "../actions/shipping/simulate";
import submitWishlist from "../actions/wishlist/submit";
import loadAddresses from "../loaders/address";
import loadWishlist from "../loaders/wishlist";

export const getWishlistServerFn = createServerFn({ method: "GET" }).handler(() =>
  loadWishlist(undefined, getRequest()),
);

export const toggleWishlistServerFn = createServerFn({ method: "POST" })
  .inputValidator((input: { productID: string; productGroupID: string }) => input)
  .handler(({ data }) => submitWishlist(data, getRequest(), getResponse().headers));

export const getAddressesServerFn = createServerFn({ method: "GET" }).handler(() =>
  loadAddresses(getRequest()),
);

export const submitAddressServerFn = createServerFn({ method: "POST" })
  .inputValidator((input: AddressOp) => input)
  .handler(({ data }) => submitAddress(data, getRequest(), getResponse().headers));

export const subscribeNewsletterServerFn = createServerFn({ method: "POST" })
  .inputValidator((input: SubscribeNewsletterProps) => input)
  .handler(({ data }) => subscribeNewsletter(data, getRequest(), getResponse().headers));

export const notifyMeServerFn = createServerFn({ method: "POST" })
  .inputValidator((input: NotifyMeProps) => input)
  .handler(({ data }) => subscribeNotifyMe(data));

export const simulateShippingServerFn = createServerFn({ method: "POST" })
  .inputValidator((input: { postalCode: string }) => input)
  .handler(({ data }) => simulateShipping(data));
