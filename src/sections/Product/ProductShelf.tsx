import type { Product } from "@decocms/apps/commerce/types";
import { mapProductToAnalyticsItem } from "@decocms/apps/commerce/utils/productToAnalyticsItem";
import ProductSlider from "../../components/product/ProductSlider";
import Section, {
  Props as SectionHeaderProps,
} from "../../components/ui/Section";
import { useOffer } from "@decocms/apps/commerce/sdk/useOffer";
import { useSendEvent } from "../../sdk/useSendEvent";
import { type LoadingFallbackProps } from "~/types/deco";
export interface Props extends SectionHeaderProps {
  products: Product[] | null;
}
export default function ProductShelf({ products, title, cta }: Props) {
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
    <Section.Container {...viewItemListEvent}>
      <Section.Header title={title} cta={cta} />

      <ProductSlider products={products} itemListName={title} />
    </Section.Container>
  );
}
export const LoadingFallback = (
  { title, cta }: LoadingFallbackProps<Props>,
) => (
  <Section.Container>
    <Section.Header title={title} cta={cta} />
    <Section.Placeholder height="471px" />;
  </Section.Container>
);
