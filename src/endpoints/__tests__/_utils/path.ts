// src/endpoints/__tests__/_utils/path.ts
import { pathParamKeys, dropPathParamsByTemplate } from "../../../core/url.js";
import type { Endpoint } from "../../../runtime/index.js";

export function getPathParamKeys(ep: Endpoint): readonly string[] {
  return pathParamKeys(ep);
}

export function dropPathParams(
  ep: Endpoint,
  input: Record<string, unknown>,
): Record<string, unknown> {
  return dropPathParamsByTemplate(ep, input);
}
