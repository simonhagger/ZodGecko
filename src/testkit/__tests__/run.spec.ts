// src/testkit/__tests__/run.spec.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as explain from "../../helpers/explain-error.js";
import * as fmtParams from "../../helpers/format-params.js";
import * as fmtPath from "../../helpers/format-path.js";
import * as parseReq from "../../helpers/parse-request.js";
import * as parseResp from "../../helpers/parse-response.js";
import * as urlApi from "../../helpers/to-url.js";
import type { RequestShape, VersionPlanPair } from "../../types.js";
import * as defaultReq from "../default-request.js";
import * as fsApi from "../fs.js";
import { runDefaultTest, runScenarioTest } from "../run.js";
import type { DefaultTestPlan, ScenarioTestPlan } from "../types.js";

// Hoisted mock: ensure synthesizeDefaultRequest returns null by default
vi.mock("../default-request.js", () => ({
  synthesizeDefaultRequest: vi.fn(() => null),
}));

const VF: VersionPlanPair = { version: "v3.0.1", plan: "public" };

// Local, typed helpers exposed via closures
let seedJson: (data: Record<string, unknown>) => void;
let throwNext: (b: boolean) => void;

beforeEach((): void => {
  // fs.readJSON -> in-memory map
  const store = new Map<string, unknown>();
  vi.spyOn(fsApi, "readJSON").mockImplementation(<T>(p: string): Promise<T> => {
    if (!store.has(p)) return Promise.reject(new Error(`missing json: ${p}`));
    return Promise.resolve(store.get(p) as T);
  });
  seedJson = (data: Record<string, unknown>): void => {
    store.clear();
    for (const [k, v] of Object.entries(data)) store.set(k, v);
  };

  // request/response pipeline
  vi.spyOn(parseReq, "parseRequest").mockImplementation(
    (_e: string, input: RequestShape): RequestShape => ({
      // pathTemplate: "{id}/info",
      path: input.path ?? {},
      query: input.query ?? {},
    }),
  );
  vi.spyOn(fmtPath, "formatPath").mockReturnValue("coins/bitcoin");
  // Type-safe: just return a value, let TS infer the signature
  vi.spyOn(fmtParams, "formatParamsForEndpoint").mockReturnValue({ a: "1" });
  // Accept optional query param
  vi.spyOn(urlApi, "toURL").mockImplementation(
    (base: string, p: string, q?: Readonly<Record<string, string>>): string => {
      const qs = new URLSearchParams(q ?? {}).toString();
      return `${base}/${p}${qs ? `?${qs}` : ""}`;
    },
  );

  let shouldThrow = false;
  vi.spyOn(parseResp, "parseResponse").mockImplementation((): unknown => {
    if (shouldThrow) throw new Error("boom");
    return {};
  });
  throwNext = (b: boolean): void => {
    shouldThrow = b;
  };

  vi.spyOn(explain, "explainError").mockImplementation((e: unknown): string =>
    e instanceof Error ? e.message : String(e),
  );
});

afterEach((): void => {
  vi.restoreAllMocks();
});

describe("runDefaultTest", () => {
  it("skips when default request cannot be synthesized", async (): Promise<void> => {
    const plan: DefaultTestPlan = {
      kind: "default",
      validFor: VF,
      endpointSlug: "coins.by-id",
      rootDir: "/root",
      requestPath: null,
      responsePath: "/root/resp.json",
    };
    seedJson({ "/root/resp.json": {} });
    const out = await runDefaultTest(plan);
    expect(out.status).toBe("skipped");
  });

  it("passes when parsing succeeds", async (): Promise<void> => {
    const plan: DefaultTestPlan = {
      kind: "default",
      validFor: VF,
      endpointSlug: "coins.by-id",
      rootDir: "/root",
      requestPath: "/root/req.json",
      responsePath: "/root/resp.json",
    };
    seedJson({
      "/root/req.json": { path: { id: "bitcoin" } },
      "/root/resp.json": {},
    });
    const out = await runDefaultTest(plan);
    expect(out.status).toBe("pass");
  });

  it("fails when response validation throws", async (): Promise<void> => {
    const plan: DefaultTestPlan = {
      kind: "default",
      validFor: VF,
      endpointSlug: "coins.by-id",
      rootDir: "/root",
      requestPath: "/root/req.json",
      responsePath: "/root/resp.json",
    };
    seedJson({
      "/root/req.json": { path: { id: "bitcoin" } },
      "/root/resp.json": {},
    });
    throwNext(true);
    const out = await runDefaultTest(plan);
    expect(out.status).toBe("fail");
    expect("message" in out && out.message).toBe("boom");
  });
});

