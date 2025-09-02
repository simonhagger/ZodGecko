// -----------------------------------------------------------------------------
// file: src/testkit/run.ts
// -----------------------------------------------------------------------------

// Internal imports (alphabetized; single group)
import { synthesizeDefaultRequest } from "./default-request.js";
import { readJSON } from "./fs.js";
import type { DefaultTestPlan, ScenarioTestPlan } from "./types.js";
import { explainError } from "../helpers/explain-error.js";
import { formatParamsForEndpoint } from "../helpers/format-params.js";
import { formatPath } from "../helpers/format-path.js";
import { parseRequest } from "../helpers/parse-request.js";
import { parseResponse } from "../helpers/parse-response.js";
import { toURL } from "../helpers/to-url.js";
import { pathTemplateFromSlug } from "../registry/path-from-slug.js";
import type { QueryValue, RequestShape } from "../types/api.js";

type DefaultResult =
  | { status: "pass"; url: string }
  | { status: "fail"; url: string; message: string }
  | { status: "skipped"; reason: string };

type ScenarioResult =
  | { status: "pass"; url: string }
  | { status: "fail"; url: string; message: string };

/** Safely convert unknown error-like values into a string message. */
function toMessage(e: unknown): string {
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  try {
    return JSON.stringify(e);
  } catch {
    return "Unknown error";
  }
}

/** Narrow arbitrary input to a minimal RequestShape without using `any`. */
function sanitizeRequestShape(x: unknown): RequestShape {
  const out: { path?: Record<string, string>; query?: Record<string, QueryValue> } = {};

  if (x && typeof x === "object") {
    const obj = x as Record<string, unknown>;

    // path: { [k: string]: string }
    if (obj.path && typeof obj.path === "object" && obj.path !== null && !Array.isArray(obj.path)) {
      const p: Record<string, string> = {};
      for (const [k, v] of Object.entries(obj.path as Record<string, unknown>)) {
        if (typeof v === "string") p[k] = v;
      }
      if (Object.keys(p).length > 0) out.path = p;
    }

    // query: { [k: string]: QueryValue }
    if (
      obj.query &&
      typeof obj.query === "object" &&
      obj.query !== null &&
      !Array.isArray(obj.query)
    ) {
      const q: Record<string, QueryValue> = {};
      for (const [k, v] of Object.entries(obj.query as Record<string, unknown>)) {
        const t = typeof v;
        if (t === "string" || t === "number" || t === "boolean") {
          q[k] = v as QueryValue;
          continue;
        }
        if (Array.isArray(v)) {
          let ok = true;
          for (const el of v) {
            const et = typeof el;
            if (!(et === "string" || et === "number" || et === "boolean")) {
              ok = false;
              break;
            }
          }
          if (ok) q[k] = v as QueryValue;
        }
      }
      if (Object.keys(q).length > 0) out.query = q;
    }
  }

  return out;
}

export async function runDefaultTest(plan: DefaultTestPlan): Promise<DefaultResult> {
  // Build a raw request source; if synth returns null, skip immediately
  let raw: unknown;
  if (plan.requestPath) {
    raw = await readJSON<unknown>(plan.requestPath);
  } else {
    const synth = synthesizeDefaultRequest(plan.endpointSlug); // RequestShape | null
    if (!synth) {
      return {
        status: "skipped",
        reason:
          "Endpoint requires path params; provide defaults/default.request.json to enable default test.",
      };
    }
    raw = synth;
  }

  // Sanitize unknown → RequestShape, then validate/normalize
  const reqShape = sanitizeRequestShape(raw);
  const parsedReq = parseRequest(plan.endpointSlug, reqShape);

  // Derive path template from slug (slug→/coins/{id} rule)
  const { template } = pathTemplateFromSlug(plan.endpointSlug);
  const path = formatPath(template, parsedReq.path ?? {});
  const qs = formatParamsForEndpoint(plan.endpointSlug, parsedReq.query ?? {});
  const url = toURL("https://api.coingecko.com/api", path, qs);

  // Read response as unknown and validate
  const response = await readJSON<unknown>(plan.responsePath);
  try {
    parseResponse(plan.endpointSlug, response);
    return { status: "pass", url };
  } catch (e: unknown) {
    return { status: "fail", url, message: explainError(toMessage(e)) };
  }
}

export async function runScenarioTest(plan: ScenarioTestPlan): Promise<ScenarioResult> {
  // Request as unknown → sanitize → validate/normalize
  const raw = await readJSON<unknown>(plan.requestPath);
  const reqShape = sanitizeRequestShape(raw);
  const parsedReq = parseRequest(plan.endpointSlug, reqShape);

  // Response as unknown (branch to avoid unknown|null unions)
  let response: unknown;
  if (plan.errorResponsePath) {
    response = await readJSON<unknown>(plan.errorResponsePath);
  } else if (plan.responsePath) {
    response = await readJSON<unknown>(plan.responsePath);
  } else {
    response = undefined;
  }

  const { template } = pathTemplateFromSlug(plan.endpointSlug);
  const path = formatPath(template, parsedReq.path ?? {});
  const qs = formatParamsForEndpoint(plan.endpointSlug, parsedReq.query ?? {});
  const url = toURL("https://api.coingecko.com/api", path, qs);

  try {
    if (plan.meta.expect === "fail") {
      let threw = false;
      try {
        parseResponse(plan.endpointSlug, response);
      } catch {
        threw = true;
      }
      if (!threw) {
        return {
          status: "fail",
          url,
          message: "Expected response to fail validation, but it passed.",
        };
      }
      return { status: "pass", url };
    }

    parseResponse(plan.endpointSlug, response);
    return { status: "pass", url };
  } catch (e: unknown) {
    return { status: "fail", url, message: explainError(toMessage(e)) };
  }
}
