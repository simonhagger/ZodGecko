/**
 * @file src/index.ts
 * @module root
 *
 * Package root — consolidated public API.
 *
 * Design:
 * - Re-export **core** (pure utilities) and **runtime** (endpoint-aware) surfaces.
 * - Re-export **endpoints** namespaces for direct schema access (e.g. `coins.schemas.*`).
 * - Explicitly re-export URL helpers from **runtime** at the end so that
 *   root-level consumers get the runtime-aware variants by default.
 *
 * @example
 * import { getSchemas, formatPath, toURL, DEFAULT_BASE } from "zodgecko";
 *
 * // Derive request/response schemas for an endpoint
 * const { req, res } = getSchemas("/coins/{id}/ohlc");
 *
 * // Parse & validate request params
 * const parsed = req.parse({ id: "bitcoin", vs_currency: "usd", days: 1 });
 *
 * // Build a safe path from the template + params
 * const path = formatPath("/coins/{id}/ohlc", parsed);
 *
 * // Build a full URL with normalized query string, using DEFAULT_BASE
 * const url = toURL(DEFAULT_BASE, path, parsed);
 *
 * // Later: validate a response payload
 * const validated = res.parse(await fetchJSON(url));
 */

// Core (pure, framework-agnostic helpers)
export * from "./core/index.js";

// Runtime (endpoint-aware helpers: buildQuery, defaults, validators, etc.)
export * from "./runtime/index.js";

// Endpoint namespaces (e.g., coins.schemas.*, exchanges.schemas.*, …)
export * from "./endpoints/index.js";

/**
 * Prefer runtime URL helpers at the root (over core ones).
 * These explicit re-exports ensure the root surface uses the runtime-aware path utilities.
 * Note: core also exports some of these names; placing this block last ensures
 * the runtime versions are the ones exposed at the package root.
 */
export {
  DEFAULT_BASE,
  formatPath, // runtime re-export (delegates to core)
  joinBaseAndPath, // runtime re-export (delegates to core)
  toURL,
  qsString,
} from "./runtime/url.js";
