// src/endpoints/__tests__/endpoints.functional.test.ts
import { describe, it, expect } from "vitest";

import {
  EndpointHarness,
  makeSuiteFixtures,
  Scenarios,
  expectDropsPathParams,
  //   expectNoDefaults,
  //   expectNoDefaultsKeepOthers,
  expectKeepsOnlyNonDefaults,
  expectMissingRequiredFails,
  expectDropsDefaultsButKeepsRequired,
} from "./_utils/index.js";
import { ALL_ENDPOINTS } from "../../runtime/index.js";

describe("endpoint functional suite (all endpoints)", () => {
  for (const EP of ALL_ENDPOINTS) {
    describe(EP, () => {
      const H = EndpointHarness.from(EP);
      const Fx = makeSuiteFixtures(H.EP, import.meta.url);
      console.log(`Testing endpoint: ${EP} - file prefix: ${H.prefix()}`);

      it("parses default request (if present) and drops server defaults", async () => {
        const defaults = await Fx.request(Scenarios.defaults);
        if (!defaults) {
          console.warn(`No Secenarios.defaults request found for ${EP}`);
          return;
        }

        expect(() => H.req.parse(defaults)).not.toThrow();

        // Use the smarter assertion that handles required/no-default keys (e.g., 'date')
        expectDropsDefaultsButKeepsRequired(H, defaults);
      });

      it("keeps only params that differ from defaults (if non-defaults present)", async () => {
        const nonDefaults = await Fx.request(Scenarios.nonDefaults);
        if (!nonDefaults) {
          console.warn(`No Scenarios.nonDefaults request found for ${EP}`);
          return;
        }
        expect(() => H.req.parse(nonDefaults)).not.toThrow();
        expectKeepsOnlyNonDefaults(H, nonDefaults, H.pathKeys);
      });

      it("fails when required fields are missing (if scenario present)", async () => {
        const bad = await Fx.request(Scenarios.missingRequired);
        if (!bad) {
          console.warn(`No Scenarios.missingRequired request found for ${EP}`);
          return;
        }
        expectMissingRequiredFails(H, bad);
      });

      it("drops path params from query (if defaults present)", async () => {
        const input = await Fx.request(Scenarios.defaults);
        if (!input) {
          console.warn(`No Scenarios.defaults request found for ${EP}`);
          return;
        }
        expectDropsPathParams(H, input);
      });

      it("parses example response (if present)", async () => {
        const resp = await Fx.response();
        if (!resp) {
          console.warn(`No example standard response found for ${EP}`);
          return;
        }
        expect(() => H.res.parse(resp)).not.toThrow();
      });
    });
  }
});
