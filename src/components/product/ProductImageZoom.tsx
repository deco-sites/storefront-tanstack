import type { ImageObject } from "@decocms/apps/commerce/types";
import Image from "~/components/ui/Image";
import Icon from "../../components/ui/Icon";
import Modal from "../../components/ui/Modal";
import Slider from "../../components/ui/Slider";
import { useId } from "react";

export interface Props {
  id?: string;
  width: number;
  height: number;
  images: ImageObject[];
}

function ProductImageZoom({ images, width, height, id = useId() }: Props) {
  const container = `${id}-container`;

  return (
    <Modal id={id}>
      <div
        id={container}
        className="modal-box w-11/12 max-w-7xl grid grid-cols-[48px_1fr_48px] grid-rows-1 place-items-center"
      >
        <Slider className="carousel col-span-full col-start-1 row-start-1 row-span-full h-full w-full">
          {images.map((image, index) => (
            <Slider.Item
              index={index}
              className="carousel-item w-full h-full justify-center items-center"
            >
              <Image
                style={{ aspectRatio: `${width} / ${height}` }}
                src={image.url!}
                alt={image.alternateName}
                width={width}
                height={height}
                className="h-full w-auto"
              />
            </Slider.Item>
          ))}
        </Slider>

        <Slider.PrevButton className="btn btn-circle btn-outline col-start-1 col-end-2 row-start-1 row-span-full">
          <Icon id="chevron-right" className="rotate-180" />
        </Slider.PrevButton>

        <Slider.NextButton className="btn btn-circle btn-outline col-start-3 col-end-4 row-start-1 row-span-full">
          <Icon id="chevron-right" />
        </Slider.NextButton>
      </div>
      <Slider.JS rootId={container} />
    </Modal>
  );
}

export default ProductImageZoom;
