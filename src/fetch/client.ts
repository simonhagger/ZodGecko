/**
 * @file src/fetch/client.ts
 * @module fetch/client
 * @summary Client.
 */
// src/fetch/client.ts

// External imports
// (none)

// Internal imports
import { ZodGecko } from "../client/api.js";
import { parseRequest } from "../helpers/parse-request.js";
import { parseResponse } from "../helpers/parse-response.js";
import type { RequestShape, VersionPlanPair, EndpointPathFor } from "../types.js";

/* --------------------------------- Types ---------------------------------- */

/** Plain object form of headers (no DOM types). */
type PlainHeaders = Readonly<Record<string, string | number | boolean>>;

/** Tuple array form of headers ([key, value]) (no DOM types). */
type TupleHeaders = ReadonlyArray<readonly [string, string | number | boolean]>;

/** Minimal “Headers-like” interface we can detect at runtime (forEach only). */
type ForEachHeaders = Readonly<{
  forEach: (cb: (value: string, key: string) => void) => void;
}>;

/** Unified input for headers merging (covers common shapes without DOM). */
type HeadersLike = PlainHeaders | TupleHeaders | ForEachHeaders;

/** Minimal init we accept (keeps typing local; avoids DOM's RequestInit). */
type RequestInitLike = Readonly<{
  headers?: HeadersLike;
}> &
  Readonly<Record<string, unknown>>;

/* ----------------------------- Type Guards -------------------------------- */

function isForEachHeaders(x: unknown): x is ForEachHeaders {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as { forEach?: unknown }).forEach === "function"
  );
}

function isTupleHeaders(x: unknown): x is TupleHeaders {
  return Array.isArray(x) && x.every((e) => Array.isArray(e) && typeof e[0] === "string");
}

function isPlainHeaders(x: unknown): x is PlainHeaders {
  if (typeof x !== "object" || x === null || Array.isArray(x)) return false;
  // Quick shallow check: all values are primitive-ish
  for (const [, v] of Object.entries(x as Record<string, unknown>)) {
    const t = typeof v;
    if (!(t === "string" || t === "number" || t === "boolean")) return false;
  }
  return true;
}

/* ------------------------------ Utilities --------------------------------- */

/** Normalize various header inputs to a plain `{[k]: string}` without `any`. */
function headersToObject(h?: HeadersLike): Record<string, string> {
  const out: Record<string, string> = {};
  if (!h) return out;

  if (isForEachHeaders(h) && !isTupleHeaders(h) && !isPlainHeaders(h)) {
    h.forEach((value: string, key: string): void => {
      out[key] = value;
    });
    return out;
  }

  if (isTupleHeaders(h)) {
    for (const [k, v] of h) {
      out[k] = String(v);
    }
    return out;
  }

  if (isPlainHeaders(h)) {
    for (const [k, v] of Object.entries(h)) {
      out[k] = String(v);
    }
    return out;
  }

  // Fallback: ignore unknown shapes rather than risk unsafe coercion
  return out;
}

/* --------------------------------- Client --------------------------------- */

/**
 * Options for the minimal fetch client (no DOM types required).
 * @property validFor (required: V).
 * @property baseURL (optional: string).
 * @property apiKey (optional: string).
 * @property userAgent (optional: string).
 * @property headers (optional: HeadersLike).
 */
export type FetchClientOptions<V extends VersionPlanPair> = Readonly<{
  validFor: V;
  baseURL?: string;
  apiKey?: string;
  userAgent?: string;
  headers?: HeadersLike;
}>;

/**
 * Build default headers for CoinGecko GET calls.
 * @param opts (required: object)
 * @returns object
 */
export function buildHeaders(opts: FetchClientOptions<VersionPlanPair>): Record<string, string> {
  const base: Record<string, string> = headersToObject(opts.headers);

  if (opts.apiKey) base["x-cg-pro-api-key"] = opts.apiKey;
  if (opts.userAgent) base["user-agent"] = opts.userAgent;

  return base;
}

/** Minimal networked client built on top of the core ZodGecko (no retries/caching). */
export class ZodGeckoFetch<V extends VersionPlanPair> extends ZodGecko<V> {
  private readonly defaultHeaders: Readonly<Record<string, string>>;

  constructor(opts: FetchClientOptions<V>) {
    super({ validFor: opts.validFor, baseURL: opts.baseURL });
    this.defaultHeaders = buildHeaders(opts);
  }

  /** GET helper: build URL, fetch, parse request/response. */
  async get<TPath extends EndpointPathFor<V>>(
    path: TPath,
    req: RequestShape,
    init?: RequestInitLike,
  ): Promise<unknown> {
    // Validate & normalize request against the endpoint schema
    const normalizedReq = parseRequest(path, req);

    // Build URL with registry-aware path & query normalization
    const url = this.url(path as EndpointPathFor<V>, normalizedReq);

    // Merge headers deterministically
    const mergedHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...headersToObject(init?.headers),
    };

    const res = await fetch(url, {
      method: "GET",
      headers: mergedHeaders,
      ...init,
    } as unknown as RequestInit); // cast once at the boundary to satisfy runtime fetch

    const json: unknown = await res.json();
    return parseResponse(path as EndpointPathFor<V>, json);
  }
}
