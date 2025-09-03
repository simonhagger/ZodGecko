import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { VersionPlanPair } from "../../types.js";
import { buildTestPlans, discoverEndpointFixtures } from "../discover.js";
import * as fsApi from "../fs.js";
import type { EndpointFixtureRoot, ScenarioTestPlan } from "../types.js";

const VF: VersionPlanPair = { version: "v3.0.1", plan: "public" };
const files = new Set<string>();

/** Helper to add a canonical, OS-normalized path to the fake FS. */
function add(...parts: string[]): void {
  files.add(path.join(...parts));
}

beforeEach((): void => {
  vi.spyOn(fsApi, "fixturesRoot").mockReturnValue(path.join("/root"));
  vi.spyOn(fsApi, "endpointRoot").mockImplementation(
    (version: string, plan: string, slug: string): string =>
      path.join("/root", version, plan, slug),
  );
  vi.spyOn(fsApi, "pathExists").mockImplementation(
    (p: string): Promise<boolean> => Promise.resolve(files.has(p)),
  );
  vi.spyOn(fsApi, "listFiles").mockImplementation((dir: string): Promise<string[]> => {
    const prefix = dir.endsWith(path.sep) ? dir : dir + path.sep;
    const out: string[] = [];
    for (const f of files) {
      if (!f.startsWith(prefix)) continue;
      const rest = f.slice(prefix.length);
      if (!rest.includes(path.sep)) out.push(prefix + rest);
    }
    return Promise.resolve(out);
  });
  vi.spyOn(fsApi, "readJSON").mockImplementation(
    <T>(_p: string): Promise<T> => Promise.resolve(JSON.parse('{"expect":"fail"}') as T),
  );
});

afterEach((): void => {
  vi.restoreAllMocks();
  files.clear();
});

describe("discoverEndpointFixtures", () => {
  it("returns null when neither defaults nor scenarios exist", async (): Promise<void> => {
    add("/root", "v3.0.1", "public", "coins.by-id"); // endpoint root exists
    const root = await discoverEndpointFixtures(VF, "coins.by-id");
    expect(root).toBeNull();
  });

  it("discovers defaults when default.response.json exists", async (): Promise<void> => {
    add("/root", "v3.0.1", "public", "simple.price"); // endpoint root
    add("/root", "v3.0.1", "public", "simple.price", "defaults", "default.response.json");
    const root = await discoverEndpointFixtures(VF, "simple.price");
    expect(root?.defaults.responsePath?.endsWith("default.response.json")).toBe(true);
  });

  it("discovers scenario pairs and error scenarios", async (): Promise<void> => {
    add("/root", "v3.0.1", "public", "coins.by-id"); // root dir
    add("/root", "v3.0.1", "public", "coins.by-id", "scenarios", "a.request.json");
    add("/root", "v3.0.1", "public", "coins.by-id", "scenarios", "a.response.json");
    add("/root", "v3.0.1", "public", "coins.by-id", "scenarios", "b.request.json");
    add("/root", "v3.0.1", "public", "coins.by-id", "scenarios", "b.error.response.json");
    add("/root", "v3.0.1", "public", "coins.by-id", "scenarios", "b.meta.json");

    const root = await discoverEndpointFixtures(VF, "coins.by-id");
    expect(root?.scenarios.length).toBe(2);

    const plans = await buildTestPlans(root as EndpointFixtureRoot);
    const scen = plans.filter((p): p is ScenarioTestPlan => p.kind === "scenario");
    expect(scen).toHaveLength(2);

    const a = scen.find((s) => s.name === "a")!;
    expect(a.responsePath?.endsWith("a.response.json")).toBe(true);
    expect(a.errorResponsePath).toBeNull();
    expect(a.meta.expect).toBe("pass");

    const b = scen.find((s) => s.name === "b")!;
    expect(b.errorResponsePath?.endsWith("b.error.response.json")).toBe(true);
    expect(b.meta.expect).toBe("fail");
  });
});
