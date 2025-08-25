/**
 * @file Registry-driven smoke tests
 * @purpose Ensure every Endpoint resolves schemas and that
 *          minimal request/response payloads parse as expected.
 */

import { describe, it, expect } from "vitest";

import { REQ_FACTORY, RESP_FACTORY } from "../../endpoints/__tests__/_utils/endpoint-factories.js";
import { ALL_ENDPOINTS, getSchemas, type Endpoint } from "../../runtime/endpoints.js";
import { validateRequest, validateResponse } from "../../runtime/validate.js";

const hasPathParams = (ep: string) => /\{[^}]+\}/.test(ep);

describe("endpoint registry – smoke", () => {
  describe("schema resolution", () => {
    ALL_ENDPOINTS.forEach((ep) => {
      it(`${ep} resolves {req,res} schemas`, () => {
        const { req, res } = getSchemas(ep);
        expect(typeof req.parse).toBe("function");
        expect(typeof res.parse).toBe("function");
      });
    });
  });

  describe("requests – minimal valid payloads", () => {
    // Guard: ensure you didn't forget to add a factory for a new endpoint
    it("has a request factory for every endpoint", () => {
      const missing = ALL_ENDPOINTS.filter((ep) => !REQ_FACTORY[ep]);
      expect(missing).toEqual([]);
    });

    ALL_ENDPOINTS.forEach((ep) => {
      it(`${ep} minimal request parses (${hasPathParams(ep) ? "drop path params" : "no path params"})`, () => {
        const make = REQ_FACTORY[ep]!;
        const input = make();
        const vr = validateRequest(
          ep,
          input,
          hasPathParams(ep) ? { dropPathParams: true } : undefined,
        );
        if (!vr.ok) {
          // Throw with rich context so the failing endpoint is obvious in logs
          throw new Error(
            `[REQUEST INVALID] ${ep}\n` +
              `${vr.message}\n` +
              `input: ${JSON.stringify(input, null, 2)}\n`,
          );
        }
        expect(vr.ok).toBe(true);
      });
    });
  });

  describe("responses – tolerant minimal payloads (where provided)", () => {
    (Object.keys(RESP_FACTORY) as Endpoint[]).forEach((ep) => {
      it(`${ep} minimal tolerant response parses`, () => {
        const make = RESP_FACTORY[ep]!;
        const input = make();
        const vr = validateResponse(ep, input);
        if (!vr.ok) {
          throw new Error(
            `[RESPONSE INVALID] ${ep}\n` +
              `${vr.message}\n` +
              `input: ${JSON.stringify(input, null, 2)}\n`,
          );
        }
        expect(vr.ok).toBe(true);
      });
    });
  });
});
