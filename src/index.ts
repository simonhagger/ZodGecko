/**
 * @file src/index.ts
 * @module root
 *
 * Public API surface — endpoint namespaces exported at the package root.
 *
 * @example
 * import { coins, buildQuery } from "zodgecko";
 * const req = coins.schemas.MarketsRequestSchema.parse({ vs_currency: "usd" });
 * const qs = new URLSearchParams(
 *   buildQuery("/coins/markets", req),
 * ).toString();
 */
export * from "./core/index.js";

export * from "./runtime/index.js";

// Namespaces at root (no `/endpoints` in import path)
export * from "./endpoints/index.js";
