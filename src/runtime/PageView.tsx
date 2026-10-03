/**
 * Renders a page's blocks (/next/tanstack-start-descriptors#5-render-the-catch-all-route): one
 * Suspense boundary per block, each streamed as its promise resolves, and each descriptor rendered
 * through the view registry.
 *
 * The markup around each section is v7's, so pages look and behave exactly as before: a
 * `<section>` with the section's id and `data-manifest-key`, an error boundary, and for sections
 * saved inside v7's Lazy wrapper, its placeholder while loading and its fade-in once loaded.
 */
import { Component, type ErrorInfo, type ReactNode, Suspense } from "react";
import { Await } from "@tanstack/react-router";
import type { BlockDescriptor } from "../model";
import type { BlockHint } from "../open-page.server";
import { type Device, DeviceProvider } from "../sdk/device";
import { views } from "../views";

const FADE_IN_CSS = "@keyframes decoFadeIn{from{opacity:0}to{opacity:1}}";

function sectionId(component: string): string {
  return component
    .replace(/\//g, "-")
    .replace(/\.tsx$/, "")
    .replace(/^site-sections-/, "");
}

class SectionErrorBoundary extends Component<
  { sectionKey: string; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[CMS] Section "${this.props.sectionKey}" crashed:`, error, info.componentStack);
  }

  render() {
    if (this.state.error)
      return <div data-section-error={this.props.sectionKey} className="hidden" />;
    return this.props.children;
  }
}

function DefaultSectionFallback() {
  return <div className="w-full h-48 bg-base-200 animate-pulse rounded" />;
}

/** What a section saved inside v7's Lazy wrapper shows until it streams in. */
function DeferredPlaceholder({ hint }: { hint: BlockHint }) {
  if (!hint.deferred || !hint.component) return null;
  const view = views[hint.component];
  const Fallback = view?.LoadingFallback;
  return (
    <section id={sectionId(hint.component)} data-manifest-key={hint.component} data-deferred="true">
      {Fallback ? <Fallback /> : <DefaultSectionFallback />}
    </section>
  );
}

function SectionView({ block }: { block: BlockDescriptor }) {
  const view = views[block.component];
  if (!view) return null;
  const View = view.default;
  return (
    <section
      id={sectionId(block.component)}
      data-manifest-key={block.component}
      style={block.deferred ? { animation: "decoFadeIn 0.3s ease-out" } : undefined}
    >
      <SectionErrorBoundary sectionKey={block.component}>
        <View {...block.props} />
      </SectionErrorBoundary>
    </section>
  );
}

function BlockView({ block }: { block: BlockDescriptor | BlockDescriptor[] }) {
  // The chosen variant of the whole list.
  if (Array.isArray(block))
    return block.map((item, index) => <BlockView key={index} block={item} />);
  return <SectionView block={block} />;
}

export interface PageBlock {
  key: string;
  hint: BlockHint;
  value: Promise<{ value: BlockDescriptor | BlockDescriptor[] | undefined; failed: boolean }>;
}

export function PageView({ blocks, device }: { blocks: PageBlock[]; device?: Device }) {
  const hasDeferred = blocks.some((block) => block.hint.deferred);
  return (
    <DeviceProvider value={device}>
      {hasDeferred && <style dangerouslySetInnerHTML={{ __html: FADE_IN_CSS }} />}
      {blocks.map((block) => (
        <Suspense key={block.key} fallback={<DeferredPlaceholder hint={block.hint} />}>
          <Await promise={block.value}>
            {({ value }) => (value ? <BlockView block={value} /> : null)}
          </Await>
        </Suspense>
      ))}
    </DeviceProvider>
  );
}
