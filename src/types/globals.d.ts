// Global ambient types for the storefront runtime.

declare global {
  /** The build's id (`<build>` of the page cache's version), defined by `decoTanstack()`. */
  const __BUILD_HASH__: string;

  interface Window {
    DECO: {
      events: {
        subscribe: (cb: (ev: unknown) => void) => void;
        dispatch: (ev: unknown) => void;
      };
    };
  }
}

export {};
