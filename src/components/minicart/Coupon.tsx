import { MINICART_FORM_ID } from "../../constants";
import { useScript } from "@decocms/start/sdk/useScript";
export interface Props {
  coupon?: string;
}
function Coupon({ coupon }: Props) {
  return (
    <div className="flex justify-between items-center px-4">
      <span className="text-sm">Discount coupon</span>

      <button
        type="button"
        className="btn btn-ghost underline font-normal no-animation"
        hx-on:click={useScript(() => {
          event?.stopPropagation();
          const button = event?.currentTarget as HTMLButtonElement;
          button.classList.add("hidden");
          button.nextElementSibling?.classList.remove("hidden");
        })}
      >
        {coupon || "Add"}
      </button>

      {/* Displayed when checkbox is checked=true */}
      <div className="join hidden">
        <input
          form={MINICART_FORM_ID}
          name="coupon"
          className="input join-item"
          type="text"
          value={coupon ?? ""}
          placeholder="Cupom"
        />
        <button
          type="submit"
          form={MINICART_FORM_ID}
          className="btn join-item"
          name="action"
          value="set-coupon"
        >
          Ok
        </button>
      </div>
    </div>
  );
}
export default Coupon;
