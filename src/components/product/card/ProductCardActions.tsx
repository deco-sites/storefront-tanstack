import type { AnalyticsItem } from "@decocms/apps/commerce/types";
import { Link } from "@tanstack/react-router";
import { clx } from "~/sdk/clx";
import { useAddToCart } from "../../../platform/cart";
import { useSendEvent } from "../../../sdk/useSendEvent";

const BUTTON_CLASS = clx(
  "btn",
  "no-animation w-full justify-start border-none px-0 !text-sm !font-medium btn-outline",
  "hover:!bg-transparent",
  "disabled:!bg-transparent disabled:!opacity-50",
);

export interface Props {
  productID: string;
  href: string;
  analyticsItem: AnalyticsItem;
  inStock: boolean;
}

export default function ProductCardActions({ productID, href, analyticsItem, inStock }: Props) {
  const addToCart = useAddToCart();

  const eventAttrs = useSendEvent({
    on: "click",
    event: { name: "add_to_cart", params: { items: [analyticsItem] } },
  });

  if (!inStock) {
    return (
      <Link
        to={href}
        preload="intent"
        className={clx(BUTTON_CLASS, "btn-error hover:!text-error disabled:!text-error")}
      >
        Sold out
      </Link>
    );
  }

  const label = addToCart.isPending
    ? "Adding..."
    : addToCart.isSuccess
      ? "Added!"
      : addToCart.isError
        ? "Try again"
        : "Add to Cart";

  return (
    <button
      type="button"
      {...eventAttrs}
      onClick={() => addToCart.mutate({ merchandiseId: productID, quantity: 1 })}
      disabled={addToCart.isPending}
      className={clx(
        BUTTON_CLASS,
        "btn-primary hover:!text-primary disabled:!text-primary",
        addToCart.isError && "btn-error",
      )}
    >
      {label}
    </button>
  );
}
