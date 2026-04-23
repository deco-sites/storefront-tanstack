import { useEffect, useRef, useState } from "react";
import { type Section } from "~/types/deco";
import { clx } from "~/sdk/clx";

interface Children {
  section: Section;
}

export interface Props {
  /**
   * @title Animation
   * @description CSS animation applied when the section enters the viewport
   * @default "fade-in"
   */
  animationType?: "fade-in" | "fade-in-bottom" | "slide-left" | "slide-right" | "zoom-in";
  /**
   * @title Duration (s)
   * @description Animation duration in seconds
   * @default 0.3
   */
  duration?: string;
  /**
   * @title Wrapped section
   * @description Section that will receive the animation on intersect
   */
  children: Children;
}

const animationByType: Record<NonNullable<Props["animationType"]>, string> = {
  "fade-in": `
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    .animate-fade-in { animation: fade-in 1s ease-out; }
  `,
  "fade-in-bottom": `
    @keyframes fade-in-bottom {
      from { opacity: 0; transform: translateY(50px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-bottom { animation: fade-in-bottom 1s ease-out; }
  `,
  "slide-left": `
    @keyframes slide-left {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .animate-slide-left { animation: slide-left 1s ease-out; }
  `,
  "slide-right": `
    @keyframes slide-right {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    .animate-slide-right { animation: slide-right 1s ease-out; }
  `,
  "zoom-in": `
    @keyframes zoom-in {
      from { transform: scale(0); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .animate-zoom-in { animation: zoom-in 1s ease-out; }
  `,
};

function Animation({ children, animationType = "fade-in", duration = "0.3" }: Props) {
  const { section } = children;
  const { Component, props } = section;
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationByType[animationType] }} />
      <div
        ref={ref}
        className={clx(visible ? `animate-${animationType}` : "opacity-0")}
        style={{ animationDuration: `${duration}s` }}
      >
        <Component {...props} />
      </div>
    </>
  );
}
export default Animation;

export function Preview() {
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: animationByType["slide-left"] }} />
      <div
        className="animate-slide-left flex items-center justify-center"
        style={{ animationDuration: "2s" }}
      >
        <h1 className="my-8 text-9xl font-semibold text-base-content">Animation</h1>
      </div>
    </div>
  );
}
