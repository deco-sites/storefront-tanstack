import { formatPrice } from "@decocms/apps/commerce/sdk/formatPrice";

export interface Props {
  price?: number;
  listPrice?: number;
  currencyCode?: string;
  /**
   * Show skeleton placeholders while a variant navigation is pending.
   * Skeleton dimensions match the rendered price block so there is no layout shift.
   */
  isLoading?: boolean;
}

export default function ProductPrice({ price = 0, listPrice, currencyCode, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex gap-3 pt-1" aria-hidden="true">
        <div className="h-9 w-32 skeleton rounded" />
        <div className="h-5 w-20 skeleton self-end rounded" />
      </div>
    );
  }

  const showCompare = listPrice != null && listPrice > price;

  return (
    <div className="flex gap-3 pt-1">
      <span className="text-base-400 text-3xl font-semibold">
        {formatPrice(price, currencyCode)}
      </span>
      {showCompare ? (
        <span className="self-end text-sm font-medium text-gray-400 line-through">
          {formatPrice(listPrice, currencyCode)}
        </span>
      ) : null}
    </div>
  );
}
