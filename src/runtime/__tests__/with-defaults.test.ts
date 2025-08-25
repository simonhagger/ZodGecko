import { describe, it, expect } from "vitest";

import { withDefaults } from "../../runtime/with-defaults.js";

describe("runtime/withDefaults", () => {
  it("fills missing values from server defaults without overriding provided keys", () => {
    const filled = withDefaults("/coins/list", {}); // defaults: include_platform: false
    expect(filled).toMatchObject({ include_platform: false });

    const keepProvided = withDefaults("/coins/markets", { page: 3 });
    expect(keepProvided).toMatchObject({ page: 3 });
  });
});
