import { type Fit, srcSet } from "@decocms/blocks/image";
import { Image, type ImageProps, useImageUrl } from "@decocms/tanstack/react";

type FitOptions = Fit;

export interface PictureSourceProps {
  src: string;
  width: number;
  height?: number;
  media: string;
  fit?: FitOptions;
  sizes?: string;
}

export interface PictureProps extends Partial<Omit<ImageProps, "sizes">> {
  sources?: PictureSourceProps[];
  children?: React.ReactNode;
}

export function Picture({
  sources,
  src,
  width,
  height,
  fit = "cover",
  preload,
  children,
  ...rest
}: PictureProps) {
  const imageUrl = useImageUrl();
  if (children) {
    // Legacy API: callers compose `<Source/>` + `<img/>` as children.
    return <picture {...rest}>{children}</picture>;
  }
  return (
    <picture>
      {sources?.map((source, i) => {
        const sourceSet = srcSet(imageUrl, source.src, {
          width: source.width,
          height: source.height,
          fit: source.fit ?? fit,
        });
        return (
          <source
            key={i}
            srcSet={sourceSet}
            media={source.media}
            width={source.width}
            height={source.height}
            sizes={source.sizes ?? `${source.width}px`}
          />
        );
      })}
      {src && width ? (
        <Image src={src} width={width} height={height} fit={fit} preload={preload} {...rest} />
      ) : null}
    </picture>
  );
}

// Legacy `<Source>` helper — kept for components that still use the old
// compositional Picture API. Renders a native <source> with Deco srcset.
export interface SourceProps {
  src: string;
  width: number;
  height?: number;
  media?: string;
  fit?: FitOptions;
  sizes?: string;
  fetchPriority?: "high" | "low" | "auto";
  setEarlyHint?: () => void;
}

export function Source({
  src,
  width,
  height,
  media,
  fit = "cover",
  sizes,
  fetchPriority,
}: SourceProps) {
  const sourceSet = srcSet(useImageUrl(), src, { width, height, fit });
  return (
    <source
      srcSet={sourceSet}
      media={media}
      width={width}
      height={height}
      sizes={sizes ?? `${width}px`}
      {...(fetchPriority ? { fetchpriority: fetchPriority } : {})}
    />
  );
}
