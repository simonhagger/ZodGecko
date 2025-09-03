// src/testkit/__tests__/fixtures/runner.spec.ts

// External imports
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

// Internal imports
import {
  VERSIONS,
  VERSION_TO_PLAN,
  isValidVersionPlan,
  type ApiVersion,
  type VersionPlanPair,
} from "../../types.js";
import { buildTestPlans, discoverEndpointFixtures } from "../discover.js";
import { fixturesRoot } from "../fs.js";
import { runDefaultTest, runScenarioTest } from "../run.js";
import type { DefaultTestPlan, ScenarioTestPlan } from "../types.js";

// Optional: limit to specific endpoint slugs during TDD (empty = include all)
const ENDPOINT_SLUGS: string[] = [];

/** Discover valid endpoints and precompute their plans so we can define tests synchronously. */
async function discoverAll(): Promise<
  Array<{
    validFor: VersionPlanPair;
    endpointSlug: string;
    defaultPlan: DefaultTestPlan | null;
    scenarioPlans: ReadonlyArray<ScenarioTestPlan>;
  }>
> {
  const rootDir = fixturesRoot();
  const results: Array<{
    validFor: VersionPlanPair;
    endpointSlug: string;
    defaultPlan: DefaultTestPlan | null;
    scenarioPlans: ReadonlyArray<ScenarioTestPlan>;
  }> = [];

  let versionDirs: string[] = [];
  try {
    // Only consider known versions from our single source of truth
    const entries = await fs.readdir(rootDir, { withFileTypes: true });
    versionDirs = entries
      .filter((d) => d.isDirectory() && (VERSIONS as readonly string[]).includes(d.name))
      .map((d) => d.name);
  } catch {
    // No fixtures root → nothing to test
    return results;
  }

  for (const versionName of versionDirs) {
    const version = versionName as ApiVersion;
    const plan = VERSION_TO_PLAN[version];
    const validFor = { version, plan } as VersionPlanPair;

    // Enforce valid pair (defensive even though derived from VERSION_TO_PLAN)
    if (!isValidVersionPlan(validFor)) continue;

    const vpDir = path.join(rootDir, version, plan);

    let endpointDirs: string[] = [];
    try {
      endpointDirs = (await fs.readdir(vpDir, { withFileTypes: true }))
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      // No endpoints folder for this pair → skip
      continue;
    }

    for (const endpointSlug of endpointDirs) {
      if (ENDPOINT_SLUGS.length > 0 && !ENDPOINT_SLUGS.includes(endpointSlug)) continue;

      const root = await discoverEndpointFixtures(validFor, endpointSlug);
      if (!root) continue;

      const plans = await buildTestPlans(root);
      const defaultPlan = plans.find((p) => p.kind === "default") ?? null;
      const scenarioPlans = plans.filter((p): p is ScenarioTestPlan => p.kind === "scenario");

      // If neither defaults nor scenarios are present, skip entirely (invisible).
      if (!defaultPlan && scenarioPlans.length === 0) continue;

      results.push({ validFor, endpointSlug, defaultPlan, scenarioPlans });
    }
  }

  return results;
}

// Top-level discovery (Vitest supports top-level await in ESM)
const DISCOVERED = await discoverAll();

describe("Endpoint fixtures", () => {
  // Keep suite non-empty, but invisible if no endpoints exist.
  if (DISCOVERED.length === 0) {
    it("no endpoints discovered", () => {
      expect(true).toBe(true);
    });
    return;
  }

  for (const { validFor, endpointSlug, defaultPlan, scenarioPlans } of DISCOVERED) {
    const { version, plan } = validFor;

    describe(`${version}/${plan}/${endpointSlug}`, () => {
      if (defaultPlan) {
        it("defaults", async () => {
          const result = await runDefaultTest(defaultPlan);
          if (result.status === "skipped") {
            // Keep output tidy but informative when defaults can't be synthesized
            console.warn(`[SKIP] ${version}/${plan}/${endpointSlug}: ${result.reason}`);
            return;
          }
          expect(result.status).toBe("pass");
        });
      }

      // Define scenarios test ONLY when at least one scenario exists.
      if (scenarioPlans.length > 0) {
        it("scenarios", async () => {
          for (const s of scenarioPlans) {
            const result = await runScenarioTest(s);
            expect(result.status).toBe("pass");
          }
        });
      }
    });
  }
});
