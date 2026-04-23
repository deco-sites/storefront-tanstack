/**
 * Runtime invoke proxy.
 *
 * Turns nested property access into a typed RPC call to /deco/invoke.
 * Converts dot-notation paths to slash-separated keys:
 *   invoke.vtex.loaders.productList(props)
 *   → POST /deco/invoke/vtex/loaders/productList
 *
 * The .ts suffix variant is also tried if the primary key isn't found
 * (registered loaders may have ".ts" extensions in their keys).
 */
function createNestedInvokeProxy(path: string[] = []): any {
  return new Proxy(
    Object.assign(async (props: any) => {
      const key = path.join("/");
      for (const k of [key, `${key}.ts`]) {
        const response = await fetch(`/deco/invoke/${k}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(props ?? {}),
        });
        if (response.status === 404) continue;
        if (!response.ok) {
          throw new Error(`invoke(${k}) failed: ${response.status}`);
        }
        return response.json();
      }
      throw new Error(`invoke(${key}) failed: handler not found`);
    }, {}),
    {
      get(_target: any, prop: string) {
        if (prop === "then" || prop === "catch" || prop === "finally") {
          return undefined;
        }
        return createNestedInvokeProxy([...path, prop]);
      },
    },
  );
}

export const invoke = createNestedInvokeProxy() as any;
