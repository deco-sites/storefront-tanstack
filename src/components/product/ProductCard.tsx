import type { Product } from "@decocms/apps/commerce/types";
import { mapProductToAnalyticsItem } from "@decocms/apps/commerce/utils/productToAnalyticsItem";
import Image from "~/components/ui/Image";
import { clx } from "~/sdk/clx";
import { formatPrice } from "@decocms/apps/commerce/sdk/formatPrice";
import { relative } from "../../sdk/url";
import { useOffer } from "@decocms/apps/commerce/sdk/useOffer";
import { useSendEvent } from "../../sdk/useSendEvent";
import { useVariantPossibilities } from "@decocms/apps/commerce/sdk/useVariantPossibilities";
import WishlistButton from "../wishlist/WishlistButton";
import AddToCartButton from "./AddToCartButton";
import { useId } from "react";

const SWATCH_COLORS: Record<string, string | undefined> = {
  White: "white",
  Black: "black",
  Gray: "gray",
  Blue: "#99CCFF",
  Green: "#aad1b5",
  Yellow: "#F1E8B0",
  DarkBlue: "#4E6E95",
  LightBlue: "#bedae4",
  DarkGreen: "#446746",
  LightGreen: "#aad1b5",
  DarkYellow: "#c6b343",
  LightYellow: "#F1E8B0",
};

function Ring({ value, checked = false }: { value: string; checked?: boolean }) {
  const color = SWATCH_COLORS[value];
  const base = clx(
    "ring-2 ring-offset-2",
    checked ? "ring-primary" : "ring-transparent",
  );
  if (color) {
    return (
      <span
        style={{ backgroundColor: color }}
        className={clx(
          "block w-12 h-12 rounded-full border border-[#C9CFCF]",
          base,
        )}
        aria-label={value}
      />
    );
  }
  return (
    <span
      className={clx(
        "btn btn-ghost border-[#C9CFCF] hover:bg-base-200 hover:border-[#C9CFCF] w-12 h-12",
        base,
      )}
    >
      {value}
    </span>
  );
}

interface Props {
  product: Product;
  /** Preload card image */
  preload?: boolean;

  /** @description used for analytics event */
  itemListName?: string;

  /** @description index of the product card in the list */
  index?: number;

  className?: string;
}

const WIDTH = 287;
const HEIGHT = 287;
const ASPECT_RATIO = `${WIDTH} / ${HEIGHT}`;

