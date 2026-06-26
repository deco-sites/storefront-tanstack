import { type ImageWidget } from "~/types/widgets";
import Image from "~/components/ui/Image";
import Section, {
  type Props as SectionHeaderProps,
} from "../../components/ui/Section";

export interface Image {
  image: ImageWidget;
  alt: string;
}

export interface Props extends SectionHeaderProps {
  images?: Image[];
}

function Logos({
  title,
  cta,
  images = [
    {
      alt: "deco",
      image:
        "https://decoims.com/storefront-tanstack/3015d8b3-3c95-44e7-a0dc-4cdfc2623812/fe7cd8ba-c954-45d6-9282-ee7d8ca8e3c7.svg",
    },
    {
      alt: "deco",
      image:
        "https://decoims.com/storefront-tanstack/d5656c6e-8497-49bc-a4d6-7eb23b290cf1/637e8601-6b86-4979-aa97-68013a2a60fd.svg",
    },
  ],
}: Props) {
  return (
    <Section.Container>
      <Section.Header title={title} cta={cta} />

      <ul className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-5 sm:px-0">
        {images.map((item) => (
          <li>
            <Image
              width={300}
              height={300}
              src={item.image}
              alt={item.alt}
              className="w-full h-full object-cover"
            />
          </li>
        ))}
      </ul>
    </Section.Container>
  );
}

export default Logos;
