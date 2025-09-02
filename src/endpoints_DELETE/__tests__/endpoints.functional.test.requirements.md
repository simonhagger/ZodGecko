# Endpoint Functional Test Requirements

## A. Test harness lifecycle (per endpoint)

- Iterate `ALL_ENDPOINTS` and for each:
  - Build a harness `H = makeEndpointHarness(ep)` that exposes:
    - `EP`, `req`, `res`
    - `requiredKeys: readonly string[]`, `hasRequired: boolean`
    - `defaults: Readonly<Record<string, unknown>>`
    - `defaultsStr: Readonly<Record<string, string>>` (normalized)
    - `q(input: Record<string, unknown>): Record<string, string>` (drops path keys, runs `buildQuery`)

  - Build fixtures accessor `Fx = makeSuiteFixtures(ep, import.meta.url)`:
    - `Fx.request(scenarioKey)` → request object from `<prefix>.requests.json`
    - `Fx.response(name)` → response object from fixtures

  - If required fixtures are missing, **skip** the affected leaf tests (not the suite).

## B. Sanity checks (pre-flight)

- Assert **harness integrity**:
  - `typeof H.req.parse === "function"` and `typeof H.res.parse === "function"`.
  - `H.requiredKeys` is an array; `H.defaultsStr` is a plain record of strings.

- Assert **schema and registry alignment**:
  - `req.safeParse({})` outcome implies `hasRequired` is true/false consistently.
  - If `hasRequired` is true, `requiredKeys.length > 0`.

## C. Request validation branch (inputs)

For each endpoint, the suite **attempts** the following scenarios if fixtures exist:

### C1. “defaults” scenario (well-formed)

- **Goal:** Prove that documented server defaults are dropped, but required/no-default keys are kept.
- Steps:
  1. Load `input = Fx.request("defaults")`.
     Assert `() => H.req.parse(input)` **does not throw**.
  2. Compute expectation:
     - Required non-path keys (no default) **must appear** in query.
     - Keys equal (post-normalization) to `H.defaultsStr` **must not** appear.

  3. Assert:
     - `H.q(input)` equals the expected map.
     - Path params (tokens like `{id}`) are **absent** in `H.q(input)`.

### C2. “non-defaults” scenario (well-formed)

- **Goal:** Only non-default keys survive; defaults are dropped.
- Steps:
  1. Load `defaultsInput = Fx.request("defaults")` and `nonDefaultsInput = Fx.request("non-defaults")`.
     Assert both parse successfully against `H.req`.
  2. Compute **diff keys**:
     - Normalize both; keep keys whose values **differ** (and any required/no-default keys).
     - **Exclude** all path params.

  3. Assert:
     - `H.q(nonDefaultsInput)` equals a map with exactly the diff keys.
     - The set of keys in the result equals the diff set (no extras).

### C3. “wrong-types” scenario (invalid)

- **Goal:** Bad types should be rejected by the request schema.
- Steps:
  1. Load `bad = Fx.request("wrong-types")` (if present).
  2. Assert `() => H.req.parse(bad)` **throws** with a Zod error.

### C4. “missing-required” scenario (conditionally invalid)

- **Goal:** If the endpoint has required keys, absence should fail; otherwise, skip.
- Steps:
  1. If `H.hasRequired` is **false**, **skip** this test.
  2. Else load `bad = Fx.request("missing-required")` (if present).
  3. Assert `() => H.req.parse(bad)` **throws** (helpful message optional).

## D. Path-param handling branch

- **Goal:** Ensure path params are always stripped prior to query building.
- Steps:
  1. On any available request scenario (prefer “defaults”), call `H.q(input)`.
  2. Extract token names from template and assert each is **not present** in the result map.
  3. If no path tokens exist for the endpoint, **skip** this test.

## E. Response validation branch

- **Goal:** Response schemas are tolerant to unknowns but validate documented structure.
- Steps (only if a response fixture exists):
  1. Load `Fx.response("<something>.json")` (endpoint-specific).
  2. Assert `() => H.res.parse(fixture)` **does not throw**.
  3. (Optional) Surround with a tiny local-type guard to assert the presence of key fields.

## F. Determinism & stability checks

- **Goal:** Query serialization is deterministic (sorted keys, CSV normalized).
- Steps:
  1. For any well-formed scenario: compute `a = H.q(input)`, then re-run to get `b = H.q(input)`.
  2. Assert deep equality `a === b`.
     (Optionally verify that CSV fields are sorted and deduped.)

## G. Error reporting & diagnostics

- All test failures must:
  - Include the **endpoint string** (`H.EP`) in the test title/message.
  - Print a compact diff of **actual vs expected** query map where relevant.
  - When a parse fails unexpectedly, print the **first Zod issue** (via `explainZodError` if available).

## H. Fixture policy

- Requests:
  - Single file per endpoint: `<prefix>.requests.json` keyed by:
    - `"defaults"`, `"non-defaults"`, `"wrong-types"`, `"missing-required"`.

  - Objects reflect the **request schema input shape** (may include path keys).

- Responses:
  - One or more example payloads under `./fixtures/<prefix>.*.response.json`.
  - Keep **minimal** size while representative.

- Missing fixture keys should **skip** the corresponding leaf test (not fail the whole suite).

## I. Helper API required (from `test-helpers.ts`)

- **Harness/config**
  - `makeEndpointHarness(ep)`
  - `makeEndpointPrefix(ep)`
  - `makeSuiteFixtures(ep, baseUrl)` → `{ request, response, load }`

- **Introspection/normalization**
  - `getRequiredKeysFromSchema(schema): readonly string[]`
  - `toStringDefaultsMap(defaults): Readonly<Record<string, string>>`
  - `pathParamKeys(template): string[]` (re-export from core)
  - `normalizeForExpectation(v): string | undefined`
  - `expectedQueryForKeys(input, keys, excludes?): Record<string,string>`
  - `diffNonDefaultKeys(defaultsStr, input, requiredKeys): string[]`

- **Assertions**
  - `expectNoDefaults(H, input)`
  - `expectNoDefaultsKeepOthers(H, input)`
  - `expectKeepsOnlyNonDefaults(H, defaultsInput, nonDefaultsInput, opts?)`
  - `expectMissingRequiredFails(H, badInput)`
  - `expectDropsPathParams(H, input)`

## J. Guard rails (meta)

- **Single-file suite** loops all endpoints.
- **Skip, don’t fail** when a scenario/fixture is absent.
- Each leaf test is **idempotent**, does not mutate shared state.
- Keep test names **consistent**:
  - `/<endpoint>: functional tests > <scenario description>`
