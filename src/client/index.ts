/**
 * @file src/client/index.ts
 * @module client/index
 * @summary Index.
 */
// External imports
// (none)

// Internal imports
export { ZodGecko } from "./api.js";
export { type ClientOptions } from "../types.js";
export { createClient } from "./factory.js";
export { DEFAULT_BASE_BY_VERSION, defaultBaseFor } from "./defaults.js";