describe("runScenarioTest", () => {
  it("passes scenario with expected fail when validator throws", async (): Promise<void> => {
    const plan: ScenarioTestPlan = {
      kind: "scenario",
      validFor: VF,
      endpointSlug: "coins.by-id",
      rootDir: "/root",
      name: "bad",
      requestPath: "/root/bad.request.json",
      responsePath: null,
      errorResponsePath: "/root/bad.error.response.json",
      meta: { expect: "fail" },
    };
    seedJson({
      "/root/bad.request.json": { path: { id: "bitcoin" } },
      "/root/bad.error.response.json": {},
    });
    throwNext(true);
    const out = await runScenarioTest(plan);
    expect(out.status).toBe("pass");
  });

  it("fails scenario when expected pass but validator throws", async (): Promise<void> => {
    const plan: ScenarioTestPlan = {
      kind: "scenario",
      validFor: VF,
      endpointSlug: "coins.by-id",
      rootDir: "/root",
      name: "good",
      requestPath: "/root/good.request.json",
      responsePath: "/root/good.response.json",
      errorResponsePath: null,
      meta: { expect: "pass" },
    };
    seedJson({
      "/root/good.request.json": { path: { id: "bitcoin" } },
      "/root/good.response.json": {},
    });
    throwNext(true);
    const out = await runScenarioTest(plan);
    expect(out.status).toBe("fail");
    expect("message" in out && out.message).toBe("boom");
  });
});

beforeEach((): void => {
  // minimal pipeline stubs; we don't exercise URL/params here
  vi.spyOn(parseReq, "parseRequest").mockImplementation(
    (_e: string, input: RequestShape): RequestShape => ({
      // pathTemplate: "{id}/info",
      path: input.path ?? {},
      query: input.query ?? {},
    }),
  );
  vi.spyOn(explain, "explainError").mockImplementation((e: unknown): string =>
    e instanceof Error ? e.message : String(e),
  );
});

describe("run.ts extra branches", () => {
  it("default test: fails when response JSON cannot be read/parsed", async (): Promise<void> => {
    // ensure we don't hit 'skipped'
    vi.spyOn(defaultReq, "synthesizeDefaultRequest").mockReturnValue({ path: { id: "bitcoin" } });

    // force read error
    vi.spyOn(fsApi, "readJSON").mockRejectedValue(new Error("invalid json"));

    const plan = {
      kind: "default",
      validFor: { version: "v3.0.1", plan: "public" },
      endpointSlug: "coins.by-id",
      rootDir: "/root",
      requestPath: "/root/default.request.json",
      responsePath: "/root/default.response.json",
    } as const;

    await expect(runDefaultTest(plan)).rejects.toThrow("invalid json");
    // (alternatively: `return expect(runDefaultTest(plan)).rejects.toThrow("invalid json");`)
  });

  it("scenario: fails when meta expects 'fail' but validator does not throw", async (): Promise<void> => {
    // parseResponse does NOT throw (success), but meta expects 'fail'
    vi.spyOn(parseResp, "parseResponse").mockReturnValue({});

    vi.spyOn(fsApi, "readJSON").mockResolvedValue({} as unknown);

    const plan: ScenarioTestPlan = {
      kind: "scenario",
      validFor: VF,
      endpointSlug: "coins.by-id",
      rootDir: "/root",
      name: "expected-fail-but-passed",
      requestPath: "/root/a.request.json",
      responsePath: null,
      errorResponsePath: "/root/a.error.response.json",
      meta: { expect: "fail" },
    };

    const out = await runScenarioTest(plan);
    expect(out.status).toBe("fail");
    // we don't assert a specific message to remain implementation-agnostic
  });

  it("passes scenario when expected pass and validator does not throw", async (): Promise<void> => {
    const plan: ScenarioTestPlan = {
      kind: "scenario",
      validFor: { version: "v3.0.1", plan: "public" },
      endpointSlug: "coins.by-id",
      rootDir: "/root",
      name: "happy",
      requestPath: "/root/happy.request.json",
      responsePath: "/root/happy.response.json",
      errorResponsePath: null,
      meta: { expect: "pass" },
    };

    // Seed readJSON for request/response
    const store = new Map<string, unknown>([
      ["/root/happy.request.json", { path: { id: "bitcoin" } }],
      ["/root/happy.response.json", {}],
    ]);
    vi.spyOn(fsApi, "readJSON").mockImplementation(<T>(p: string): Promise<T> => {
      const v = store.get(p);
      if (!v) return Promise.reject(new Error(`missing ${p}`));
      return Promise.resolve(v as T);
    });

    // Ensure validator does not throw (most of your beforeEach already sets this)
    vi.spyOn(parseResp, "parseResponse").mockReturnValue({});

    const out = await runScenarioTest(plan);
    expect(out.status).toBe("pass");
  });
});
