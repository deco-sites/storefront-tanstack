import type { Product } from "../../vendor/commerce/types";
import { mapProductToAnalyticsItem } from "../../vendor/commerce/utils/productToAnalyticsItem";
import ProductSlider from "../../components/product/ProductSlider";
import Section, {
  Props as SectionHeaderProps,
} from "../../components/ui/Section";
import { useOffer } from "../../vendor/commerce/sdk/useOffer";
import { useSendEvent } from "../../sdk/useSendEvent";
import DeviceVisible, {
  type VisibilityConfig,
} from "../../components/ui/DeviceVisible";
export interface Props extends SectionHeaderProps, VisibilityConfig {
  products: Product[] | null;
}
export default function ProductShelf(
  { products, title, cta, visibility }: Props,
) {
  if (!products || products.length === 0) {
    return null;
  }
  const viewItemListEvent = useSendEvent({
    on: "view",
    event: {
      name: "view_item_list",
      params: {
        item_list_name: title,
        items: products.map((product, index) =>
          mapProductToAnalyticsItem({
            index,
            product,
            ...(useOffer(product.offers)),
          })
        ),
      },
    },
  });
  return (
    <DeviceVisible visibility={visibility}>
      <Section.Container {...viewItemListEvent}>
        <Section.Header title={title} cta={cta} />

        <ProductSlider products={products} itemListName={title} />
      </Section.Container>
    </DeviceVisible>
  );
}
