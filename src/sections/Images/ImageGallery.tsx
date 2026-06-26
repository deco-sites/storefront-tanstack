import { type ImageWidget } from "~/types/widgets";
import { Picture, Source } from "~/components/ui/Picture";
import Section, {
  type Props as SectionHeaderProps,
} from "../../components/ui/Section";
import { type LoadingFallbackProps } from "~/types/deco";
/**
 * @titleBy alt
 */
interface Banner {
  mobile: ImageWidget;
  desktop?: ImageWidget;
  /** @description Image alt texts */
  alt: string;
  /** @description Adicione um link */
  href: string;
}
interface Props extends SectionHeaderProps {
  /**
   * @maxItems 4
   * @minItems 4
   */
  banners?: Banner[];
}
function Banner({ mobile, desktop, alt, href }: Banner) {
  return (
    <a href={href} className="overflow-hidden">
      <Picture>
        <Source
          width={190}
          height={190}
          media="(max-width: 767px)"
          src={mobile}
        />
        <Source
          width={640}
          height={420}
          media="(min-width: 768px)"
          src={desktop || mobile}
        />
        <img
          width={640}
          className="w-full h-full object-cover"
          src={mobile}
          alt={alt}
          decoding="async"
          loading="lazy"
        />
      </Picture>
    </a>
  );
}
function Gallery({
  title,
  cta,
  banners = [
    {
      mobile:
        "https://decoims.com/storefront-tanstack/c0a4913f-e8fc-4d37-a39a-3b4852b3b697/b531631b-8523-4feb-ac37-5112873abad2.jpg",
      desktop:
        "https://decoims.com/storefront-tanstack/c0a4913f-e8fc-4d37-a39a-3b4852b3b697/b531631b-8523-4feb-ac37-5112873abad2.jpg",
      alt: "Fashion",
      href: "/",
    },
    {
      alt: "Fashion",
      href: "/",
      mobile:
        "https://decoims.com/storefront-tanstack/44e1fcc3-33d6-4bd4-a71b-bb156ef71a79/1125d938-89ff-4aae-a354-63d4241394a6.jpg",
      desktop:
        "https://decoims.com/storefront-tanstack/44e1fcc3-33d6-4bd4-a71b-bb156ef71a79/1125d938-89ff-4aae-a354-63d4241394a6.jpg",
    },
    {
      mobile:
        "https://decoims.com/storefront-tanstack/a8c48f41-a568-453d-9c8c-fa425129ce81/dd1e2acb-ff80-49f9-8f56-1deac3b7a42d.jpg",
      desktop:
        "https://decoims.com/storefront-tanstack/a8c48f41-a568-453d-9c8c-fa425129ce81/dd1e2acb-ff80-49f9-8f56-1deac3b7a42d.jpg",
      href: "/",
      alt: "Fashion",
    },
    {
      mobile:
        "https://decoims.com/storefront-tanstack/5e781c4e-5b87-4b06-afa5-fdb9f2f45d26/0b85ba2d-48b1-4f5b-b619-7f4a7f50b455.jpg",
      desktop:
        "https://decoims.com/storefront-tanstack/5e781c4e-5b87-4b06-afa5-fdb9f2f45d26/0b85ba2d-48b1-4f5b-b619-7f4a7f50b455.jpg",
      alt: "Fashion",
      href: "/",
    },
  ],
}: Props) {
  return (
    <Section.Container>
      <Section.Header title={title} cta={cta} />

      <ul className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 px-5 sm:px-0">
        {banners.map((item) => (
          <li>
            <Banner {...item} />
          </li>
        ))}
      </ul>
    </Section.Container>
  );
}
export const LoadingFallback = (
  { title, cta }: LoadingFallbackProps<Props>,
) => (
  <Section.Container>
    <Section.Header title={title} cta={cta} />

    <Section.Placeholder height="635px" />;
  </Section.Container>
);
export default Gallery;
