// src/endpoints/__tests__/_utils/harness.ts
import type { z } from "zod";

import { toStringDefaultsMap } from "./defaults.js";
import { getPathParamKeys, dropPathParams } from "./path.js";
import { hasRequiredFields, getRequiredKeysFromSchema } from "./schema.js";
import {
  buildQuery,
  getSchemas,
  getServerDefaults,
  type Endpoint,
} from "../../../runtime/index.js";

/** Class-based test harness carrying all endpoint config & helpers. */
export class EndpointHarness {
  readonly EP: Endpoint;
  readonly req: z.ZodTypeAny;
  readonly res: z.ZodTypeAny;

  readonly defaults: Readonly<Record<string, unknown>>;
  readonly defaultsStr: Readonly<Record<string, string>>;
  readonly pathKeys: readonly string[];

  readonly hasRequired: boolean;
  readonly requiredKeys: readonly string[];
  readonly hasDefaults: boolean;

  private constructor(ep: Endpoint) {
    this.EP = ep;
    const { req, res } = getSchemas(ep);
    this.req = req;
    this.res = res;

    this.defaults = getServerDefaults(ep);
    this.defaultsStr = toStringDefaultsMap(this.defaults);
    this.pathKeys = getPathParamKeys(ep);

    this.hasRequired = hasRequiredFields(this.req);
    this.requiredKeys = this.hasRequired ? getRequiredKeysFromSchema(this.req) : [];
    this.hasDefaults = Object.keys(this.defaultsStr).length > 0;
  }

  static from(ep: Endpoint): EndpointHarness {
    return new EndpointHarness(ep);
  }

  /** Build normalized query (drops path params first). */
  q(input: Record<string, unknown>): Record<string, string> {
    const noPath = dropPathParams(this.EP, input);
    return buildQuery(this.EP, noPath);
  }

  /** Conventional filename prefix derived from the endpoint. */
  prefix(): string {
    return makeEndpointPrefix(this.EP);
  }
}

/** Conventional filename prefix rules. */
export function makeEndpointPrefix(ep: Endpoint): string {
  const segs = ep
    .split("/")
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^\{(.+)\}$/);
      if (m) return `by-${m[1].replace(/\s+/g, "-")}`;
      return s.toLowerCase();
    });
  if (segs.length === 2 && segs[0] === "coins" && segs[1].startsWith("by-")) {
    return "coins.detail";
  }
  return segs.join(".");
}
