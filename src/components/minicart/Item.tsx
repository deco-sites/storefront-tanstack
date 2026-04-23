import { AnalyticsItem } from "@decocms/apps/commerce/types";
import Image from "~/components/ui/Image";
import { clx } from "~/sdk/clx";
import { formatPrice } from "@decocms/apps/commerce/sdk/formatPrice";
import Icon from "../ui/Icon";
import QuantitySelector from "../ui/QuantitySelector";
import { useScript } from "@decocms/start/sdk/useScript";
export type Item = AnalyticsItem & {
  listPrice: number;
  image: string;
};
export interface Props {
  item: Item;
  index: number;
  locale: string;
  currency: string;
}
const QUANTITY_MAX_VALUE = 100;
const removeItemHandler = () => {
  const itemID = (event?.currentTarget as HTMLButtonElement | null)
    ?.closest("fieldset")
    ?.getAttribute("data-item-id");
  if (typeof itemID === "string") {
    window.STOREFRONT.CART.setQuantity(itemID, 0);
  }
};
function CartItem({ item, index, locale, currency }: Props) {
  const { image, listPrice, price = Infinity, quantity } = item;
  const isGift = price < 0.01;
  const name = (item as any).item_name;
  return (
    <fieldset
      data-item-id={(item as any).item_id}
      className="grid grid-rows-1 gap-2"
      style={{ gridTemplateColumns: "auto 1fr" }}
    >
      <Image
        alt={name}
        src={image}
        style={{ aspectRatio: "108 / 150" }}
        width={108}
        height={150}
        className="h-full object-contain"
      />

      {/* Info */}
      <div className="flex flex-col gap-2">
        {/* Name and Remove button */}
        <div className="flex justify-between items-center">
          <legend>{name}</legend>
          <button
            type="button"
            className={clx(
              isGift && "hidden",
              "btn btn-ghost btn-square no-animation",
            )}
            hx-on:click={useScript(removeItemHandler)}
          >
            <Icon id="trash" size={24} />
          </button>
        </div>

        {/* Price Block */}
        <div className="flex items-center gap-2">
          <span className="line-through text-sm">
            {formatPrice(listPrice, currency, locale)}
          </span>
          <span className="text-sm text-secondary">
            {isGift ? "Grátis" : formatPrice(price, currency, locale)}
          </span>
        </div>

        {/* Quantity Selector */}
        <div className={clx(isGift && "hidden")}>
          <QuantitySelector
            min={0}
            max={QUANTITY_MAX_VALUE}
            value={quantity}
            name={`item::${index}`}
          />
        </div>
      </div>
    </fieldset>
  );
}
export default CartItem;
