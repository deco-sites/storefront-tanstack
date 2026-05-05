import type { ProductDetailsPage } from "@decocms/apps/commerce/types";
import ProductHero, { type HeroCopyConfig } from "../../components/product/pdp/ProductHero";
import type { DiscountBadgeConfig } from "../../components/product/pdp/ProductDiscountBadge";
import type { GalleryConfig } from "../../components/product/pdp/ProductGallery";
import type { VariantSelectorConfig } from "../../components/product/pdp/ProductVariantSelector";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Section from "../../components/ui/Section";

export interface CopyConfig extends HeroCopyConfig {
  /**
   * @title Not-found title
   * @description Heading shown when the product loader returns no page
   * @default "Page not found"
   */
  notFoundTitle?: string;
  /**
   * @title Go-home label
   * @description Label for the button that links back to the homepage on not-found
   * @default "Go back to Home"
   */
  goHomeLabel?: string;
}

export interface Props {
  /**
   * @title Integration
   * @description Product details data returned by the commerce platform loader
   */
  page: ProductDetailsPage | null;

  /**
   * @title Gallery
   * @description Image slider appearance and loading behavior
   */
  galleryConfig?: GalleryConfig;

  /**
   * @title Discount badge
   * @description "% off" promo badge shown above the title
   */
  discountBadgeConfig?: DiscountBadgeConfig;

  /**
   * @title Variant selector
   * @description Swatches and preload strategy for sibling variants
   */
  variantSelectorConfig?: VariantSelectorConfig;

  /**
   * @title Copy
   * @description Editable labels (CTA, description heading, not-found fallback)
   */
  copy?: CopyConfig;
}

export default function ProductDetails({
  page,
  galleryConfig,
  discountBadgeConfig,
  variantSelectorConfig,
  copy,
}: Props) {
  if (!page) {
    const notFoundTitle = copy?.notFoundTitle ?? "Page not found";
    const goHomeLabel = copy?.goHomeLabel ?? "Go back to Home";
    return (
      <div className="flex w-full items-center justify-center py-28">
        <div className="flex flex-col items-center justify-center gap-6">
          <span className="text-2xl font-medium">{notFoundTitle}</span>
          <a href="/" className="no-animation btn">
            {goHomeLabel}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex w-full flex-col gap-4 px-5 py-4 sm:gap-5 sm:px-0 sm:py-5">
      <Breadcrumb itemListElement={page.breadcrumbList.itemListElement} />
      <ProductHero
        page={page}
        galleryConfig={galleryConfig}
        discountBadgeConfig={discountBadgeConfig}
        variantSelectorConfig={variantSelectorConfig}
        copy={copy}
      />
    </div>
  );
}

export const LoadingFallback = () => <Section.Placeholder height="635px" />;
