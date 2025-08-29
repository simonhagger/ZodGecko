import { describe, it, expect } from "vitest";

// import { formatPath } from "../url.js";
// If core/url.ts also exposes joining helpers, import them too:
import { joinBaseAndPath } from "../url.js";

describe("core/url (compat)", () => {
  it("joinBaseAndPath normalizes slashes", () => {
    expect(joinBaseAndPath("https://api.coingecko.com/api/v3/", "/ping")).toBe(
      "https://api.coingecko.com/api/v3/ping",
    );
    expect(joinBaseAndPath("https://api.coingecko.com/api/v3", "ping")).toBe(
      "https://api.coingecko.com/api/v3/ping",
    );
  });
});
