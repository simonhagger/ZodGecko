import { describe, it, expect } from "vitest";

import { dropId, dropParams } from "../../runtime/params.js";

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
