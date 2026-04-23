// Legacy Deco sections sometimes typed as `SectionProps<Loader, Action>`;
// the second type param is kept for source compatibility but ignored.
export type SectionProps<
  T extends (...args: any[]) => any = any,
  _A extends (...args: any[]) => any = T,
> = T extends (...args: any[]) => any ? Awaited<ReturnType<T>> : any;

export type Resolved<T = any> = T;

export type Section = any;

export type Block = any;

// Lazy-loaded sections can forward their own props to the fallback renderer.
// Keeping the original Props in the type lets callers destructure section
// props (title, cta, etc.) in the LoadingFallback component signature.
export type LoadingFallbackProps<T = unknown> = T & {
  height?: number;
};

export function asResolved<T>(value: T): T {
  return value;
}
