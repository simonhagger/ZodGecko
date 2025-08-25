import { describe, it, expect } from "vitest";

import { getServerDefaults } from "../server-defaults.js";

describe("runtime/getServerDefaults", () => {
  it("returns server defaults for a given path", () => {
    const filled = getServerDefaults("/coins/list"); // defaults: include_platform: false
    expect(filled).toMatchObject({ include_platform: false });
  });
  it("returns an empty object from server defaults for an unknown path", () => {
    const filled = getServerDefaults("/dummy"); // not known
    expect(filled).toMatchObject({});
  });
});