function ProductCard({
  product,
  preload,
  itemListName,
  index,
  className: _class,
}: Props) {
  const id = useId();

  const { url, image: images, offers, isVariantOf } = product;
  const hasVariant = isVariantOf?.hasVariant ?? [];
  const title = isVariantOf?.name ?? product.name;
  const [front, back] = images ?? [];

  const { listPrice, price, seller = "1", availability } = useOffer(offers);
  const inStock = availability === "https://schema.org/InStock";
  const possibilities = useVariantPossibilities(hasVariant, product);
  const firstSkuVariations = Object.entries(possibilities)?.[0];
  const variants = Object.entries(firstSkuVariations?.[1] ?? {});
  const relativeUrl = relative(url);
  const percent = listPrice && price
    ? Math.round(((listPrice - price) / listPrice) * 100)
    : 0;

  const item = mapProductToAnalyticsItem({ product, price, listPrice, index });

  {/* Add click event to dataLayer */}
  const event = useSendEvent({
    on: "click",
    event: {
      name: "select_item" as const,
      params: {
        item_list_name: itemListName,
        items: [item],
      },
    },
  });

  //Added it to check the variant name in the SKU Selector later, so it doesn't render the SKU to "shoes size" in the Product Card
  const firstVariantName = firstSkuVariations?.[0]?.toLowerCase();
  const shoeSizeVariant = "shoe size";

  return (
    <div
      {...event}
      className={clx("card card-compact group text-sm", _class)}
    >
      <figure
        className={clx(
          "relative bg-base-200",
          "rounded border border-transparent",
          "group-hover:border-primary",
        )}
        style={{ aspectRatio: ASPECT_RATIO }}
      >
        {/* Product Images */}
        <a
          href={relativeUrl}
          aria-label="view product"
          className={clx(
            "absolute top-0 left-0",
            "grid grid-cols-1 grid-rows-1",
            "w-full",
            !inStock && "opacity-70",
          )}
        >
          <Image
            src={front.url!}
            alt={front.alternateName}
            width={WIDTH}
            height={HEIGHT}
            style={{ aspectRatio: ASPECT_RATIO }}
            className={clx(
              "object-cover",
              "rounded w-full",
              "col-span-full row-span-full",
            )}
            sizes="(max-width: 640px) 50vw, 20vw"
            preload={preload}
            loading={preload ? "eager" : "lazy"}
            decoding="async"
          />
          <Image
            src={back?.url ?? front.url!}
            alt={back?.alternateName ?? front.alternateName}
            width={WIDTH}
            height={HEIGHT}
            style={{ aspectRatio: ASPECT_RATIO }}
            className={clx(
              "object-cover",
              "rounded w-full",
              "col-span-full row-span-full",
              "transition-opacity opacity-0 lg:group-hover:opacity-100",
            )}
            sizes="(max-width: 640px) 50vw, 20vw"
            loading="lazy"
            decoding="async"
          />
        </a>

        {/* Wishlist button */}
        <div className="absolute top-0 left-0 w-full flex items-center justify-between">
          {/* Notify Me */}
          <span
            className={clx(
              "text-sm/4 font-normal text-black bg-error/15 text-center rounded-badge px-2 py-1",
              inStock && "opacity-0",
            )}
          >
            Notify me
          </span>

          {/* Discounts */}
          <span
            className={clx(
              "text-sm/4 font-normal text-black bg-primary/15 text-center rounded-badge px-2 py-1",
              (percent < 1 || !inStock) && "opacity-0",
            )}
          >
            {percent} % off
          </span>
        </div>

        <div className="absolute bottom-0 right-0">
          <WishlistButton item={item} variant="icon" />
        </div>
      </figure>

      <a href={relativeUrl} className="pt-5">
        <span className="font-medium">
          {title}
        </span>

        <div className="flex gap-2 pt-2">
          {listPrice && (
            <span className="line-through font-normal text-gray-400">
              {formatPrice(listPrice, offers?.priceCurrency)}
            </span>
          )}
          <span className="font-medium text-base-400">
            {formatPrice(price, offers?.priceCurrency)}
          </span>
        </div>
      </a>

      {/* SKU Selector */}
      {variants.length > 1 && firstVariantName !== shoeSizeVariant && (
        <ul className="flex items-center justify-start gap-2 pt-4 pb-1 pl-1 overflow-x-auto">
          {variants.map(([value, link]) => [value, relative(link)] as const)
            .map(([value, link]) => (
              <li>
                <a href={link} className="cursor-pointer">
                  <input
                    className="hidden peer"
                    type="radio"
                    name={`${id}-${firstSkuVariations?.[0]}`}
                    checked={link === relativeUrl}
                  />
                  <Ring value={value} checked={link === relativeUrl} />
                </a>
              </li>
            ))}
        </ul>
      )}

      <div className="grow" />

      <div>
        {inStock
          ? (
            <AddToCartButton
              product={product}
              seller={seller}
              item={item}
              className={clx(
                "btn",
                "btn-outline justify-start border-none !text-sm !font-medium px-0 no-animation w-full",
                "hover:!bg-transparent",
                "disabled:!bg-transparent disabled:!opacity-50",
                "btn-primary hover:!text-primary disabled:!text-primary",
              )}
            />
          )
          : (
            <a
              href={relativeUrl}
              className={clx(
                "btn",
                "btn-outline justify-start border-none !text-sm !font-medium px-0 no-animation w-full",
                "hover:!bg-transparent",
                "disabled:!bg-transparent disabled:!opacity-75",
                "btn-error hover:!text-error disabled:!text-error",
              )}
            >
              Sold out
            </a>
          )}
      </div>
    </div>
  );
}

export default ProductCard;
