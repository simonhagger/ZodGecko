// src/helpers/parse-response.ts

import { getResponseSchema } from "../registry/index.js";
import type { ZodLikeSchema } from "../registry/types.js";

/** Check if a value is a ZodLike schema. */
function isZodLike(s: unknown): s is ZodLikeSchema {
  return Boolean(s && typeof (s as { parse?: unknown }).parse === "function");
}

/**
 * Validate/parse an API response for a given endpoint.
 * - Throws if endpoint is unknown
 * - Uses the endpoint's Zod response schema to validate
 * - Returns the parsed (possibly transformed) value
 */
export function parseResponse<T = unknown>(endpointId: string, data: unknown): T {
  const schema = getResponseSchema(endpointId);

  if (!schema) {
    throw new Error(`Unknown endpoint id: ${endpointId}`);
  }

  if (!isZodLike(schema)) {
    // If a variant lacks Zod at runtime, be explicit rather than silently pass.
    throw new Error(`Response schema for "${endpointId}" is not Zod-like`);
  }

  return schema.parse(data) as T;
}
