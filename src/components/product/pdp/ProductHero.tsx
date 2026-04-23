import type { ProductDetailsPage } from "@decocms/apps/commerce/types";
import { useOffer } from "@decocms/apps/commerce/sdk/useOffer";
import { mapProductToAnalyticsItem } from "@decocms/apps/commerce/utils/productToAnalyticsItem";
import { useSendEvent } from "../../../sdk/useSendEvent";
import { clx } from "~/sdk/clx";
import ProductActions, { type ActionsCopyConfig } from "./ProductActions";
import ProductDescription from "./ProductDescription";
import ProductDiscountBadge, {
  type DiscountBadgeConfig,
} from "./ProductDiscountBadge";
import ProductGallery, {
  filterImagesForVariant,
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
  const { breadcrumbList, product } = page;
  const { offers, isVariantOf } = product;

  const title = isVariantOf?.name ?? product.name ?? "";
  const description = product.description || isVariantOf?.description;

  const { price = 0, listPrice, seller = "1", availability } = useOffer(offers);
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

  const images = filterImagesForVariant(
    isVariantOf?.image ?? product.image ?? [],
    title,
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
        <ProductDiscountBadge percent={percent} config={discountBadgeConfig} />
        <ProductTitle name={title} />
        <ProductPrice
          price={price}
          listPrice={listPrice}
          currencyCode={offers?.priceCurrency}
        />

        {hasValidVariants ? (
          <div className="mt-4 sm:mt-8">
            <ProductVariantSelector
              product={product}
              config={variantSelectorConfig}
            />
          </div>
        ) : null}

        <ProductActions
          product={product}
          analyticsItem={analyticsItem}
          isInStock={isInStock}
          copy={copy}
        />

        <ProductShipping sku={product.sku} seller={seller} />

        <ProductDescription
          html={description}
          label={copy?.descriptionLabel}
        />
      </div>
    </div>
  );
}
