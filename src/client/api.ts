// src/client/api.ts

// External imports
// (none)

// Internal imports
import { defaultBaseFor } from "./defaults.js";
import { formatParamsForEndpoint } from "../helpers/format-params.js";
import { formatPath } from "../helpers/format-path.js";
import { getRequestFor as getRequestSurface } from "../helpers/get-request-for.js";
import { toURL } from "../helpers/to-url.js";
import type {} from "../registry/select.js";
import type { GENERATED_REGISTRY } from "../registry/generated.js";
import { selectEntries } from "../registry/select.js";
import type {
  RequestShape,
  VersionPlanPair,
  EntryFor,
  EndpointPathFor,
  VersionPlanKey,
} from "../types.js";

export type ClientOptions<V extends VersionPlanPair> = Readonly<{
  validFor: V;
  baseURL?: string;
}>;

/** Core, no-network API client narrowed by VersionPlanPair. */
export class ZodGecko<V extends VersionPlanPair> {
  public readonly validFor: V;
  public readonly baseURL: string;
  private readonly entries: Readonly<Record<EndpointPathFor<V>, EntryFor<V>>>;

  constructor(opts: ClientOptions<V>) {
    this.validFor = opts.validFor;

    // Derive a stable default base per Version/Plan (includes /v3)
    const key = `${opts.validFor.version}/${opts.validFor.plan}`;
    this.baseURL = opts.baseURL ?? defaultBaseFor(key as VersionPlanKey);
    const list = selectEntries(this.validFor);
    const pairs = list.map((e) => [e.pathTemplate as EndpointPathFor<V>, e] as const);
    this.entries = Object.freeze(Object.fromEntries(pairs)) as Readonly<
      Record<EndpointPathFor<V>, EntryFor<V>>
    >;
  }

  /** Endpoint paths available for this version/plan (typed union). */
  endpoints(): ReadonlyArray<EndpointPathFor<V>> {
    return Object.keys(this.entries) as ReadonlyArray<EndpointPathFor<V>>;
  }

  /** Full registry entry (schemas, path template, query rules, etc.). */
  entry<const P extends EndpointPathFor<V>>(path: P): EntryFor<V> {
    const ep = this.endpoints().filter((p) => p === path);
    if (!ep) {
      throw new Error(
        `Unknown endpoint for ${this.validFor.version}/${this.validFor.plan}: ${String(path)}`,
      );
    }
    const e = this.entries[ep[0]];
    if (!e) {
      throw new Error(
        `Unknown endpoint for ${this.validFor.version}/${this.validFor.plan}: ${String(path)}`,
      );
    }
    return e;
  }

  /** Schema-guided request “surface” with defaults/optionals for an endpoint. */
  getRequestFor<const P extends EndpointPathFor<V>>(
    path: P,
    opts?: Parameters<typeof getRequestSurface>[1],
  ): Readonly<{ pathTemplate: string } & RequestShape> {
    return getRequestSurface(path, opts) as Readonly<{ pathTemplate: string } & RequestShape>;
  }

  /** Build a full URL (base + formatted path + encoded query) for an endpoint. */
  url<const P extends EndpointPathFor<V>>(path: P, req: RequestShape): string {
    const ent = this.entries[path] as (typeof GENERATED_REGISTRY)[number];
    if (!ent) {
      throw new Error(
        `Unknown endpoint for ${this.validFor.version}/${this.validFor.plan}: ${String(path)}`,
      );
    }
    const pathname = formatPath(ent.pathTemplate, req.path ?? {});
    const qs = formatParamsForEndpoint(path, req.query ?? {}); // ensure helper is path-keyed
    return toURL(this.baseURL, pathname, qs);
  }
}
