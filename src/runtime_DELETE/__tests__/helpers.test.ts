import { describe, it, expect } from "vitest";

import { dropId, dropParams } from "../../core/helpers.js";
import { withDefaults } from "../helpers.js";

describe("runtime/withDefaults", () => {
  it("fills missing values from server defaults without overriding provided keys", () => {
    const filled = withDefaults("/coins/list", {}); // defaults: include_platform: false
    expect(filled).toMatchObject({ include_platform: false });

    const keepProvided = withDefaults("/coins/markets", { page: 3 });
    expect(keepProvided).toMatchObject({ page: 3 });
  });
});
describe("runtime/params helpers", () => {
  it("dropId removes the id key only", () => {
    const q = dropId({ id: "bitcoin", page: 2, extra: true });
    expect(q).toEqual({ page: 2, extra: true });
  });

  it("dropParams removes an arbitrary list of keys", () => {
    const q = dropParams({ id: "eth", address: "0x0", vs_currency: "usd" }, [
      "id",
      "address",
    ] as const);
    expect(q).toEqual({ vs_currency: "usd" });
  });
});
