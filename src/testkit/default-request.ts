// -----------------------------------------------------------------------------
// file: src/testkit/default-request.ts
// -----------------------------------------------------------------------------

import { getRequestFor } from "../helpers/get-request-for.js";
import type { RequestShape } from "../types.js";

/** Build a default request from registry defaults.
 * Returns null if required path params are missing. */
export function synthesizeDefaultRequest(endpointId: string): RequestShape | null {
  const seed = getRequestFor(endpointId, {
    includeUndefinedOptionals: true,
    fillServerDefaults: true,
    omitDefaultedFields: false,
  });

  const path = seed.path ?? {};
  const missing = Object.values(path).some((v) => v === undefined || v === null || v === "");
  if (missing) return null;
  return seed;
}
