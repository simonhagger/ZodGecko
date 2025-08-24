# Asset Platforms – Functional Testing

Covers `GET /asset_platforms`.

## Files (tests & fixtures)

```
src/endpoints/__tests__/asset-platforms/
├─ docs/
│  └─ asset-platforms.functional.testing.md   ← this file
├─ fixtures/
│  └─ asset-platforms.list.response.json      ← small list payload
├─ asset-platforms.requests.test.ts           ← request shape & serialization
├─ asset-platforms.responses.test.ts          ← response parsing & tolerance
└─ asset-platforms.sanity.functional.test.ts  ← route-level sanity
```

- The list fixture lives under `fixtures/` and contains a tiny, realistic sample (id, chain_identifier, names). Keep it small and immutable; don’t mutate fixtures in tests.
- The request/response tests and sanity test already exist and follow the shared helpers style.

## What this endpoint must do

- **No query params.** Requests serialize to `{}`; unknown keys are rejected (strict schema).
- **No server defaults.** `{}` stays `{}` via `buildQuery`, so any future defaults will surface in tests.
- **Tolerant responses.** Rows parse even if the API adds fields. Essentials:
  `id: string`, `chain_identifier: number | null | undefined`, `name: string | null | undefined`, `shortname: string | null | undefined`.

## Test intentions

- **Requests (`asset-platforms.requests.test.ts`)**
  - `{} → {}` round-trip: an empty request parses and serializes to `{}`.
  - Strictness: unknown keys (e.g. `{ foo: "bar" }`) are rejected.

- **Functional (`asset-platforms.sanity.functional.test.ts`)**
  - Guardrails: the route has **no server defaults** and serializes `{}` → `{}` via `buildQuery`, ensuring future default additions won’t slip in unnoticed.

- **Responses (`asset-platforms.responses.test.ts`)**
  - Fixture parses to an array; first row has required/optional fields in expected shapes.
  - Tolerance: an inline payload with an extra field proves unknowns are preserved (without unsafe property access).

## Notes for maintainers

- Keep the fixture minimal and realistic; add a second row only if it clarifies edge behavior.
- If the upstream API adds params to `/asset_platforms`, introduce them in the request schema and update the **requests** + **sanity** tests accordingly. The sanity test will catch unexpected defaults.
