import type { Product } from "@decocms/apps/commerce/types";
import { mapProductToAnalyticsItem } from "@decocms/apps/commerce/utils/productToAnalyticsItem";
import ProductSlider from "../../components/product/ProductSlider";
import Section, {
  Props as SectionHeaderProps,
} from "../../components/ui/Section";
import { useOffer } from "@decocms/apps/commerce/sdk/useOffer";
import { useSendEvent } from "../../sdk/useSendEvent";
import { type LoadingFallbackProps } from "~/types/deco";
/** @titleBy title */
interface Tab {
  title: string;
  products: Product[] | null;
}
export interface Props extends SectionHeaderProps {
  tabs: Tab[];
  /** @hide true */
  tabIndex?: number;
}
export default function TabbedProductShelf(
  { tabs, title, cta, tabIndex }: Props,
) {
  const ti = typeof tabIndex === "number"
    ? Math.min(Math.max(tabIndex, 0), tabs.length)
    : 0;
  const { products } = tabs[ti];
  const viewItemListEvent = useSendEvent({
    on: "view",
    event: {
      name: "view_item_list",
      params: {
        item_list_name: title,
        items: products?.map((product, index) =>
          mapProductToAnalyticsItem({
            index,
            product,
            ...(useOffer(product.offers)),
          })
        ) ?? [],
      },
    },
  });
  return (
    <Section.Container {...viewItemListEvent}>
      <Section.Header title={title} cta={cta} />

      <Section.Tabbed>
        {!products?.length
          ? (
            <div className="flex justify-center items-center">
              No Products found
            </div>
          )
          : <ProductSlider products={products} itemListName={title} />}
      </Section.Tabbed>
    </Section.Container>
  );
}
export const LoadingFallback = (
  { title, cta }: LoadingFallbackProps<Props>,
) => (
  <Section.Container>
    <Section.Header title={title} cta={cta} />

    <Section.Tabbed>
      <Section.Placeholder height="471px" />
    </Section.Tabbed>
  </Section.Container>
);
