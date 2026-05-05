import { Product } from "@decocms/apps/commerce/types";
import { clx } from "~/sdk/clx";
import Icon from "../ui/Icon";
import Slider from "../ui/Slider";
import ProductCard from "./card/ProductCard";
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
        <div className="col-span-3 col-start-1 row-span-1 row-start-1">
          <Slider className="carousel w-full carousel-center gap-5 sm:carousel-end sm:gap-10">
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

        <div className="relative bottom-[15%] z-10 col-span-1 col-start-1 row-span-1 row-start-1 self-center p-2">
          <Slider.PrevButton className="no-animation btn hidden btn-circle btn-outline btn-sm disabled:invisible sm:flex">
            <Icon id="chevron-right" className="rotate-180" />
          </Slider.PrevButton>
        </div>

        <div className="relative bottom-[15%] z-10 col-span-1 col-start-3 row-span-1 row-start-1 self-center p-2">
          <Slider.NextButton className="no-animation btn hidden btn-circle btn-outline btn-sm disabled:invisible sm:flex">
            <Icon id="chevron-right" />
          </Slider.NextButton>
        </div>
      </div>
      <Slider.JS rootId={id} />
    </>
  );
}

export default ProductSlider;
