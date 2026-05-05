import type { Product } from "@decocms/apps/commerce/types";
import { clx } from "~/sdk/clx";
import ProductCard from "../product/card/ProductCard";

export interface Props {
  products: Product[];
  /** Index offset of the first product in the slice (used for analytics) */
  offset?: number;
}

export default function SearchResultGrid({ products, offset = 0 }: Props) {
  return (
    <div
      data-product-list
      className={clx(
        "grid items-center",
        "grid-cols-2 gap-2",
        "sm:grid-cols-4 sm:gap-10",
        "w-full",
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={`product-card-${product.productID}`}
          product={product}
          preload={index === 0}
          index={offset + index}
          className="h-full max-w-75 min-w-40"
        />
      ))}
    </div>
  );
}
