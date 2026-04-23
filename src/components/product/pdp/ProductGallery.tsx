import { useId } from "react";
import { useRouterState } from "@tanstack/react-router";
import type { ImageObject } from "@decocms/apps/commerce/types";
import Image from "~/components/ui/Image";
import { clx } from "~/sdk/clx";
import Icon from "../../ui/Icon";
import Slider from "../../ui/Slider";
import ProductImageZoom from "../ProductImageZoom";

export interface GalleryConfig {
  /**
   * @title Image aspect ratio
   * @description CSS aspect-ratio value for the main image (e.g. "820 / 615")
   * @default "820 / 615"
   */
  aspectRatio?: string;
  /**
   * @title Enable zoom modal
   * @description Show a zoom button that opens a fullscreen viewer
   * @default true
   */
  enableZoom?: boolean;
  /**
   * @title Preload first image
   * @description Marks the LCP image with fetchpriority=high and loading=eager
   * @default true
   */
  preloadFirstImage?: boolean;
}

export interface Props {
  images: ImageObject[];
  config?: GalleryConfig;
}

const DEFAULT_WIDTH = 820;
const DEFAULT_HEIGHT = 615;

export default function ProductGallery({ images, config }: Props) {
  const id = useId();
  const zoomId = `${id}-zoom`;
  const isLoading = useRouterState({ select: (s) => s.isLoading });

  const aspectRatio = config?.aspectRatio ?? `${DEFAULT_WIDTH} / ${DEFAULT_HEIGHT}`;
  const enableZoom = config?.enableZoom ?? true;
  const preloadFirstImage = config?.preloadFirstImage ?? true;

  if (!images.length) return null;

  return (
    <>
      <div
        id={id}
        data-loading={isLoading ? "true" : undefined}
        className={clx(
          "grid grid-flow-row sm:grid-flow-col grid-cols-1 sm:grid-cols-[min-content_1fr] gap-5",
          "transition-opacity duration-150",
          "data-[loading=true]:opacity-60",
        )}
      >
        <div className="col-start-1 col-span-1 sm:col-start-2">
          <div className="relative h-min grow">
            <Slider className="carousel carousel-center gap-6 w-full">
              {images.map((img, index) => (
                <Slider.Item
                  key={img.url ?? index}
                  index={index}
                  className="carousel-item w-full"
                >
                  <Image
                    className="w-full"
                    sizes="(max-width: 640px) 100vw, 40vw"
                    style={{ aspectRatio }}
                    src={img.url!}
                    alt={img.alternateName}
                    width={DEFAULT_WIDTH}
                    height={DEFAULT_HEIGHT}
                    preload={preloadFirstImage && index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </Slider.Item>
              ))}
            </Slider>

            <Slider.PrevButton
              className="no-animation absolute left-2 top-1/2 btn btn-circle btn-outline disabled:invisible"
              disabled
            >
              <Icon id="chevron-right" className="rotate-180" />
            </Slider.PrevButton>

            <Slider.NextButton
              className="no-animation absolute right-2 top-1/2 btn btn-circle btn-outline disabled:invisible"
              disabled={images.length < 2}
            >
              <Icon id="chevron-right" />
            </Slider.NextButton>

            {enableZoom ? (
              <div className="absolute top-2 right-2 bg-base-100 rounded-full">
                <label
                  className="btn btn-ghost hidden sm:inline-flex"
                  htmlFor={zoomId}
                >
                  <Icon id="pan_zoom" />
                </label>
              </div>
            ) : null}
          </div>
        </div>

        <div className="col-start-1 col-span-1">
          <ul
            className={clx(
              "carousel carousel-center",
              "sm:carousel-vertical",
              "gap-2 max-w-full",
              "overflow-x-auto sm:overflow-y-auto",
            )}
            style={{ maxHeight: "600px" }}
          >
            {images.map((img, index) => (
              <li key={img.url ?? index} className="carousel-item w-16 h-16">
                <Slider.Dot index={index}>
                  <Image
                    style={{ aspectRatio: "1 / 1" }}
                    className="group-disabled:border-base-400 border rounded object-cover w-full h-full"
                    width={64}
                    height={64}
                    src={img.url!}
                    alt={img.alternateName}
                  />
                </Slider.Dot>
              </li>
            ))}
          </ul>
        </div>

        <Slider.JS rootId={id} />
      </div>
      {enableZoom ? (
        <ProductImageZoom
          id={zoomId}
          images={images}
          width={700}
          height={Math.trunc(700 * DEFAULT_HEIGHT / DEFAULT_WIDTH)}
        />
      ) : null}
    </>
  );
}

/**
 * Filter images by matching the product variant name in image alt text.
 * Mirrors Shopify's convention for associating per-variant images.
 * See https://community.shopify.com/c/shopify-discussions/i-can-not-add-multiple-pictures-for-my-variants/m-p/2416533
 */
export function filterImagesForVariant(
  images: ImageObject[] | undefined,
  productName: string | undefined,
): ImageObject[] {
  if (!images?.length) return [];
  if (!productName) return images;
  const matches = images.filter((img) =>
    productName.includes(img.alternateName || "")
  );
  return matches.length > 0 ? matches : images;
}
