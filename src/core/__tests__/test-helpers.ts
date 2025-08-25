/**
 * @file Shared test utilities for core test suites.
 * @internal
 */

/* c8 ignore file */
import type { z } from "zod";

/**
 * Narrow a parse failure to a ZodError for assertions.
 */
export function expectParseFail<S extends z.ZodTypeAny>(schema: S, input: unknown): z.ZodError {
  const parsed = schema.safeParse(input);
  expect(parsed.success).toBe(false);
  return parsed.error!;
}
