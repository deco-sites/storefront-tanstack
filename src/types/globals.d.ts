// Global ambient types for the storefront runtime.

declare global {
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
