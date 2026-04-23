import { AnalyticsItem } from "@decocms/apps/commerce/types";
import { clx } from "~/sdk/clx";
import { useId } from "react";
import { useSendEvent } from "../../sdk/useSendEvent";
import Icon from "../ui/Icon";
import { useScript } from "@decocms/start/sdk/useScript";
interface Props {
  variant?: "full" | "icon";
  item: AnalyticsItem;
}
const onLoad = (id: string, productID: string) =>
  window.STOREFRONT.WISHLIST.subscribe((sdk) => {
    const button = document.getElementById(id) as HTMLButtonElement;
    const inWishlist = sdk.inWishlist(productID);
    button.disabled = false;
    button.classList.remove("htmx-request");
    button.querySelector("svg")?.setAttribute(
      "fill",
      inWishlist ? "black" : "none",
    );
    const span = button.querySelector("span");
    if (span) {
      span.innerHTML = inWishlist ? "Remove from wishlist" : "Add to wishlist";
    }
  });
const onClick = (productID: string, productGroupID: string) => {
  const button = event?.currentTarget as HTMLButtonElement;
  const user = window.STOREFRONT.USER.getUser();
  if (user?.email) {
    button.classList.add("htmx-request");
    window.STOREFRONT.WISHLIST.toggle(productID, productGroupID);
  } else {
    window.alert(`Please login to add the product to your wishlist`);
  }
};
function WishlistButton({ item, variant = "full" }: Props) {
  const productID = (item as any).item_id;
  const productGroupID = item.item_group_id ?? "";
  const id = useId();
  const addToWishlistEvent = useSendEvent({
    on: "click",
    event: {
      name: "add_to_wishlist",
      params: { items: [item] },
    },
  });
  return (
    <>
      <button
        id={id}
        data-wishlist-button
        disabled
        {...addToWishlistEvent}
        aria-label="Add to wishlist"
        hx-on:click={useScript(onClick, productID, productGroupID)}
        className={clx(
          "btn no-animation",
          variant === "icon"
            ? "btn-circle btn-ghost btn-sm"
            : "btn-primary btn-outline gap-2 w-full",
        )}
      >
        <Icon id="favorite" className="[.htmx-request_&]:hidden" fill="none" />
        {variant === "full" && (
          <span className="[.htmx-request_&]:hidden">Add to wishlist</span>
        )}
        <span className="[.htmx-request_&]:inline hidden loading loading-spinner" />
      </button>
      <script
        type="module"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: useScript(onLoad, id, productID) }}
      />
    </>
  );
}
export default WishlistButton;
