/**
 * @file src/runtime/params.ts
 * @module runtime/params
 *
 * Runtime – Param helpers
 * -----------------------
 * Small utilities for removing path params before calling `buildQuery`.
 */

export function dropParams<T extends Record<string, unknown>, K extends readonly (keyof T)[]>(
  obj: T,
  keys: K,
): Omit<T, K[number]> {
  const result = { ...obj };
  for (const k of keys) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (result as Record<string, unknown>)[k as string];
  }
  return result;
}

/** Convenience wrapper for the very common `{ id }` path param. */
export function dropId<T extends Record<string, unknown> & { id?: unknown }>(
  obj: T,
): Omit<T, "id"> {
  return dropParams(obj, ["id"] as const);
}
