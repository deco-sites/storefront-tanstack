import type { HTMLWidget, ImageWidget } from "~/types/widgets";
import Image from "~/components/ui/Image";

export interface CTA {
  id?: string;
  href: string;
  text: string;
  variant: "Normal" | "Reverse";
}

export interface Props {
  title: HTMLWidget;
  description: string;
  image?: ImageWidget;
  placement: "left" | "right";
  cta: CTA[];
}

const PLACEMENT = {
  left: "flex-col text-left lg:flex-row-reverse",
  right: "flex-col text-left lg:flex-row",
};

export default function HeroFlats({
  title = "Hero",
  description = "Your description here",
  image,
  placement,
  cta,
}: Props) {
  return (
    <div>
      <div className="mx-auto flex flex-col items-center gap-8">
        <div
          className={`flex w-full xl:container mx-5 py-20 md:mx-10 xl:mx-auto z-10 ${
            image
              ? PLACEMENT[placement]
              : "flex-col items-center justify-center text-center"
          } lg:py-36 gap-12 md:gap-20 items-center`}
        >
          {image && (
            <Image
              width={640}
              className="w-full lg:w-1/2 object-fit"
              sizes="(max-width: 640px) 100vw, 30vw"
              src={image}
              alt={image}
              decoding="async"
              loading="lazy"
            />
          )}
          <div
            className={`mx-6 lg:mx-auto lg:w-full space-y-4 gap-4 ${
              image
                ? "lg:w-1/2 lg:max-w-xl"
                : "flex flex-col items-center justify-center lg:max-w-3xl"
            }`}
          >
            <div
              className="inline-block text-[80px] leading-[100%] font-medium tracking-[-2.4px]"
              dangerouslySetInnerHTML={{
                __html: title,
              }}
            >
            </div>
            <p className="text-zinc-400 text-base md:text-lg leading-[150%]">
              {description}
            </p>
            <div className="flex flex-col items-center lg:items-start lg:flex-row gap-4">
              {cta?.map((item) => (
                <a
                  key={item?.id}
                  id={item?.id}
                  href={item?.href}
                  target={item?.href.includes("http") ? "_blank" : "_self"}
                  className={`group relative overflow-hidden rounded-full hover:bg-gradient-to-r px-6 py-2 lg:px-8 lg:py-3 transition-all duration-300 ease-out ${
                    item.variant === "Reverse"
                      ? "bg-secondary text-white"
                      : "bg-accent text-black"
                  }`}
                >
                  <span className="ease absolute right-0 -mt-12 h-32 w-8 translate-x-12 rotate-12 bg-white opacity-10 transition-all duration-1000 group-hover:-translate-x-40">
                  </span>
                  <span className="relative font-medium lg:text-xl">
                    {item?.text}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
