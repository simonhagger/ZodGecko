/**
 * @file src/core/helpers.ts
 * @module core/helpers
 *
 * Generic Zod helpers used across the library.
 * - `QueryValue`, `QueryObject`: flexible schemas for query string objects.
 * - `Infer<T>`: convenience alias for `z.infer<T>`.
 */

import { z } from "zod";

/** Union of common query string value types (string, number, boolean, string[], or undefined). */
export const QueryValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.undefined(),
]);

/** Query object schema: arbitrary string keys with {@link QueryValue} values. */
export const QueryObject = z.record(z.string(), QueryValue);

/** Convenience alias: infer the TypeScript type of a Zod schema. */
export type Infer<T extends z.ZodTypeAny> = z.infer<T>;
