import { usePlatform } from "../apps/site";
import { EMPTY_WISHLIST, type WishlistState } from "../platform/wishlist";
import { readWishlistCookie } from "./_cookie";

async function loader(_props?: unknown, req?: Request): Promise<WishlistState> {
  const platform = usePlatform();

  if (platform === "vtex") {
    // TODO(consumer): call the real VTEX wishlist loader, e.g.
    //   const list = await invoke("vtex/loaders/wishlist.ts");
    //   return { productIDs: list.map((i) => i.sku) };
  }
  if (platform === "wake") {
    // TODO(consumer): wire wake wishlist endpoint here.
  }

  // Default: cookie-backed so the demo works without a backend.
  return req ? readWishlistCookie(req) : EMPTY_WISHLIST;
}

export default loader;
