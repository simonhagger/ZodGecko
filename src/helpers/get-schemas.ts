/**
 * @file src/helpers/get-schemas.ts
 * @description Convenience helper to fetch request/response schemas for an endpoint id.
 * Returns `{ requestSchema, responseSchema }`. Throws if the endpoint/response schema is missing.
 * @module helpers/get-schemas
 * @summary Get Schemas.
 */

// External imports
// (none)

// Internal imports
import { getRequestSchema, getResponseSchema } from "../registry/index.js";
import type { ZodLikeSchema } from "../types.js";

/**
 * Return schemas for an endpoint id.
 * @param id (required: string)
 * @returns object
 */
export function getSchemas(id: string): Readonly<{
  requestSchema: ZodLikeSchema | null;
  responseSchema: ZodLikeSchema | null;
}> {
  const response = getResponseSchema(id) ?? null;
  if (!response) {
    throw new Error(`Unknown endpoint or missing response schema: ${id}`);
  }
  const request = getRequestSchema(id) ?? null;
  if (!request) {
    throw new Error(`Unknown endpoint or missing request schema: ${id}`);
  }
  return { requestSchema: request, responseSchema: response } as const;
}
