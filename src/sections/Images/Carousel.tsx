import type { ImageWidget } from "~/types/widgets";
import { Picture, Source } from "~/components/ui/Picture";
import Icon from "../../components/ui/Icon";
import Slider from "../../components/ui/Slider";
import { clx } from "~/sdk/clx";
import { useId } from "react";
import { useSendEvent } from "../../sdk/useSendEvent";
import { useDevice } from "@decocms/blocks/sdk/useDevice";
// useSetEarlyHints was a Deco Fresh-only hook; edge hints are now set via cacheHeaders.
const useSetEarlyHints = () => () => {};

/**
 * @titleBy alt
 */
export interface Banner {
  /** @description desktop otimized image */
  desktop: ImageWidget;

  /** @description mobile otimized image */
  mobile: ImageWidget;

  /** @description Image's alt text */
  alt: string;

  action?: {
    /** @description when user clicks on the image, go to this link */
    href: string;
    /** @description Image text title */
    title: string;
    /** @description Image text subtitle */
    subTitle: string;
    /** @description Button label */
    label: string;
  };
}

export interface Props {
  images?: Banner[];

  /**
   * @description Check this option when this banner is the biggest image on the screen for image optimizations
   */
  preload?: boolean;

  /**
   * @title Autoplay interval
   * @description time (in seconds) to start the carousel autoplay
   */
  interval?: number;
}

function BannerItem(
  { image, lcp }: { image: Banner; lcp?: boolean },
) {
  const {
    alt,
    mobile,
    desktop,
    action,
  } = image;
  const params = { promotion_name: image.alt };
  const setEarlyHint = useSetEarlyHints();
  const device = useDevice();

  const selectPromotionEvent = useSendEvent({
    on: "click",
    event: { name: "select_promotion", params },
  });

  const viewPromotionEvent = useSendEvent({
    on: "view",
    event: { name: "view_promotion", params },
  });

  return (
    <a
      {...selectPromotionEvent}
      href={action?.href ?? "#"}
      aria-label={action?.label}
      className="relative block overflow-y-hidden w-full"
    >
      {action && (
        <div
          className={clx(
            "absolute h-full w-full top-0 left-0",
            "flex flex-col justify-center items-center",
            "px-5 sm:px-0",
            "sm:right-40 sm:left-auto sm:items-end sm:max-w-96 sm:text-right",
          )}
        >
          <span className="text-7xl font-bold text-base-100">
            {action.title}
          </span>
          <span className="font-normal text-base text-base-100 pt-4 pb-12">
            {action.subTitle}
          </span>
          <button
            type="button"
            className="btn btn-primary btn-outline border-0 bg-base-100 min-w-45"
            aria-label={action.label}
          >
            {action.label}
          </button>
        </div>
      )}
      <Picture preload={lcp} {...viewPromotionEvent}>
        <Source
          media="(max-width: 767px)"
          fetchPriority={lcp ? "high" : "auto"}
          src={mobile}
          width={412}
          height={660}
          setEarlyHint={device === "mobile" ? setEarlyHint : undefined}
        />
        <Source
          media="(min-width: 768px)"
          fetchPriority={lcp ? "high" : "auto"}
          src={desktop}
          width={1440}
          height={600}
          setEarlyHint={device === "desktop" ? setEarlyHint : undefined}
          sizes="100vw"
        />
        <img
          className="object-cover w-full h-full"
          loading={lcp ? "eager" : "lazy"}
          // @ts-expect-error: fetchpriority is a valid HTML attribute not yet typed in preact
          fetchpriority={lcp ? "high" : "auto"}
          src={desktop}
          alt={alt}
        />
      </Picture>
    </a>
  );
}

function Carousel({ images = [], preload, interval }: Props) {
  const id = useId();

  return (
    <div
      id={id}
      className={clx(
        "grid",
        "grid-rows-[1fr_32px_1fr_64px]",
        "grid-cols-[32px_1fr_32px] min-h-[660px]",
        "sm:grid-cols-[112px_1fr_112px] sm:min-h-min",
        "w-screen",
      )}
    >
      <div className="col-span-full row-span-full">
        <Slider className="carousel carousel-center w-full gap-6">
          {images.map((image, index) => (
            <Slider.Item index={index} className="carousel-item w-full">
              <BannerItem image={image} lcp={index === 0 && preload} />
            </Slider.Item>
          ))}
        </Slider>
      </div>

      <div className="hidden sm:flex items-center justify-center z-10 col-start-1 row-start-2">
        <Slider.PrevButton
          className="btn btn-neutral btn-outline btn-circle no-animation btn-sm"
          disabled={false}
        >
          <Icon id="chevron-right" className="rotate-180" />
        </Slider.PrevButton>
      </div>

      <div className="hidden sm:flex items-center justify-center z-10 col-start-3 row-start-2">
        <Slider.NextButton
          className="btn btn-neutral btn-outline btn-circle no-animation btn-sm"
          disabled={false}
        >
          <Icon id="chevron-right" />
        </Slider.NextButton>
      </div>

      <ul
        className={clx(
          "col-span-full row-start-4 z-10",
          "carousel justify-center gap-3",
        )}
      >
        {images.map((_, index) => (
          <li className="carousel-item">
            <Slider.Dot
              index={index}
              className={clx(
                "bg-black opacity-20 h-3 w-3 no-animation rounded-full",
                "disabled:w-8 disabled:bg-base-100 disabled:opacity-100 transition-[width]",
              )}
            >
            </Slider.Dot>
          </li>
        ))}
      </ul>

      <Slider.JS rootId={id} interval={interval && interval * 1e3} infinite />
    </div>
  );
}

export default Carousel;

export const cache = "listing";

export function LoadingFallback() {
  // Reserve the carousel's real footprint to avoid CLS: the banner is a
  // full-width hero at min-h-[660px] on mobile and ~600px (1440x600 image) on
  // desktop. The previous fallback was a product-grid skeleton — wrong shape
  // and far shorter than the banner, causing a large layout shift on load.
  return (
    <div
      className="w-screen min-h-[660px] sm:min-h-[600px] bg-base-200 flex items-center justify-center"
      style={{ contentVisibility: "auto", containIntrinsicSize: "660px" }}
    >
      <span className="loading loading-spinner" />
    </div>
  );
}
