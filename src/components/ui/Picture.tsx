import {
  Image,
  getSrcSet,
  type FitOptions,
  type ImageProps,
} from "@decocms/apps/commerce/components/Image";

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
  if (children) {
    // Legacy API: callers compose `<Source/>` + `<img/>` as children.
    return <picture {...rest}>{children}</picture>;
  }
  return (
    <picture>
      {sources?.map((source, i) => {
        const srcSet = getSrcSet(source.src, source.width, source.height, source.fit ?? fit);
        return (
          <source
            key={i}
            srcSet={srcSet}
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
  const srcSet = getSrcSet(src, width, height, fit);
  return (
    <source
      srcSet={srcSet}
      media={media}
      width={width}
      height={height}
      sizes={sizes ?? `${width}px`}
      {...(fetchPriority ? { fetchpriority: fetchPriority } : {})}
    />
  );
}
