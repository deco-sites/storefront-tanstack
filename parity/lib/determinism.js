// Injected with context.addInitScript() before any page script runs.
// The config placeholder below is replaced with {seed} by the harness.
(() => {
  const cfg = __PARITY__;
  // 1. Seeded Math.random (mulberry32).
  let a = cfg.seed >>> 0;
  Math.random = function parityRandom() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // 2. Long-period intervals (carousel autoplay, countdown ticks) never fire:
  //    their effect depends on wall-clock time between steps. Short intervals
  //    (< 1s, used for polling/animation helpers) keep working.
  const realSetInterval = window.setInterval.bind(window);
  window.setInterval = function (fn, ms, ...rest) {
    if (typeof ms === "number" && ms >= 1000) return realSetInterval(() => {}, 2 ** 31 - 1);
    return realSetInterval(fn, ms, ...rest);
  };
  // 3. No animations / transitions / caret blink / smooth scroll.
  //    Declared in a cascade layer that is inserted FIRST in <head>: for
  //    !important declarations the earliest layer wins, which is the only way
  //    to beat `!important` rules inside Tailwind v4 / DaisyUI 5 layers.
  const css = `@layer parity{*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}}`;
  const style = document.createElement("style");
  style.id = "__parity_css";
  style.textContent = css;
  const place = () => {
    const head = document.head;
    if (!head) return false;
    if (head.firstChild !== style) head.insertBefore(style, head.firstChild);
    return true;
  };
  // Keep it there: hydration of <head> removes nodes React did not render.
  place();
  new MutationObserver(() => place()).observe(document, { childList: true, subtree: true });
  // Belt and braces: anything that still starts (e.g. before the style is in
  // place) jumps to its end state, or is dropped if it never ends.
  const finish = (e) => {
    const t = e.target;
    if (!t || !t.getAnimations) return;
    for (const a of t.getAnimations()) {
      try {
        const timing = a.effect && a.effect.getComputedTiming();
        if (timing && Number.isFinite(timing.endTime)) a.finish();
        // Infinite / scroll-driven animations (spinners, DaisyUI's
        // root "set-page-has-scroll") have no stable end state: drop them.
        else a.cancel();
      } catch {}
    }
  };
  for (const ev of ["transitionrun", "transitionstart", "animationstart"]) document.addEventListener(ev, finish, true);
})();
