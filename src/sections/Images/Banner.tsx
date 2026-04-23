import { type HTMLWidget, type ImageWidget } from "~/types/widgets";
import { Picture, Source } from "~/components/ui/Picture";
import Section from "../../components/ui/Section";
import { clx } from "~/sdk/clx";

export interface Props {
  title: string;
  description?: HTMLWidget;

  images: {
    mobile: ImageWidget;
    desktop: ImageWidget;
  };

  cta?: {
    href: string;
    label: string;
  };
}

function Banner({ title, description, images, cta }: Props) {
  return (
    <Section.Container>
      <div className="relative bg-base-200 mx-5 sm:mx-0">
        <Picture>
          <Source
            media="(max-width: 640px)"
            src={images.mobile}
            width={335}
            height={572}
          />
          <Source
            media="(min-width: 640px)"
            src={images.desktop}
            width={1320}
            height={480}
          />
          <img src={images.desktop} alt={title} className="w-full object-cover" />
        </Picture>

        <div
          className={clx(
            "absolute left-0 top-0",
            "p-5 sm:p-10 md:py-20 md:px-[60px]",
            "flex flex-col",
            "h-full max-w-full sm:max-w-[33%] md:max-w-[50%] justify-center",
          )}
        >
          {title && <span className="font-bold text-7xl text-primary">{title}
          </span>}
          {description && (
            <span
              className="font-normal text-sm md: pt-4 pb-12"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
          <div className="">
            {cta && (
              <a
                href={cta.href}
                className="btn btn-primary no-animatio w-fit border-0 min-w-45"
              >
                {cta.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </Section.Container>
  );
}

export const LoadingFallback = () => <Section.Placeholder height="635px" />;

export default Banner;
