// src/endpoints/__tests__/_utils/assertions.ts
import { expect } from "vitest";

import { diffNonDefaultKeys } from "./defaults.js";
import type { EndpointHarness } from "./harness.js";
import { expectedQueryForKeys } from "./normalize.js";

/** Drop defaults; keep required/no-default keys when present in input. */
export function expectDropsDefaultsButKeepsRequired(
  H: EndpointHarness,
  input: Record<string, unknown>,
): void {
  const actual = H.q(input);

  // 1) Defaults should be dropped (unless they’re also required-without-default, which they aren’t).
  for (const k of Object.keys(H.defaultsStr)) {
    // If a key has a documented server default, we should NOT see it in the output
    // when the input value equals the default (that’s exactly the “defaults” scenario).
    expect(actual).not.toHaveProperty(k);
  }

  // 2) Required keys that have NO default should be kept if present in input.
  // Example: /coins/{id}/history -> "date" is required, no default.
  for (const k of H.requiredKeys) {
    const hasServerDefault = Object.prototype.hasOwnProperty.call(H.defaultsStr, k);
    if (!hasServerDefault && Object.prototype.hasOwnProperty.call(input, k)) {
      expect(actual).toHaveProperty(k);
    }
  }
}

/** Drop defaults but keep required/no-defaults (e.g., date); path params excluded automatically. */
export function expectNoDefaultsKeepOthers(
  H: EndpointHarness,
  input: Record<string, unknown>,
): void {
  const exclude = new Set(H.pathKeys);
  const keys = diffNonDefaultKeys(H.defaultsStr, input, H.requiredKeys, exclude);
  const expected = expectedQueryForKeys(input, keys, exclude);
  expect(H.q(input)).toEqual(expected);
}

/** Keep only keys that differ from defaults; no unexpected extras. */
export function expectKeepsOnlyNonDefaults(
  H: EndpointHarness,
  nonDefaultsInput: Record<string, unknown>,
  excludes: ReadonlyArray<string> | ReadonlySet<string> = [],
): void {
  const excludeSet = excludes instanceof Set ? excludes : new Set(excludes);
  const keys = diffNonDefaultKeys(H.defaultsStr, nonDefaultsInput, H.requiredKeys, excludeSet);
  const expected = expectedQueryForKeys(nonDefaultsInput, keys, excludeSet);
  const actual = H.q(nonDefaultsInput);
  expect(actual).toEqual(expected);
  expect(Object.keys(actual).sort()).toEqual(keys.sort());
}

/** If endpoint has required fields, bad input should fail parsing. */
export function expectMissingRequiredFails(
  H: EndpointHarness,
  badInput: Record<string, unknown>,
): void {
  if (!H.hasRequired) return;
  expect(() => H.req.parse(badInput)).toThrow();
}

/** Path params must never leak into query. */
export function expectDropsPathParams(H: EndpointHarness, input: Record<string, unknown>): void {
  const actual = H.q(input);
  for (const t of H.pathKeys) {
    expect(actual).not.toHaveProperty(t);
  }
}

/** When input equals server defaults AND there is no required/no-default key, query should be {}. */
export function expectNoDefaults(H: EndpointHarness, input: Record<string, unknown>): void {
  // If the endpoint has a required key without a server default AND the input provides it,
  // a blank {} is NOT the correct expectation. Use the smarter assertion above.
  const hasReqNoDefault = H.requiredKeys.some(
    (k) => !Object.prototype.hasOwnProperty.call(H.defaultsStr, k),
  );
  const inputProvidesReq = H.requiredKeys.some((k) =>
    Object.prototype.hasOwnProperty.call(input, k),
  );

  if (hasReqNoDefault && inputProvidesReq) {
    // Provide a clearer failure if someone calls the wrong helper.
    throw new Error(
      `expectNoDefaults: endpoint ${H.EP} has required key(s) without defaults present in input; ` +
        `use expectDropsDefaultsButKeepsRequired instead.`,
    );
  }

  expect(H.q(input)).toEqual({});
}
