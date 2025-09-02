/**
 * @file src / endpoints / __tests__ / _utils / index.ts
 * @module _utils
 *
 * Private utilities for endpoint tests.
 *
 */

export { EndpointHarness, makeEndpointPrefix } from "./harness.js";
export { makeFixtureLoader, makeSuiteFixtures, Scenarios, type ScenarioKey } from "./fixtures.js";

export {
  expectDropsDefaultsButKeepsRequired,
  expectNoDefaultsKeepOthers,
  expectKeepsOnlyNonDefaults,
  expectMissingRequiredFails,
  expectDropsPathParams,
  expectNoDefaults,
} from "./assertions.js";
