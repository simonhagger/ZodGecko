// src/endpoints/__tests__/_utils/fixtures.ts
import { makeEndpointPrefix } from "./harness.js"; // forward ref is fine due to ESM order at run-time
import type { Endpoint } from "../../../runtime/endpoints.js";
// import { getSchemas, type Endpoint } from "../../../runtime/index.js";

export const Scenarios = Object.freeze({
  defaults: "defaults",
  nonDefaults: "non-defaults",
  wrongTypes: "wrong-types",
  missingRequired: "missing-required",
} as const);
export type ScenarioKey = (typeof Scenarios)[keyof typeof Scenarios];

export type FixtureLoader = Readonly<{
  load<T = unknown>(relativePathFromTest: string): Promise<T>;
  request<T = Record<string, unknown>>(scenario: ScenarioKey): Promise<T | undefined>;
  response<T = unknown>(): Promise<T | undefined>;
  responseByName<T = unknown>(name: string): Promise<T | undefined>;
}>;

/** Build a loader bound to the test file URL. */
export function makeFixtureLoader(ep: Endpoint, baseUrl: string): FixtureLoader {
  const prefix = makeEndpointPrefix(ep);
  //   const { req, res } = getSchemas(ep);

  async function _safeImport<T>(href: string): Promise<T | undefined> {
    try {
      const mod = (await import(href, { with: { type: "json" } })) as { default: T };
      return mod.default;
    } catch {
      return undefined;
    }
  }

  async function load<T = unknown>(relativePathFromTest: string): Promise<T> {
    const url = new URL(relativePathFromTest, baseUrl);
    const res = await _safeImport<T>(url.href);
    if (res === undefined) throw new Error(`Fixture not found: ${relativePathFromTest}`);
    return res;
  }

  async function request<T = Record<string, unknown>>(
    scenario: ScenarioKey,
  ): Promise<T | undefined> {
    if (!prefix) return undefined;
    const url = new URL(`./fixtures/${prefix}.requests.json`, baseUrl);
    const obj = await _safeImport<Record<ScenarioKey, T>>(url.href);
    return obj?.[scenario];
  }

  async function response<T = unknown>(): Promise<T | undefined> {
    const url = new URL(`./fixtures/${prefix}.response.json`, baseUrl);
    return _safeImport<T>(url.href);
  }
  async function responseByName<T = unknown>(name: string): Promise<T | undefined> {
    const url = new URL(`./fixtures/${name}`, baseUrl);
    return _safeImport<T>(url.href);
  }

  return Object.freeze({ load, request, response, responseByName });
}

/** Convenience: build a loader using the conventional prefix for an endpoint. */
export function makeSuiteFixtures(ep: Endpoint, baseUrl: string): FixtureLoader {
  return makeFixtureLoader(ep, baseUrl);
}
