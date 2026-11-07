/**
 * Stand-ins for v7 runtime the next major doesn't have, written by the deco-v7-to-v8-migration skill
 * where the site used it. Each is @deprecated: replace every use, then delete this file.
 */

/**
 * @deprecated v7's invoke of a loader or action the migration couldn't turn into a server function:
 * `ctx.invoke` in a loader (v8 has no ctx), or a key no handler file answers. Call the handler module
 * (or the server function in src/server/invoke.functions.ts / invoke.actions.ts) directly.
 */
export function unportedInvoke(key: unknown, _props?: unknown): Promise<any> {
  return Promise.reject(
    new Error(
      `invoke(${String(key)}) has no v8 equivalent here: call its handler or its server function (see src/migration-stubs.ts)`,
    ),
  );
}
