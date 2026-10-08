/**
 * The document every page renders in. In v7 it was `DecoRootLayout` from @decocms/tanstack; the
 * markup is the same: the DECO.events bus and the data-event observer that the site's analytics
 * events go through, a navigation progress bar, a main area that keeps its height while the next
 * page loads, and the router's head and scripts.
 */
import { type ReactNode, useEffect, useRef, useState } from "react";
import { HeadContent, Outlet, ScriptOnce, Scripts, useRouterState } from "@tanstack/react-router";

/** The DECO.events bus. Events dispatched before a subscriber exists are replayed to it. */
const EVENTS_BOOTSTRAP = `
window.__RUNTIME__ = window.__RUNTIME__ || { account: "" };
window.DECO = window.DECO || {};
window.DECO.events = window.DECO.events || {
  _q: [],
  _subs: [],
  dispatch: function(e) {
    this._q.push(e);
    for (var i = 0; i < this._subs.length; i++) {
      try { this._subs[i](e); } catch(err) { console.error('[DECO.events]', err); }
    }
  },
  subscribe: function(fn) {
    this._subs.push(fn);
    for (var i = 0; i < this._q.length; i++) {
      try { fn(this._q[i]); } catch(err) {}
    }
  }
};
window.dataLayer = window.dataLayer || [];
`;

/** Dispatches the events elements declare with `data-event` (src/sdk/useSendEvent.ts), on view or click. */
const DATA_EVENT_OBSERVER = `
(function() {
  function dispatch(event) {
    if (window.dataLayer) {
      window.dataLayer.push({ event: event.name, ...event.params });
    }
    if (window.DECO && window.DECO.events) {
      window.DECO.events.dispatch(event);
    }
  }

  function getEvent(el) {
    var raw = el.getAttribute("data-event");
    if (!raw) return null;
    try { return JSON.parse(decodeURIComponent(raw)); } catch(e) { return null; }
  }

  var viewObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var event = getEvent(entry.target);
        if (event) dispatch(event);
        viewObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.addEventListener("click", function(e) {
    var el = e.target.closest("[data-event-trigger='click']");
    if (el) {
      var event = getEvent(el);
      if (event) dispatch(event);
    }
  });

  function observeAll() {
    document.querySelectorAll("[data-event-trigger='view']").forEach(function(el) {
      viewObserver.observe(el);
    });
  }

  observeAll();
  var mo = new MutationObserver(observeAll);
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(function() { mo.observe(document.body, { childList: true, subtree: true }); });
  } else {
    setTimeout(function() { mo.observe(document.body, { childList: true, subtree: true }); }, 0);
  }
})();
`;

const PROGRESS_CSS = `
@keyframes progressSlide { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
.nav-progress-bar { animation: progressSlide 1s ease-in-out infinite; }
`;

/** A loading bar at the top of the page during client-side navigation. */
function NavigationProgress() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  if (!isLoading) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-brand-primary-500/20 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: PROGRESS_CSS }} />
      <div className="nav-progress-bar h-full w-1/3 bg-brand-primary-500 rounded-full" />
    </div>
  );
}

/** Keeps the content area's height while the next page loads, so the footer doesn't jump. */
function StableOutlet() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const ref = useRef<HTMLDivElement>(null);
  const [savedHeight, setSavedHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isLoading && ref.current) setSavedHeight(ref.current.offsetHeight);
    else if (!isLoading) setSavedHeight(undefined);
  }, [isLoading]);

  return (
    <div ref={ref} style={savedHeight ? { minHeight: savedHeight } : undefined}>
      <Outlet />
    </div>
  );
}

declare global {
  interface Window {
    __deco_ready?: boolean;
  }
}

export function RootDocument({ children }: { children?: ReactNode }) {
  // Pages wait for this signal before running work that must follow hydration.
  useEffect(() => {
    const id = setTimeout(() => {
      window.__deco_ready = true;
      document.dispatchEvent(new Event("deco:ready"));
    }, 500);
    return () => clearTimeout(id);
  }, []);

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-base-200 text-base-content" suppressHydrationWarning>
        <ScriptOnce children={EVENTS_BOOTSTRAP} />
        <NavigationProgress />
        <main>
          <StableOutlet />
        </main>
        {children}
        <ScriptOnce children={DATA_EVENT_OBSERVER} />
        <Scripts />
      </body>
    </html>
  );
}
