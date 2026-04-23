/* eslint-disable react-compiler/react-compiler -- file uses misnamed deco helper (useOffer) that triggers react-hooks rule disable */
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
  const viewItemListEvent = useSendEvent({
    on: "view",
    event: {
      name: "view_item_list",
      params: {
        item_list_name: title,
        items: (products ?? []).map((product, index) =>
          mapProductToAnalyticsItem({
            index,
            product,
            // eslint-disable-next-line react-hooks/rules-of-hooks -- useOffer is a misnamed pure helper from @decocms/apps, not a React hook
            ...(useOffer(product.offers)),
          })
        ),
      },
    },
  });
  if (!products || products.length === 0) {
    return null;
  }
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
