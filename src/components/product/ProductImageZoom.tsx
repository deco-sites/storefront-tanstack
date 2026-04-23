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

function ProductImageZoom({ images, width, height, id }: Props) {
  const fallbackId = useId();
  const resolvedId = id ?? fallbackId;
  const container = `${resolvedId}-container`;

  return (
    <Modal id={resolvedId}>
      <div
        id={container}
        className="modal-box grid w-11/12 max-w-7xl grid-cols-[48px_1fr_48px] grid-rows-1 place-items-center"
      >
        <Slider className="col-span-full col-start-1 row-span-full row-start-1 carousel h-full w-full">
          {images.map((image, index) => (
            <Slider.Item
              index={index}
              className="carousel-item h-full w-full items-center justify-center"
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

        <Slider.PrevButton className="btn col-start-1 col-end-2 row-span-full row-start-1 btn-circle btn-outline">
          <Icon id="chevron-right" className="rotate-180" />
        </Slider.PrevButton>

        <Slider.NextButton className="btn col-start-3 col-end-4 row-span-full row-start-1 btn-circle btn-outline">
          <Icon id="chevron-right" />
        </Slider.NextButton>
      </div>
      <Slider.JS rootId={container} />
    </Modal>
  );
}

export default ProductImageZoom;
