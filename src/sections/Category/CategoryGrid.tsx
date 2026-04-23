import type { ImageWidget } from "~/types/widgets";
import Image from "~/components/ui/Image";
import Section, {
  type Props as SectionHeaderProps,
} from "../../components/ui/Section";
import Slider from "../../components/ui/Slider";
import { clx } from "~/sdk/clx";
import { useDevice } from "@decocms/start/sdk/useDevice";
import { type LoadingFallbackProps } from "~/types/deco";
import { Link } from "@tanstack/react-router";
/** @titleBy label */
export interface Item {
  image: ImageWidget;
  href: string;
  label: string;
}
export interface Props extends SectionHeaderProps {
  items: Item[];
}
function Card({ image, href, label }: Item) {
  return (
    <Link
      to={href}
      preload="intent"
      className="flex flex-col items-center justify-center gap-4"
    >
      <div className="w-44 h-44 rounded-full bg-base-200 flex justify-center items-center border border-transparent hover:border-primary">
        <Image
          src={image}
          alt={label}
          width={100}
          height={100}
          loading="lazy"
        />
      </div>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}
function CategoryGrid({ title, cta, items }: Props) {
  const device = useDevice();
  return (
    <Section.Container>
      <Section.Header title={title} cta={cta} />

      {device === "desktop"
        ? (
          <div className="grid grid-cols-6 gap-10">
            {items.map((i) => <Card key={i.label} {...i} />)}
          </div>
        )
        : (
          <Slider className="carousel carousel-center sm:carousel-end gap-5 w-full">
            {items.map((i, index) => (
              <Slider.Item
                index={index}
                className={clx(
                  "carousel-item",
                  "first:pl-5 first:sm:pl-0",
                  "last:pr-5 last:sm:pr-0",
                )}
              >
                <Card {...i} />
              </Slider.Item>
            ))}
          </Slider>
        )}
    </Section.Container>
  );
}
export const LoadingFallback = (
  { title, cta }: LoadingFallbackProps<Props>,
) => (
  <Section.Container>
    <Section.Header title={title} cta={cta} />
    <Section.Placeholder height="212px" />;
  </Section.Container>
);
export default CategoryGrid;
