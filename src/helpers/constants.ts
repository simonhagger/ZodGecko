/**
 * src/helpers/constants.ts
 * ---------------------------------------------------------------------------
 * Runtime-agnostic constants shared across the codebase.
 * (Keep Node-specific values out of this module.)
 */

import type { ApiPlan, ApiVersion } from "../types.js";

/**
 * Valid schema slug, e.g. "coins.by-id.market_chart" or "simple.price".
 * Used to validate folder names under `src/schemas`.
 */
export const SLUG_RE = /^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\.by-[a-z0-9_]+(?:\.[a-z0-9_]+)*)?$/;

/** Symbol key used to attach query metadata to Zod schemas. */
export const QMETA_SYMBOL = Symbol.for("zodgecko.qmeta");

/** Matches `{param}` segments in a path template (e.g. "/coins/{id}"). */
export const PATH_PARAM_RE = /\{([^}]+)\}/g;

/** Supported API versions. Keep in sync with codegen & docs. */
export const VERSIONS = ["v3.0.1", "v3.1.1"] as const;
/** Supported API versions as strong typing. Keep in sync with codegen & docs. */
export type VERSIONS = typeof VERSIONS;
/** Supported API plans/channels. */
export const PLANS = ["public", "paid"] as const;
/** Mapping of supported version as strong typing → plan (only valid combos live here). */
export type PLANS = typeof PLANS;
/** Mapping of supported version → plan (only valid combos live here). */
export const VERSION_TO_PLAN: Readonly<Record<ApiVersion, ApiPlan>> = {
  "v3.0.1": "public",
  "v3.1.1": "paid",
} as const;
/** Mapping of supported version as strong typing → plan (only valid combos live here). */
export type VERSION_TO_PLAN = typeof VERSION_TO_PLAN;
