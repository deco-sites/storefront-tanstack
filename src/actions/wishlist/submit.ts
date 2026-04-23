import { RequestContext } from "@decocms/start/sdk/requestContext";
import { usePlatform } from "../../apps/site";
import { EMPTY_WISHLIST, type WishlistState } from "../../platform/wishlist";
import { readWishlistCookie, serializeWishlistCookie } from "../../loaders/_cookie";

interface Props {
  productID: string;
  productGroupID: string;
}

async function action(props: Props, req?: Request): Promise<WishlistState> {
  if (!props?.productID) throw new Error("productID is required");

  const request = req ?? RequestContext.current?.request;
  const platform = usePlatform();

  if (platform === "vtex") {
    // TODO(consumer): real VTEX wishlist toggle, e.g.
    //   const list = await invoke("vtex/loaders/wishlist.ts");
    //   const item = list.find((i) => i.sku === props.productID);
    //   const next = item
    //     ? await invoke("vtex/actions/wishlist/removeItem.ts", { id: item.id })
    //     : await invoke("vtex/actions/wishlist/addItem.ts", {
    //         sku: props.productID, productId: props.productGroupID,
    //       });
    //   return { productIDs: next.map((i) => i.sku) };
  }
  if (platform === "wake") {
    // TODO(consumer): wire wake wishlist endpoint here.
  }

  // Default: cookie-backed so the demo persists per-browser without a backend.
  const current = request ? readWishlistCookie(request) : EMPTY_WISHLIST;
  const next: WishlistState = current.productIDs.includes(props.productID)
    ? {
        productIDs: current.productIDs.filter((id) => id !== props.productID),
      }
    : { productIDs: [...current.productIDs, props.productID] };

  RequestContext.responseHeaders.append("Set-Cookie", serializeWishlistCookie(next));
  return next;
}

export default action;
