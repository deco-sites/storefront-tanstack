import { formatPrice } from "@decocms/apps/commerce/sdk/formatPrice";
import { useId } from "react";
import Icon from "../ui/Icon";

interface Props {
  total: number;
  target: number;
  locale: string;
  currency: string;
}

function FreeShippingProgressBar({ target, total, currency, locale }: Props) {
  const id = useId();
  const remaining = target - total;
  const percent = Math.floor((total / target) * 100);

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex justify-center items-center gap-2 text-primary">
        <Icon id="local_shipping" size={24} />
        {remaining > 0
          ? (
            <label htmlFor={id}>
              Just {formatPrice(remaining, currency, locale)}{" "}
              left to get free shipping!
            </label>
          )
          : <label htmlFor={id}>Você ganhou frete grátis!</label>}
      </div>
      <progress
        id={id}
        className="progress progress-primary w-full"
        value={percent}
        max={100}
      />
    </div>
  );
}

export default FreeShippingProgressBar;
