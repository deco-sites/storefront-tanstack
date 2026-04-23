import Image from "~/components/ui/Image";
import type { ImageWidget } from "~/types/widgets";
import S from "../../components/ui/Section";
import { type Section } from "~/types/deco";
export interface Props {
  section: Section;
  image: {
    src: ImageWidget;
    alt?: string;
    href?: string;
  };
}
function ShelfWithImage({ section, image }: Props) {
  return (
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="md:max-w-xs mx-auto flex items-center">
          <section.Component {...section.props} />
        </div>
        <a href={image.href}>
          <Image
            src={image.src}
            className="w-full h-full object-cover"
            width={720}
            height={640}
            alt={image.alt}
          />
        </a>
      </div>
    </div>
  );
}
export const LoadingFallback = () => <S.Placeholder height="640px" />;
export default ShelfWithImage;
