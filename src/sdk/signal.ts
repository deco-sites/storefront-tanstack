export { signal, type ReactiveSignal } from "@decocms/start/sdk/signal";

/** Run a function immediately. Kept for legacy module-level side effects. */
export function effect(fn: () => void | (() => void)): () => void {
  const cleanup = fn();
  return typeof cleanup === "function" ? cleanup : () => {};
}
