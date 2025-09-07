/**
 * @file src/testkit/types.ts
 * @module testkit/types
 * @summary Types.
 */
// src/testkit/types.ts

import type { VersionPlanPair } from "../types.js";

/**
 * Optional scenario metadata.
 * @property expect (optional: "pass" | "fail").
 */
export type ScenarioMeta = Readonly<{
  /** Expected validator outcome. Default inferred from presence of error.response fixture. */
  expect?: "pass" | "fail";
}>;

/**
 * A discovered scenario file group (request + response variants).
 * @property name (required: string).
 * @property requestPath (required: string).
 * @property responsePath (required: string | null).
 * @property errorResponsePath (required: string | null).
 * @property metaPath (required: string | null).
 */
export type ScenarioFilePair = Readonly<{
  name: string;
  requestPath: string;
  responsePath: string | null;
  errorResponsePath: string | null;
  metaPath: string | null;
}>;

/**
 * Root info for an endpoint’s fixtures.
 * @property validFor (required: VersionPlanPair).
 * @property endpointSlug (required: string).
 * @property rootDir (required: string).
 * @property defaults (required: Readonly<{ requestPath: string | null; responsePath: string | null; }>).
 * @property scenarios (required: ReadonlyArray<ScenarioFilePair>).
 */
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

/**
 * Default (docs) test plan.
 * @property kind (required: "default").
 * @property validFor (required: VersionPlanPair).
 * @property endpointSlug (required: string).
 * @property rootDir (required: string).
 * @property requestPath (required: string | null).
 * @property responsePath (required: string).
 */
export type DefaultTestPlan = Readonly<{
  kind: "default";
  validFor: VersionPlanPair;
  endpointSlug: string;
  rootDir: string;
  requestPath: string | null;
  responsePath: string;
}>;

/**
 * Scenario (variant) test plan.
 * @property kind (required: "scenario").
 * @property validFor (required: VersionPlanPair).
 * @property endpointSlug (required: string).
 * @property rootDir (required: string).
 * @property name (required: string).
 * @property requestPath (required: string).
 * @property responsePath (required: string | null).
 * @property errorResponsePath (required: string | null).
 * @property meta (required: Readonly<{ expect: "pass" | "fail" }>).
 */
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

/**
 * Union of supported plans.
 * @remarks Type: DefaultTestPlan | ScenarioTestPlan
 */
export type TestPlan = DefaultTestPlan | ScenarioTestPlan;

/** Re-export for tests that import only from testkit. */
export type { RequestShape } from "../types.js";
export type { VersionPlanPair } from "../types.js";
