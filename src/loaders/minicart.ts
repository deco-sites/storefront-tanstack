// TODO(phase-6 commerce): real cart loader per active commerce platform.
// Current implementation returns an empty cart so the build stays green.
import type { Minicart } from "../components/minicart/Minicart";

async function loader(_props?: unknown, _req?: Request, _ctx?: unknown): Promise<Minicart> {
  return {
    platformCart: {},
    storefront: {
      items: [],
      total: 0,
      subtotal: 0,
      coupon: undefined,
      discounts: 0,
      currency: "USD",
      locale: "en-US",
      enableCoupon: false,
      freeShippingTarget: 0,
      checkoutHref: "/checkout",
    },
  } as unknown as Minicart;
}

export default loader;
