import { useEffect, useRef, useState } from "react";

interface Props {
  /** Primary/fallback source — usually an MP4 (broadest browser support). */
  src: string;
  /** Optional modern source (WebM); offered first when the browser supports it. */
  webm?: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  className?: string;
  /** "eager" disables lazy loading (use for above-the-fold/hero video). */
  loading?: "lazy" | "eager";
  /** Image shown before the video loads/plays. */
  poster?: string;
  /**
   * Load the video only when it scrolls into view (saves bandwidth on
   * below-the-fold videos). Defaults to true unless `loading="eager"`.
   */
  lazy?: boolean;
}

export default function Video({
  src,
  webm,
  width,
  height,
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  controls = false,
  className,
  loading,
  poster,
  lazy,
}: Props) {
  const isLazy = lazy ?? loading !== "eager";
  const ref = useRef<HTMLVideoElement>(null);
  // When lazy, hold back the <source> elements (and their bytes) until in view.
  const [visible, setVisible] = useState(!isLazy);

  useEffect(() => {
    if (!isLazy || visible) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isLazy, visible]);

  return (
    <video
      ref={ref}
      width={width}
      height={height}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      controls={controls}
      className={className}
      poster={poster}
      preload={visible ? "metadata" : "none"}
    >
      {visible && webm && <source src={webm} type="video/webm" />}
      {visible && <source src={src} type="video/mp4" />}
    </video>
  );
}
