import { formatPrice } from "@decocms/apps/commerce/sdk/formatPrice";

export interface Props {
  price?: number;
  listPrice?: number;
  currencyCode?: string;
}

export default function ProductCardPrice({
  price = 0,
  listPrice,
  currencyCode,
}: Props) {
  const showCompare = listPrice != null && listPrice > price;
  return (
    <div className="flex gap-2 pt-2">
      {showCompare ? (
        <span className="line-through font-normal text-gray-400">
          {formatPrice(listPrice, currencyCode)}
        </span>
      ) : null}
      <span className="font-medium text-base-400">
        {formatPrice(price, currencyCode)}
      </span>
    </div>
  );
}
