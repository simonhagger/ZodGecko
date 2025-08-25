/**
 * @file Runtime: formatPath() – path templating & encoding (typed to Endpoint)
 */

import { describe, it, expect } from "vitest";

import { formatPath, type Endpoint, type PathParams } from "../../index.js";

describe("runtime/formatPath", () => {
  it("replaces a single param and URL-encodes the value", () => {
    const t: Endpoint = "/coins/{id}";
    type P = PathParams<typeof t>;
    const p: P = { id: "a coin/with spaces" };

    expect(formatPath(t, p)).toBe("/coins/a%20coin%2Fwith%20spaces");
  });

  it("replaces multiple different params (indexes composite id)", () => {
    const t: Endpoint = "/coins/{id}/contract/{contract_address}";
    type P = PathParams<typeof t>;
    const p: P = { contract_address: "0x123", id: "SPX" };

    expect(formatPath(t, p)).toBe("/coins/SPX/contract/0x123");
  });

  it("works with other by-id templates", () => {
    const t: Endpoint = "/derivatives/exchanges/{id}";
    type P = PathParams<typeof t>;
    const p: P = { id: "binance_futures" };

    expect(formatPath(t, p)).toBe("/derivatives/exchanges/binance_futures");
  });

  it("is a no-op when the template has no placeholders", () => {
    const t: Endpoint = "/ping";
    // PathParams<"/ping"> is {}, so cast a compatible empty object
    const p = {} as PathParams<typeof t>;

    expect(formatPath(t, p)).toBe("/ping");
  });
});
