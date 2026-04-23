import { formatPrice } from "@decocms/apps/commerce/sdk/formatPrice";

export interface Props {
  price?: number;
  listPrice?: number;
  currencyCode?: string;
}

export default function ProductCardPrice({ price = 0, listPrice, currencyCode }: Props) {
  const showCompare = listPrice != null && listPrice > price;
  return (
    <div className="flex gap-2 pt-2">
      {showCompare ? (
        <span className="font-normal text-gray-400 line-through">
          {formatPrice(listPrice, currencyCode)}
        </span>
      ) : null}
      <span className="text-base-400 font-medium">{formatPrice(price, currencyCode)}</span>
    </div>
  );
}
