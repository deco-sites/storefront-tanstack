import { formatPrice } from "@decocms/apps/commerce/sdk/formatPrice";

export interface Props {
  price?: number;
  listPrice?: number;
  currencyCode?: string;
}

export default function ProductPrice({
  price = 0,
  listPrice,
  currencyCode,
}: Props) {
  const showCompare = listPrice != null && listPrice > price;

  return (
    <div className="flex gap-3 pt-1">
      <span className="text-3xl font-semibold text-base-400">
        {formatPrice(price, currencyCode)}
      </span>
      {showCompare ? (
        <span className="line-through text-sm font-medium text-gray-400 self-end">
          {formatPrice(listPrice, currencyCode)}
        </span>
      ) : null}
    </div>
  );
}
