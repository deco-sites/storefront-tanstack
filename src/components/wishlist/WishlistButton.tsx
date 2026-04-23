import type { AnalyticsItem } from "@decocms/apps/commerce/types";
import { useNavigate } from "@tanstack/react-router";
import { clx } from "~/sdk/clx";
import { useSendEvent } from "../../sdk/useSendEvent";
import { useToggleWishlist, useWishlist } from "../../platform/wishlist";
import { useUser } from "../../platform/user";
import Icon from "../ui/Icon";

interface Props {
  variant?: "full" | "icon";
  item: AnalyticsItem;
}

function WishlistButton({ item, variant = "full" }: Props) {
  const productID = (item as { item_id: string }).item_id;
  const productGroupID = item.item_group_id ?? "";

  const { isInWishlist } = useWishlist();
  const toggle = useToggleWishlist();
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();

  const inWishlist = isInWishlist(productID);
  const pending = toggle.isPending &&
    toggle.variables?.productID === productID;

  const addToWishlistEvent = useSendEvent({
    on: "click",
    event: { name: "add_to_wishlist", params: { items: [item] } },
  });

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }
    toggle.mutate({ productID, productGroupID });
  };

  return (
    <button
      type="button"
      data-wishlist-button
      disabled={pending}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={inWishlist}
      onClick={handleClick}
      {...addToWishlistEvent}
      className={clx(
        "btn no-animation",
        variant === "icon"
          ? "btn-circle btn-ghost btn-sm"
          : "btn-primary btn-outline gap-2 w-full",
      )}
    >
      {pending
        ? <span className="loading loading-spinner" />
        : (
          <>
            <Icon id="favorite" fill={inWishlist ? "black" : "none"} />
            {variant === "full" && (
              <span>
                {inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              </span>
            )}
          </>
        )}
    </button>
  );
}

export default WishlistButton;
