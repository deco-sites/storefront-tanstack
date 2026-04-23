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
          className={`z-10 mx-5 flex w-full py-20 md:mx-10 xl:container xl:mx-auto ${
            image ? PLACEMENT[placement] : "flex-col items-center justify-center text-center"
          } items-center gap-12 md:gap-20 lg:py-36`}
        >
          {image && (
            <Image
              width={640}
              className="object-fit w-full lg:w-1/2"
              sizes="(max-width: 640px) 100vw, 30vw"
              src={image}
              alt={image}
              decoding="async"
              loading="lazy"
            />
          )}
          <div
            className={`mx-6 gap-4 space-y-4 lg:mx-auto lg:w-full ${
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
            ></div>
            <p className="text-zinc-400 text-base leading-[150%] md:text-lg">{description}</p>
            <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start">
              {cta?.map((item) => (
                <a
                  key={item?.id}
                  id={item?.id}
                  href={item?.href}
                  target={item?.href.includes("http") ? "_blank" : "_self"}
                  className={`group relative overflow-hidden rounded-full px-6 py-2 transition-all duration-300 ease-out hover:bg-gradient-to-r lg:px-8 lg:py-3 ${
                    item.variant === "Reverse" ? "bg-secondary text-white" : "bg-accent text-black"
                  }`}
                >
                  <span className="ease absolute right-0 -mt-12 h-32 w-8 translate-x-12 rotate-12 bg-white opacity-10 transition-all duration-1000 group-hover:-translate-x-40"></span>
                  <span className="relative font-medium lg:text-xl">{item?.text}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
