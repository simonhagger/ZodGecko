/**
 * @file src / endpoints / index.ts
 * @module endpoints
 *
 * Public namespaces for all endpoint groups.
 * Each submodule exposes:
 *   - `schemas`: runtime Zod schemas
 *   - `requests`/`responses`: TypeScript types (via `export type`)
 */
export * as assetPlatforms from "./asset-platforms/index.js";
export * as categories from "./categories/index.js";
export * as coins from "./coins/index.js";
export * as companies from "./companies/index.js";
export * as contract from "./contract/index.js";
export * as derivatives from "./derivatives/index.js";
export * as exchanges from "./exchanges/index.js";
export * as global from "./global/index.js";
export * as indexes from "./indexes/index.js";
export * as ping from "./ping/index.js";
export * as search from "./search/index.js";
export * as simple from "./simple/index.js";
