/** Debounce a function call — drop-in replacement for Deno std/async/debounce */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay = 250,
): T & { clear(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = ((...args: Parameters<T>) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, delay);
  }) as T & { clear(): void };

  debounced.clear = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return debounced;
}

export default debounce;
