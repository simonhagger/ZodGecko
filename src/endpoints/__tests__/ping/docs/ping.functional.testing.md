# Ping – Functional Testing

**Route (HTTP)**

- `GET /ping` — health probe

> Path params: none. Query params: none.

---

## Files (tests & fixtures)

```

src/endpoints/**tests**/ping/
├─ docs/
│  └─ ping.functional.testing.md                 ← this file
├─ fixtures/
│  └─ ping.response.json                         ← /ping payload
├─ ping.requests.test.ts                         ← request shape & serialization
├─ ping.responses.test.ts                        ← response parsing & tolerance
└─ ping.sanity.functional.test.ts                ← route-level sanity checks

```

- Keep the fixture **tiny** and immutable; don’t mutate fixtures in tests.

---

## What this route must do

- **No query params.** Requests serialize to `{}`; unknown keys are rejected (strict schema).
- **No server defaults.** `{}` stays `{}` via `buildQuery`.
- **Tolerant response.** A small **object** that includes `gecko_says: string`. Unknown keys (if any) are preserved.

---

## Test intentions

- **Requests (`ping.requests.test.ts`)**
  - `{}` parses and serializes to `{}`.
  - Unknown keys are rejected.

- **Functional (`ping.sanity.functional.test.ts`)**
  - Serializer baseline: `/ping` with `{}` → `{}` (catches accidental defaults/params).

- **Responses (`ping.responses.test.ts`)**
  - Fixture parses to an object.
  - Essentials: `gecko_says` is a non-empty string.
  - Tolerance: prove a harmless unknown key (if present in fixture) survives (safe guards, no unsafe property access).

---

## Fixtures

- **Location:** `src/endpoints/__tests__/ping/fixtures/ping.response.json`
- **Content:** minimal, e.g. `{ "gecko_says": "(V3) ..." }`; optionally include **one** unknown key to prove tolerance.
- **Never mutate fixtures** in tests; add a second tiny fixture or use an inline payload for variants.

---

## Maintainer notes

- If upstream ever adds request params (unlikely), model them in the schema and extend **requests + functional** tests.
- If the response shape changes (e.g., `gecko_says` renamed/nested), update schema + essentials; keep tolerance assertion unless the route becomes intentionally strict.
