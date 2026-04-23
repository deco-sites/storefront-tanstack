// TODO(phase-6 commerce): wire to real wishlist loader (VTEX/Wake/Shopify).
import type { Wishlist } from "../components/wishlist/Provider";

async function loader(
  _props?: unknown,
  _req?: Request,
  _ctx?: unknown,
): Promise<Wishlist> {
  return { productIDs: [] };
}

export default loader;
