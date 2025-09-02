/**
 * @file src/schemas/coins.by-id.market_chart.range/v3.0.1/index.ts
 * @module schemas/coins.by-id.market_chart.range/v3.0.1/index
 */

/** Zod import */
import type z from "zod";

/** Local schema files */
import { type requestSchema } from "./request.js";
import { type responseSchema } from "./response.js";

/** Request schema for coins.by-id.market_chart.range */
export { requestSchema } from "./request.js";
/** Response schema for coins.by-id.market_chart.range */
export { responseSchema } from "./response.js";
/** Request type for coins.by-id.market_chart.range */
export type Request = z.infer<typeof requestSchema>;
/** Response type for coins.by-id.market_chart.range */
export type Response = z.infer<typeof responseSchema>;
