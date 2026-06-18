import { useMutationState } from "@tanstack/react-query";
import { MINICART_DRAWER_ID } from "../../constants";
import Icon from "../ui/Icon";
import { useCart } from "../../platform/cart";

export default function Bag() {
  const { cart } = useCart();
  const count = cart.items.length;
  // Global "cart busy" indicator: any in-flight cart mutation (add/update/
  // remove) from anywhere in the tree, read via useMutationState by the
  // ["cart", …] mutationKey — no prop drilling.
  const busy = useMutationState({
    filters: { mutationKey: ["cart"], status: "pending" },
  }).length > 0;
  return (
    <label
      className="indicator"
      htmlFor={MINICART_DRAWER_ID}
      aria-label="open cart"
    >
      {count > 0 && (
        <span className="indicator-item badge badge-primary badge-sm font-thin">
          {count > 9 ? "9+" : count}
        </span>
      )}
      <span className="btn btn-square btn-sm btn-ghost no-animation">
        {busy
          ? <span className="loading loading-spinner loading-xs" />
          : <Icon id="shopping_bag" />}
      </span>
    </label>
  );
}
