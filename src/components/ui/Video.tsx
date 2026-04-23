interface Props {
  src: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  className?: string;
  loading?: "lazy" | "eager";
  poster?: string;
}

export default function Video({
  src,
  width,
  height,
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  controls = false,
  className,
  poster,
}: Props) {
  return (
    <video
      src={src}
      width={width}
      height={height}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      controls={controls}
      className={className}
      poster={poster}
    />
  );
}
