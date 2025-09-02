/**
 * @file src/schemas/coins.by-id.contract.by-contract_address/v3.0.1/index.ts
 * @module schemas/coins.by-id.contract.by-contract_address/v3.0.1/index
 */

/** Zod import */
import type z from "zod";

/** Local schema files */
import { type requestSchema } from "./request.js";
import { type responseSchema } from "./response.js";

/** Request schema for coins.by-id.contract.by-contract_address */
export { requestSchema } from "./request.js";
/** Response schema for coins.by-id.contract.by-contract_address */
export { responseSchema } from "./response.js";
/** Request type for coins.by-id.contract.by-contract_address */
export type Request = z.infer<typeof requestSchema>;
/** Response type for coins.by-id.contract.by-contract_address */
export type Response = z.infer<typeof responseSchema>;
