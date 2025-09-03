// src/testkit/types.ts

import type { VersionPlanPair } from "../types.js";

/** Optional scenario metadata. */
export type ScenarioMeta = Readonly<{
  /** Expected validator outcome. Default inferred from presence of error.response fixture. */
  expect?: "pass" | "fail";
}>;

/** A discovered scenario file group (request + response variants). */
export type ScenarioFilePair = Readonly<{
  name: string;
  requestPath: string;
  responsePath: string | null;
  errorResponsePath: string | null;
  metaPath: string | null;
}>;

/** Root info for an endpoint’s fixtures. */
export type EndpointFixtureRoot = Readonly<{
  validFor: VersionPlanPair;
  endpointSlug: string;
  rootDir: string;
  defaults: Readonly<{
    requestPath: string | null;
    responsePath: string | null;
  }>;
  scenarios: ReadonlyArray<ScenarioFilePair>;
}>;

/** Default (docs) test plan. */
export type DefaultTestPlan = Readonly<{
  kind: "default";
  validFor: VersionPlanPair;
  endpointSlug: string;
  rootDir: string;
  requestPath: string | null;
  responsePath: string;
}>;

/** Scenario (variant) test plan. */
export type ScenarioTestPlan = Readonly<{
  kind: "scenario";
  validFor: VersionPlanPair;
  endpointSlug: string;
  rootDir: string;
  name: string;
  requestPath: string;
  responsePath: string | null;
  errorResponsePath: string | null;
  meta: Readonly<{ expect: "pass" | "fail" }>;
}>;

/** Union of supported plans. */
export type TestPlan = DefaultTestPlan | ScenarioTestPlan;

/** Re-export for tests that import only from testkit. */
export type { RequestShape } from "../types.js";
export type { VersionPlanPair } from "../types.js";
