import { usePlatform } from "../../apps/site";
import {
  type WishlistState,
} from "../../platform/wishlist";
import {
  readWishlistCookie,
  serializeWishlistCookie,
} from "../../loaders/_cookie";

interface Props {
  productID: string;
  productGroupID: string;
}

async function action(
  props: Props,
  request: Request,
  responseHeaders: Headers,
): Promise<WishlistState> {
  if (!props?.productID) throw new Error("productID is required");

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
  const current = readWishlistCookie(request);
  const next: WishlistState = current.productIDs.includes(props.productID)
    ? {
      productIDs: current.productIDs.filter((id) => id !== props.productID),
    }
    : { productIDs: [...current.productIDs, props.productID] };

  responseHeaders.append("Set-Cookie", serializeWishlistCookie(next));
  return next;
}

export default action;
