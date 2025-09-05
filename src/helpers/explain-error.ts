/**
 * @file src/helpers/explain-error.ts
 * @module helpers/explain-error
 * @summary Explain Error.
 */
export function explainError(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
