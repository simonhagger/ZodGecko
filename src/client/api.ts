// src/client/api.ts

// External imports
// (none)

// Internal imports
import { defaultBaseFor } from "./defaults.js";
import { formatParamsForEndpoint } from "../helpers/format-params.js";
import { formatPath } from "../helpers/format-path.js";
import { getRequestFor as getRequestSurface } from "../helpers/get-request-for.js";
import { toURL } from "../helpers/to-url.js";
import { getPathInfo } from "../registry/index.js";
import type { EndpointIdFor, EntryFor } from "../registry/select.js";
import { selectEntryMap } from "../registry/select.js";
import type { RequestShape, VersionPlanKey, VersionPlanPair } from "../types/api.js";

export type ClientOptions<V extends VersionPlanPair> = Readonly<{
  validFor: V;
  baseURL?: string;
}>;

export type { RequestShape } from "../types/api.js";

/** Core, no-network API client narrowed by VersionPlanPair. */
export class ZodGecko<V extends VersionPlanPair> {
  public readonly validFor: V;
  public readonly baseURL: string;
  private readonly entries: Readonly<Record<EndpointIdFor<V>, EntryFor<V>>>;

  constructor(opts: ClientOptions<V>) {
    this.validFor = opts.validFor;

    // Derive a stable default base per Version/Plan (includes /v3)
    const key = `${opts.validFor.version}/${opts.validFor.plan}` as VersionPlanKey;
    this.baseURL = opts.baseURL ?? defaultBaseFor(key);

    this.entries = selectEntryMap(this.validFor);
  }

  /** Endpoint ids available for this version/plan (typed union). */
  endpoints(): ReadonlyArray<EndpointIdFor<V>> {
    return Object.keys(this.entries) as ReadonlyArray<EndpointIdFor<V>>;
  }

  /** Full registry entry (schemas, path template, query rules, etc.). */
  entry(id: EndpointIdFor<V>): EntryFor<V> {
    const e = this.entries[id];
    if (!e) {
      throw new Error(
        `Unknown endpoint for ${this.validFor.version}/${this.validFor.plan}: ${String(id)}`,
      );
    }
    return e;
  }

  /** Schema-guided request “surface” with defaults/optionals for an endpoint. */
  getRequestFor(
    id: EndpointIdFor<V>,
    opts?: Parameters<typeof getRequestSurface>[1],
  ): Readonly<{ pathTemplate: string } & RequestShape> {
    return getRequestSurface(id, opts) as Readonly<{ pathTemplate: string } & RequestShape>;
  }

  /** Build a full URL (base + formatted path + encoded query) for an endpoint. */
  url(id: EndpointIdFor<V>, req: RequestShape): string {
    const ent = this.entry(id);

    // Path: prefer registry pathTemplate for this variant
    const pathInfo = getPathInfo(id, this.validFor);
    const tpl = pathInfo?.pathTemplate ?? ent.pathTemplate;
    const path = formatPath(tpl, req.path ?? {});

    // Query: registry-aware normalization
    const query = formatParamsForEndpoint(id, req.query ?? {});

    return toURL(this.baseURL, path, query);
  }
}
