/**
 * @file Shared test utilities for core test suites.
 * @internal
 */

/* c8 ignore file */
import { z } from "zod";

/**
 * Narrow a parse failure to a ZodError for assertions.
 */
export function expectParseFail<S extends z.ZodTypeAny>(schema: S, input: unknown): z.ZodError {
  const parsed = schema.safeParse(input);
  expect(parsed.success).toBe(false);
  return parsed.error!;
}
// Minimal helper to build a ZodError from a single synthetic issue.
export function makeErr(issue: unknown): z.ZodError {
  // @ts-expect-error - constructor expects ZodIssue[]; this is test-only input
  return new z.ZodError([issue]);
}
// Ensures we always return a ZodError (no union with undefined)
export const getErr = (schema: z.ZodTypeAny, bad: unknown): z.ZodError => {
  const res = schema.safeParse(bad);
  if (res.success) throw new Error("expected parse failure");
  return res.error;
};
