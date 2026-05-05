import { MINICART_DRAWER_ID } from "../../constants";
import Icon from "../ui/Icon";
import { useCart } from "../../platform/cart";

export default function Bag() {
  const { cart } = useCart();
  const count = cart.items.length;
  return (
    <label className="indicator" htmlFor={MINICART_DRAWER_ID} aria-label="open cart">
      {count > 0 && (
        <span className="indicator-item badge badge-sm font-thin badge-primary">
          {count > 9 ? "9+" : count}
        </span>
      )}
      <span className="no-animation btn btn-square btn-ghost btn-sm">
        <Icon id="shopping_bag" />
      </span>
    </label>
  );
}
