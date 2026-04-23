import { Product } from "@decocms/apps/commerce/types";
import { clx } from "~/sdk/clx";
import Icon from "../ui/Icon";
import Slider from "../ui/Slider";
import ProductCard from "./ProductCard";
import { useId } from "react";

interface Props {
  products: Product[];
  itemListName?: string;
}

function ProductSlider({ products, itemListName }: Props) {
  const id = useId();

  return (
    <>
      <div
        id={id}
        className="grid grid-rows-1"
        style={{
          gridTemplateColumns: "min-content 1fr min-content",
        }}
      >
        <div className="col-start-1 col-span-3 row-start-1 row-span-1">
          <Slider className="carousel carousel-center sm:carousel-end gap-5 sm:gap-10 w-full">
            {products?.map((product, index) => (
              <Slider.Item
                index={index}
                className={clx(
                  "carousel-item",
                  "first:pl-5 first:sm:pl-0",
                  "last:pr-5 last:sm:pr-0",
                )}
              >
                <ProductCard
                  index={index}
                  product={product}
                  itemListName={itemListName}
                  className="w-[287px] sm:w-75"
                />
              </Slider.Item>
            ))}
          </Slider>
        </div>

        <div className="col-start-1 col-span-1 row-start-1 row-span-1 z-10 self-center p-2 relative bottom-[15%]">
          <Slider.PrevButton className="hidden sm:flex disabled:invisible btn btn-outline btn-sm btn-circle no-animation">
            <Icon id="chevron-right" className="rotate-180" />
          </Slider.PrevButton>
        </div>

        <div className="col-start-3 col-span-1 row-start-1 row-span-1 z-10 self-center p-2 relative bottom-[15%]">
          <Slider.NextButton className="hidden sm:flex disabled:invisible btn btn-outline btn-sm btn-circle no-animation">
            <Icon id="chevron-right" />
          </Slider.NextButton>
        </div>
      </div>
      <Slider.JS rootId={id} />
    </>
  );
}

export default ProductSlider;
