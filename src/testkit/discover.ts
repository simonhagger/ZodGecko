// -----------------------------------------------------------------------------
import * as path from "node:path";

import { endpointRoot, listFiles, pathExists, readJSON } from "./fs.js";
import type {
  DefaultTestPlan,
  EndpointFixtureRoot,
  ScenarioFilePair,
  ScenarioMeta,
  ScenarioTestPlan,
  TestPlan,
} from "./types.js";
import type { VersionPlanPair } from "../types.js";

const DEFAULTS_DIR = "defaults";
const SCENARIOS_DIR = "scenarios";

/** Discover a single endpoint's fixtures (defaults + scenarios). */
export async function discoverEndpointFixtures(
  validFor: VersionPlanPair,
  endpointSlug: string,
): Promise<EndpointFixtureRoot | null> {
  const { version, plan } = validFor;

  const rootDir = endpointRoot(version, plan, endpointSlug);
  const defaultsDir = path.join(rootDir, DEFAULTS_DIR);
  const scenariosDir = path.join(rootDir, SCENARIOS_DIR);

  if (!(await pathExists(rootDir))) return null;

  const defaults = {
    requestPath: (await pathExists(path.join(defaultsDir, "default.request.json")))
      ? path.join(defaultsDir, "default.request.json")
      : null,
    responsePath: (await pathExists(path.join(defaultsDir, "default.response.json")))
      ? path.join(defaultsDir, "default.response.json")
      : null,
  } as const;

  const scenarios: ScenarioFilePair[] = [];
  const files = await listFiles(scenariosDir);
  for (const f of files) {
    const base = path.basename(f);
    if (!base.endsWith(".request.json")) continue;

    const name = base.replace(/\.request\.json$/, "");
    const requestPath = path.join(scenariosDir, `${name}.request.json`);
    const errResp = path.join(scenariosDir, `${name}.error.response.json`);
    const okResp = path.join(scenariosDir, `${name}.response.json`);
    const meta = path.join(scenariosDir, `${name}.meta.json`);

    const errorResponsePath = (await pathExists(errResp)) ? errResp : null;
    const responsePath = !errorResponsePath && (await pathExists(okResp)) ? okResp : null;
    const metaPath = (await pathExists(meta)) ? meta : null;

    scenarios.push({ name, requestPath, responsePath, errorResponsePath, metaPath });
  }

  if (!defaults.responsePath && scenarios.length === 0) return null;

  return {
    validFor,
    endpointSlug,
    rootDir,
    defaults,
    scenarios,
  };
}

/** Build concrete test plans for an endpoint fixture root. */
export async function buildTestPlans(root: EndpointFixtureRoot): Promise<TestPlan[]> {
  const plans: TestPlan[] = [];

  if (root.defaults.responsePath) {
    const defaultPlan: DefaultTestPlan = {
      kind: "default",
      validFor: root.validFor,
      endpointSlug: root.endpointSlug,
      rootDir: root.rootDir,
      requestPath: root.defaults.requestPath,
      responsePath: root.defaults.responsePath,
    };
    plans.push(defaultPlan);
  }

  for (const s of root.scenarios) {
    const meta: ScenarioMeta = s.metaPath ? await readJSON<ScenarioMeta>(s.metaPath) : {};
    const scenarioPlan: ScenarioTestPlan = {
      kind: "scenario",
      validFor: root.validFor,
      endpointSlug: root.endpointSlug,
      rootDir: root.rootDir,
      name: s.name,
      requestPath: s.requestPath,
      responsePath: s.responsePath,
      errorResponsePath: s.errorResponsePath,
      meta: { expect: meta.expect ?? (s.errorResponsePath ? "fail" : "pass") },
    };
    plans.push(scenarioPlan);
  }

  return plans;
}
