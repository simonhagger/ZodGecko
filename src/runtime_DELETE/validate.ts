/**
 * @file Runtime: endpoint-driven request/response validation
 * @module runtime/validate
 *
 * High-level helpers that derive the correct Zod schema from an endpoint template:
 *   - validateRequest("/coins/markets", input)
 *   - validateResponse("/coins/markets", json)
 *
 * Why:
 * - Consumers shouldn’t need to import per-endpoint schemas just to validate.
 * - This stays aligned with the same endpoint strings used by buildQuery().
 *
 * Notes:
 * - The registry below lists all supported endpoints. Keep it in sync with EndpointSet.
 * - For endpoints with path params (e.g. "/coins/{id}"), request schemas typically
 *   only include *query* parameters. Use `opts.dropPathParams` to automatically drop
 *   `{…}` keys from your input before validation (convenience for users who passed a
 *   single object that included the path keys).
 */

import { z } from "zod";

import { type Endpoint, getSchemas } from "./endpoints.js"; // ← import directly
import { explainZodError } from "../core/parse-utils.js"; // ← narrow import; avoid barrel cycles
import { dropPathParamsByTemplate } from "../core/url.js";

/** Friendly result type returned by validate helpers. */
export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: z.ZodError<unknown>; message: string };

/**
 * Validate a *request* payload for a given endpoint. Optionally drop `{param}` keys first.
 *
 * @example
 *   validateRequest("/coins/{id}/tickers", { id: "bitcoin", page: 2 }, { dropPathParams: true })
 */
export function validateRequest<E extends Endpoint>(
  endpoint: E,
  input: unknown,
  opts?: { dropPathParams?: boolean },
): ValidationResult<unknown> {
  const { req } = getSchemas(endpoint);
  if (!req) {
    return {
      ok: false,
      error: new z.ZodError([]),
      message: `Invalid endpoint: ${endpoint}`,
    };
  }
  // Validate the full shape first (including path params like {id})
  const parsed = req.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error,
      message: explainZodError(parsed.error, { compact: true }),
    };
  }

  // Only after a successful parse, optionally drop the {…} keys for convenience
  const data =
    opts?.dropPathParams && parsed.data && typeof parsed.data === "object"
      ? dropPathParamsByTemplate(endpoint, parsed.data as Record<string, unknown>)
      : parsed.data;

  return { ok: true, data };
}

/**
 * Validate a *response* payload for a given endpoint.
 */
export function validateResponse<E extends Endpoint>(
  endpoint: E,
  input: unknown,
): ValidationResult<unknown> {
  const { res } = getSchemas(endpoint);
  if (!res) {
    return {
      ok: false,
      error: new z.ZodError([]),
      message: `Invalid endpoint: ${endpoint}`,
    };
  }
  const parsed = res.safeParse(input);
  console.log(`Response validation for ${endpoint}: ${JSON.stringify(parsed)}`);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    error: parsed.error,
    message: explainZodError(parsed.error, { compact: true }),
  };
}
