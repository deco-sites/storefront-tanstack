import type { ProductDetailsPage } from "@decocms/apps-commerce/types";
import { useOffer } from "@decocms/apps-commerce/sdk/useOffer";
import { mapProductToAnalyticsItem } from "@decocms/apps-commerce/utils/productToAnalyticsItem";
import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { relative } from "../../../sdk/url";
import { useSendEvent } from "../../../sdk/useSendEvent";
import { clx } from "~/sdk/clx";
import ProductActions, { type ActionsCopyConfig } from "./ProductActions";
import ProductDescription from "./ProductDescription";
import ProductDiscountBadge, {
  type DiscountBadgeConfig,
} from "./ProductDiscountBadge";
import ProductGallery, {
  filterImagesForVariant,
  withVariantImageFirst,
  type GalleryConfig,
} from "./ProductGallery";
import ProductPrice from "./ProductPrice";
import ProductShipping from "./ProductShipping";
import ProductTitle from "./ProductTitle";
import ProductVariantSelector, {
  type VariantSelectorConfig,
} from "./ProductVariantSelector";

export interface HeroCopyConfig extends ActionsCopyConfig {
  /**
   * @title Description label
   * @description Heading for the collapsible description block
   * @default "Description"
   */
  descriptionLabel?: string;
}

export interface Props {
  page: ProductDetailsPage;
  galleryConfig?: GalleryConfig;
  discountBadgeConfig?: DiscountBadgeConfig;
  variantSelectorConfig?: VariantSelectorConfig;
  copy?: HeroCopyConfig;
}

export default function ProductHero({
  page,
  galleryConfig,
  discountBadgeConfig,
  variantSelectorConfig,
  copy,
}: Props) {
  const isLoading = useRouterState({ select: (s) => s.isLoading });

  const { breadcrumbList } = page;

  // Variant switching happens in place: every sibling SKU is already in
  // `isVariantOf.hasVariant`, so swapping it locally (and just rewriting the
  // URL) avoids a full route navigation that re-runs the page loader and
  // remounts header/footer/shelves. A reload of the new URL renders the same
  // variant server-side.
  const [selected, setSelected] = useState<{ from: typeof page.product; url: string } | null>(null);
  const variants = page.product.isVariantOf?.hasVariant ?? [];
  const selectedVariant = selected?.from === page.product
    ? variants.find((v) => relative(v.url) === selected.url)
    : undefined;
  const product = selectedVariant
    ? { ...selectedVariant, isVariantOf: page.product.isVariantOf }
    : page.product;

  const selectVariant = (href: string) => {
    const match = variants.find((v) => relative(v.url) === href);
    if (!match) return;
    setSelected({ from: page.product, url: href });
    // The router patches `history.replaceState` to trigger a navigation, so
    // call the native one: only the address bar should change.
    History.prototype.replaceState.call(window.history, window.history.state, "", href);
  };
  const { offers, isVariantOf } = product;

  const title = isVariantOf?.name ?? product.name ?? "";
  const description = product.description || isVariantOf?.description;

  const { price = 0, listPrice, availability } = useOffer(offers);
  const isInStock = availability === "https://schema.org/InStock";

  const percent = listPrice && price
    ? Math.round(((listPrice - price) / listPrice) * 100)
    : 0;

  const hasValidVariants = isVariantOf?.hasVariant?.some(
    (v) =>
      v?.name?.toLowerCase() !== "title" &&
      v?.name?.toLowerCase() !== "default title",
  ) ?? false;

  const analyticsBreadcrumb = {
    ...breadcrumbList,
    itemListElement: breadcrumbList?.itemListElement?.slice(0, -1) ?? [],
    numberOfItems: Math.max(0, (breadcrumbList?.numberOfItems ?? 0) - 1),
  };

  const analyticsItem = mapProductToAnalyticsItem({
    product,
    breadcrumbList: analyticsBreadcrumb,
    price,
    listPrice,
  });

  const viewItemEvent = useSendEvent({
    on: "view",
    event: {
      name: "view_item",
      params: {
        item_list_id: "product",
        item_list_name: "Product",
        items: [analyticsItem],
      },
    },
  });

  // Filter against the variant name (e.g. "Tote Bag — Yellow"), not the
  // parent family name in `title` — otherwise no per-variant filtering happens.
  // Shopify exposes the selected variant's own photo as `product.image[0]`;
  // lead the gallery with it so switching color swaps the main image.
  const images = withVariantImageFirst(
    filterImagesForVariant(
      isVariantOf?.image ?? product.image ?? [],
      product.name,
    ),
    product.image?.[0],
  );

  return (
    <div
      {...viewItemEvent}
      className={clx(
        "container grid",
        "grid-cols-1 gap-2 py-0",
        "sm:grid-cols-5 sm:gap-6",
      )}
    >
      <div className="sm:col-span-3">
        <ProductGallery images={images} config={galleryConfig} />
      </div>

      <div className="sm:col-span-2 flex flex-col">
        <ProductDiscountBadge
          percent={percent}
          config={discountBadgeConfig}
          isLoading={isLoading}
        />
        <ProductTitle name={title} isLoading={isLoading} />
        <ProductPrice
          price={price}
          listPrice={listPrice}
          currencyCode={offers?.priceCurrency}
          isLoading={isLoading}
        />

        {hasValidVariants ? (
          <div className="mt-4 sm:mt-8">
            <ProductVariantSelector
              product={product}
              config={variantSelectorConfig}
              onSelect={selectVariant}
            />
          </div>
        ) : null}

        <ProductActions
          product={product}
          analyticsItem={analyticsItem}
          isInStock={isInStock}
          copy={copy}
        />

        <ProductShipping currencyCode={offers?.priceCurrency} />

        <ProductDescription
          html={description}
          label={copy?.descriptionLabel}
        />
      </div>
    </div>
  );
}
