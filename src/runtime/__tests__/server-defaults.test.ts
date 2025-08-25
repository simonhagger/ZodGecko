import { describe, it, expect } from "vitest";

import { getServerDefaults } from "../server-defaults.js";

describe("runtime/getServerDefaults", () => {
  it("returns server defaults for a given path", () => {
    const filled = getServerDefaults("/coins/list"); // defaults: include_platform: false
    expect(filled).toMatchObject({ include_platform: false });
  });
});
