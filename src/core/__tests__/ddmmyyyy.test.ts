/**
 * @file Core: ddmmyyyy() – invalid input branch
 */
import { describe, it, expect } from "vitest";

import { ddmmyyyy } from "../parse-utils.js";

describe("core/ddmmyyyy", () => {
  it("throws TypeError on unparseable input (string)", () => {
    expect(() => ddmmyyyy("not-a-date")).toThrowError(/ddmmyyyy: invalid date/);
  });

  it("throws TypeError on invalid Date instance", () => {
    const invalid = new Date("definitely not a date");
    expect(() => ddmmyyyy(invalid)).toThrowError(/ddmmyyyy: invalid date/);
  });
});
