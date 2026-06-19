import React, { useEffect } from "react";
import { clx } from "~/sdk/clx";

function Dot({ index, ...props }: {
  index: number;
} & React.JSX.IntrinsicElements["button"]) {
  return (
    <button
      {...props}
      data-dot={index}
      aria-label={`go to slider item ${index}`}
      className={clx("focus:outline-none group", props.className?.toString())}
    />
  );
}
function Slider(props: React.JSX.IntrinsicElements["ul"]) {
  return <ul data-slider {...props} />;
}
function Item({ index, ...props }: React.JSX.IntrinsicElements["li"] & {
  index: number;
}) {
  return <li data-slider-item={index} {...props} />;
}
function NextButton(props: React.JSX.IntrinsicElements["button"]) {
  return (
    <button
      disabled
      data-slide="next"
      aria-label="Next item"
      {...props}
    />
  );
}
function PrevButton(props: React.JSX.IntrinsicElements["button"]) {
  return (
    <button disabled data-slide="prev" aria-label="Previous item" {...props} />
  );
}
export interface Props {
  rootId: string;
  scroll?: "smooth" | "auto";
  interval?: number;
  infinite?: boolean;
}

const THRESHOLD = 0.6;

const intersectionX = (element: DOMRect, container: DOMRect): number => {
  const delta = container.width / 1000;
  if (element.right < container.left - delta) return 0;
  if (element.left > container.right + delta) return 0;
  if (element.left < container.left - delta) {
    return element.right - container.left + delta;
  }
  if (element.right > container.right + delta) {
    return container.right - element.left + delta;
  }
  return element.width;
};

function useSlider(
  { rootId, scroll = "smooth", interval, infinite = false }: Props,
) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    const slider = root?.querySelector<HTMLElement>("[data-slider]");
    const items = root?.querySelectorAll<HTMLElement>("[data-slider-item]");
    const prev = root?.querySelector<HTMLElement>('[data-slide="prev"]');
    const next = root?.querySelector<HTMLElement>('[data-slide="next"]');
    const dots = root?.querySelectorAll<HTMLElement>("[data-dot]");
    if (!root || !slider || !items || items.length === 0) return;

    const getElementsInsideContainer = () => {
      const indices: number[] = [];
      const sliderRect = slider.getBoundingClientRect();
      for (let index = 0; index < items.length; index++) {
        const item = items.item(index);
        const rect = item.getBoundingClientRect();
        const ratio = intersectionX(rect, sliderRect) / rect.width;
        if (ratio > THRESHOLD) indices.push(index);
      }
      return indices;
    };

    const goToItem = (to: number) => {
      const item = items.item(to);
      if (!(item instanceof HTMLElement)) return;
      slider.scrollTo({
        top: 0,
        behavior: scroll,
        left: item.offsetLeft - slider.offsetLeft,
      });
    };

    const onClickPrev = (e: Event) => {
      e.stopPropagation();
      const indices = getElementsInsideContainer();
      if (indices.length === 0) return;
      const itemsPerPage = indices.length;
      const isShowingFirst = indices[0] === 0;
      const pageIndex = Math.floor(indices[indices.length - 1] / itemsPerPage);
      goToItem(
        isShowingFirst ? items.length - 1 : (pageIndex - 1) * itemsPerPage,
      );
    };

    const onClickNext = (e?: Event) => {
      e?.stopPropagation();
      const indices = getElementsInsideContainer();
      if (indices.length === 0) return;
      const itemsPerPage = indices.length;
      const isShowingLast = indices[indices.length - 1] === items.length - 1;
      const pageIndex = Math.floor(indices[0] / itemsPerPage);
      goToItem(isShowingLast ? 0 : (pageIndex + 1) * itemsPerPage);
    };

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          const item = entry.target.getAttribute("data-slider-item");
          const index = Number(item) || 0;
          const dot = dots?.item(index);
          if (entry.isIntersecting) {
            dot?.setAttribute("disabled", "");
            dot?.setAttribute("aria-current", "true");
            // Keep the active dot in view — matters for scrollable thumbnail
            // strips (e.g. the PDP gallery with many images). `nearest` only
            // scrolls when needed, so it's a no-op for the small dot rows of
            // the Carousel/Logos sliders and never scrolls the page.
            dot?.scrollIntoView({ block: "nearest", inline: "nearest" });
          } else {
            dot?.removeAttribute("disabled");
            dot?.removeAttribute("aria-current");
          }
          if (!infinite) {
            if (index === 0) {
              entry.isIntersecting
                ? prev?.setAttribute("disabled", "")
                : prev?.removeAttribute("disabled");
            }
            if (index === items.length - 1) {
              entry.isIntersecting
                ? next?.setAttribute("disabled", "")
                : next?.removeAttribute("disabled");
            }
          }
        }),
      { threshold: THRESHOLD, root: slider },
    );

    items.forEach((item) => observer.observe(item));

    const dotHandlers: Array<() => void> = [];
    if (dots) {
      for (let i = 0; i < dots.length; i++) {
        const handler = () => goToItem(i);
        dots.item(i).addEventListener("click", handler);
        dotHandlers.push(handler);
      }
    }

    prev?.addEventListener("click", onClickPrev);
    next?.addEventListener("click", onClickNext);

    // Keyboard navigation: arrow keys move between slides when focus is within
    // the carousel (e.g. on a dot or arrow button).
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onClickNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onClickPrev(e);
      }
    };
    root.addEventListener("keydown", onKeyDown);

    // Autoplay that pauses on hover/focus and when the tab is hidden, so it
    // never advances while the user is reading or interacting.
    let timer: ReturnType<typeof setInterval> | null = null;
    const startTimer = () => {
      if (interval && !timer) timer = setInterval(() => onClickNext(), interval);
    };
    const stopTimer = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => (document.hidden ? stopTimer() : startTimer());
    if (interval) {
      startTimer();
      root.addEventListener("pointerenter", stopTimer);
      root.addEventListener("pointerleave", startTimer);
      root.addEventListener("focusin", stopTimer);
      root.addEventListener("focusout", startTimer);
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      observer.disconnect();
      stopTimer();
      root.removeEventListener("keydown", onKeyDown);
      if (interval) {
        root.removeEventListener("pointerenter", stopTimer);
        root.removeEventListener("pointerleave", startTimer);
        root.removeEventListener("focusin", stopTimer);
        root.removeEventListener("focusout", startTimer);
        document.removeEventListener("visibilitychange", onVisibility);
      }
      prev?.removeEventListener("click", onClickPrev);
      next?.removeEventListener("click", onClickNext);
      if (dots) {
        for (let i = 0; i < dots.length; i++) {
          dots.item(i).removeEventListener("click", dotHandlers[i]);
        }
      }
    };
  }, [rootId, scroll, interval, infinite]);
}

function JS(props: Props) {
  useSlider(props);
  return null;
}

Slider.Dot = Dot;
Slider.Item = Item;
Slider.NextButton = NextButton;
Slider.PrevButton = PrevButton;
Slider.JS = JS;
export default Slider;
