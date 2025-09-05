/**
 * @file src/schemas/coins.by-id.contract.by-contract_address.market_chart/v3.0.1/public/index.ts
 * @module schemas/coins.by-id.contract.by-contract_address.market_chart/v3.0.1/public/index
  * @summary Index.
 */

/** Zod import */
import type z from "zod";

/** Local schema files */
import { type requestSchema } from "./request.js";
import { type responseSchema } from "./response.js";

/** Request schema for coins.by-id.contract.by-contract_address.market_chart */
export { requestSchema } from "./request.js";
/** Response schema for coins.by-id.contract.by-contract_address.market_chart */
export { responseSchema } from "./response.js";
/** Request type for coins.by-id.contract.by-contract_address.market_chart */
export type Request = z.infer<typeof requestSchema>;
/** Response type for coins.by-id.contract.by-contract_address.market_chart */
export type Response = z.infer<typeof responseSchema>;

// /** meta data for coins.by-id.contract.by-contract_address.market_chart */
// export const meta = {
//   pathTemplate: "/coins/{id}/contract/{contract_address}/market_chart",
//   method: "GET", // optional (defaults to GET)
// } as const;
