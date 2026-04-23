import { useState } from "react";
import type { Product } from "@decocms/apps/commerce/types";
import { mapProductToAnalyticsItem } from "@decocms/apps/commerce/utils/productToAnalyticsItem";
import { Link } from "@tanstack/react-router";
import { clx } from "~/sdk/clx";
import { useOffer } from "@decocms/apps/commerce/sdk/useOffer";
import { useSendEvent } from "../../../sdk/useSendEvent";
import { useVariantPossibilities } from "@decocms/apps/commerce/sdk/useVariantPossibilities";
import { relative } from "../../../sdk/url";
import WishlistButton from "../../wishlist/WishlistButton";
import { filterImagesForVariant } from "../pdp/ProductGallery";
import ProductCardImage from "./ProductCardImage";
import ProductCardTitle from "./ProductCardTitle";
import ProductCardPrice from "./ProductCardPrice";
import ProductCardVariants from "./ProductCardVariants";
import ProductCardActions from "./ProductCardActions";

export interface Props {
  product: Product;
  /** Preload card image */
  preload?: boolean;
  /** @description used for analytics event */
  itemListName?: string;
  /** @description index of the product card in the list */
  index?: number;
  className?: string;
}

const WIDTH = 287;
const HEIGHT = 287;
const ASPECT_RATIO = `${WIDTH} / ${HEIGHT}`;
const SHOE_SIZE_VARIANT = "shoe size";

export default function ProductCard({ product, preload, itemListName, index, className }: Props) {
  const { url, image: images, offers, isVariantOf } = product;
  const hasVariant = isVariantOf?.hasVariant ?? [];
  const title = isVariantOf?.name ?? product.name ?? "";

  const { listPrice, price, availability } = useOffer(offers);
  const inStock = availability === "https://schema.org/InStock";
  const possibilities = useVariantPossibilities(hasVariant, product);
  const firstSku = Object.entries(possibilities)?.[0];
  const variants = Object.entries(firstSku?.[1] ?? {});
  const relativeUrl = relative(url) ?? "/";

  const [selectedHref, setSelectedHref] = useState(relativeUrl);
  const selectedVariant = hasVariant.find((v) => relative(v.url) === selectedHref) ?? product;
  const variantImages = filterImagesForVariant(
    isVariantOf?.image ?? selectedVariant.image ?? images ?? [],
    selectedVariant.name,
  );
  const [front, back] = variantImages.length ? variantImages : (images ?? []);

  const percent = listPrice && price ? Math.round(((listPrice - price) / listPrice) * 100) : 0;

  const analyticsItem = mapProductToAnalyticsItem({
    product,
    price,
    listPrice,
    index,
  });

  const event = useSendEvent({
    on: "click",
    event: {
      name: "select_item" as const,
      params: { item_list_name: itemListName, items: [analyticsItem] },
    },
  });

  const firstAttr = firstSku?.[0];
  const showVariants = variants.length > 1 && firstAttr?.toLowerCase() !== SHOE_SIZE_VARIANT;

  return (
    <div {...event} className={clx("card-compact group card text-sm", className)}>
      <figure
        className={clx(
          "relative bg-base-200",
          "rounded border border-transparent",
          "group-hover:border-primary",
        )}
        style={{ aspectRatio: ASPECT_RATIO }}
      >
        {front && (
          <ProductCardImage
            href={selectedHref}
            frontUrl={front.url!}
            frontAlt={front.alternateName}
            backUrl={back?.url}
            backAlt={back?.alternateName}
            width={WIDTH}
            height={HEIGHT}
            preload={preload}
            inStock={inStock}
          />
        )}

        <div className="absolute top-0 left-0 flex w-full items-center justify-between">
          <span
            className={clx(
              "rounded-badge bg-error/15 px-2 py-1 text-center text-sm/4 font-normal text-black",
              inStock && "opacity-0",
            )}
          >
            Notify me
          </span>
          <span
            className={clx(
              "rounded-badge bg-primary/15 px-2 py-1 text-center text-sm/4 font-normal text-black",
              (percent < 1 || !inStock) && "opacity-0",
            )}
          >
            {percent} % off
          </span>
        </div>

        <div className="absolute right-0 bottom-0">
          <WishlistButton item={analyticsItem} variant="icon" />
        </div>
      </figure>

      <Link to={selectedHref} preload="intent" className="pt-5">
        <ProductCardTitle title={title} />
        <ProductCardPrice
          price={price}
          listPrice={listPrice}
          currencyCode={offers?.priceCurrency}
        />
      </Link>

      {showVariants && firstAttr && (
        <ProductCardVariants
          attrName={firstAttr}
          variants={variants as Array<readonly [string, string]>}
          selectedHref={selectedHref}
          onSelect={setSelectedHref}
        />
      )}

      <div className="grow" />

      <div>
        <ProductCardActions
          productID={selectedVariant.productID ?? product.productID}
          href={selectedHref}
          analyticsItem={analyticsItem}
          inStock={inStock}
        />
      </div>
    </div>
  );
}
