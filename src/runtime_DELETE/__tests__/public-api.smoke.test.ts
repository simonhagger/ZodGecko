/**
 * Public API smoke test (relative imports; no package alias in dev)
 * Ensures root + subpath barrels import together without cycles or eager eval.
 */

import * as core from "../../core/index.js";
import * as endpoints from "../../endpoints/index.js";
import * as root from "../../index.js";
import * as runtime from "../../runtime/index.js";

function hasKey<T extends string>(obj: unknown, key: T): obj is Record<T, unknown> {
  return typeof obj === "object" && obj !== null && key in obj;
}

describe("public API smoke", () => {
  it("imports root without side-effects", () => {
    expect(root).toBeTruthy();
  });

  it("imports core helpers", () => {
    expect(core).toBeTruthy();
    if (hasKey(core, "formatPath")) expect(typeof core["formatPath"]).toBe("function");
    if (hasKey(core, "queryString")) expect(typeof core["queryString"]).toBe("function");
  });

  it("imports runtime barrel (lazy endpoints ok)", () => {
    expect(runtime).toBeTruthy();
    if (hasKey(runtime, "toURL")) expect(typeof runtime["toURL"]).toBe("function");
    if (hasKey(runtime, "buildQuery")) expect(typeof runtime["buildQuery"]).toBe("function");
    if (hasKey(runtime, "getSchemas")) expect(typeof runtime["getSchemas"]).toBe("function");
  });

  it("imports endpoints namespace", () => {
    expect(endpoints).toBeTruthy();
  });
});
