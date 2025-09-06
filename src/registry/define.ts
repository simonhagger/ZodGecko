/**
 * @file src/registry/define.ts
 * @module registry/define
 * @summary Define.
 */
// src/registry/define.ts

// External imports
import type z from "zod";

// Internal imports
import { EmptyRequest, EmptyResponse } from "../schemas/_shared/structures.js";
import type {
  RegistryEndpoint,
  QueryRule,
  HttpMethod,
  QueryPrimitive,
  VersionPlanPair,
} from "../types.js";

/**
 * Input shape for defining a registry endpoint.
 * @property id (required: string).
 * @property validFor (required: VersionPlanPair).
 * @property method (optional: HttpMethod).
 * @property pathTemplate (required: string).
 * @property requiredPath (optional: ReadonlyArray<string>).
 * @property requiredQuery (optional: ReadonlyArray<string>).
 * @property queryRules (optional: ReadonlyArray<QueryRule>).
 * @property serverDefaults (optional: Readonly<Record<string, QueryPrimitive | readonly QueryPrimitive[]>>).
 * @property requestSchema (optional: z.ZodTypeAny).
 * @property responseSchema (required: z.ZodTypeAny).
 */
export type DefineEndpointInput = Readonly<{
  id: string;
  validFor: VersionPlanPair;
  method?: HttpMethod; // defaults to "GET"
  pathTemplate: string;
  requiredPath?: ReadonlyArray<string>;
  requiredQuery?: ReadonlyArray<string>;
  queryRules?: ReadonlyArray<QueryRule>;
  serverDefaults?: Readonly<Record<string, QueryPrimitive | readonly QueryPrimitive[]>>;
  requestSchema?: z.ZodTypeAny;
  responseSchema: z.ZodTypeAny;
}>;

/**
 * Create a normalized RegistryEndpoint from minimal inputs.
 * @param input (required: object)
 * @returns object
 */
export function defineEndpoint(input: DefineEndpointInput): RegistryEndpoint {
  const method = input.method ?? "GET";
  const requiredPath = input.requiredPath ?? extractParams(input.pathTemplate);
  const queryRules = input.queryRules ?? [];
  const requiredQuery = input.requiredQuery ?? [];
  const serverDefaults = input.serverDefaults ?? {};

  return {
    id: input.id,
    validFor: input.validFor,
    method,
    pathTemplate: input.pathTemplate,
    requiredPath,
    requiredQuery,
    queryRules,
    serverDefaults,
    requestSchema: input.requestSchema ?? EmptyRequest,
    responseSchema: input.responseSchema ?? EmptyResponse,
  };
}

/** Extract `{param}` names from a path template. */
function extractParams(tpl: string): string[] {
  const out = new Set<string>();
  const re = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tpl))) out.add(m[1]);
  return Array.from(out);
}
