> SNAPSHOT — 2025-08-30 (Europe/London) Fixtures layout and dot+by- slugging rules — baseline for Simplification sprint.

# Endpoints Fixtures — README

This README explains the layout and **naming rules** for endpoint test fixtures. It complements the Functional Requirements (FR-12) and Functional Design (Section 9) and is the canonical reference for contributors.

---

## Folder Layout (canonical)

```
endpoints/__tests__/fixtures/
  <version>/<plan>/<endpoint>/
    defaults/
      default.request.json      # optional when endpoint requires path params
      default.response.json     # docs lift-and-drop (trimmed)
    scenarios/
      <scenario>.request.json
      <scenario>.response.json
      <scenario>.error.response.json   # optional, for expected-FAIL cases
      <scenario>.meta.json             # optional, e.g. { "expect": "fail" | "pass" }
```

- `<version>`: API version, e.g., `v3`, `v4`.
- `<plan>`: `free` or `pro`.
- `<endpoint>`: **unversioned endpoint path slug** using **dot-separated segments** and `by-<param>` markers for **path parameters**, mirroring the **exact parameter names from CoinGecko docs**.
- `<scenario>`: a short kebab-case label, e.g., `eth-with-many-tickers`.

---

## Endpoint Slugging (dot + by-)

We use **dot-separated segments** and a `by-<param>` prefix to denote path parameters. Parameter names **must match CoinGecko docs** (e.g., `{coin_id}`, `{contract_address}`, `{id}`).

**Algorithm**

1. Start from the **unversioned** endpoint path, e.g., `/coins/{id}/contract/{contract_address}/market_chart/range`.
2. Replace `/` with `.` between segments.
3. Replace path params `{name}` with `by-<name>`.
4. Preserve literal segment spelling from the API (underscores like `market_chart`, `public_treasury` remain).

**Examples**

- `coins.by-id.contract.by-contract_address.market_chart.range` ← `/coins/{id}/contract/{contract_address}/market_chart/range`
- `coins.categories.list` ← `/coins/categories/list`
- `coins.by-id.history` ← `/coins/{id}/history`
- `companies.public_treasury.by-coin_id` ← `/companies/public_treasury/{coin_id}`

> When referencing specific files, simply append `.request.json` or `.response.json` as appropriate.

---

## Defaults Suite

- Purpose: lock in **happy-path** behavior using **server defaults** only.
- Runner behavior:
  1. If `defaults/default.response.json` exists, attempt a default test.
  2. If the endpoint has **no required path params**, the request is **auto-generated** from the registry (server defaults + empty query).
  3. If the endpoint **does** require path params, provide `defaults/default.request.json` with the **minimal** path/query values.
  4. If no `default.request.json` exists for an endpoint requiring path params, the default test is **skipped** (with a reason).

- **Response fixture** should be a **lift-and-drop** from CoinGecko docs, trimmed to a minimal structure that proves the schema.

---

## Scenarios Suite

- Purpose: capture **richer** or **edge-case** behaviors.
- For each scenario, add a request/response pair:
  - `scenarios/<scenario>.request.json`
  - `scenarios/<scenario>.response.json`

- Expected **validation failures** may be expressed as either:
  - `scenarios/<scenario>.error.response.json`, or
  - `scenarios/<scenario>.meta.json` with `{ "expect": "fail" }`.

- Scenarios are **optional**; add them where they add clarity (deeply nested structures, coercions, mixed types, etc.).

---

## Content Guidelines

- **Smallest useful payloads**: keep fixtures minimal but representative.
- **Determinism**: requests should serialize deterministically via `formatPath` + `formatParams`.
- **Encoding**: arrays become CSV, booleans are `"true"/"false"`, drop empty values.
- **No secrets**: never include real API keys or private data.

---

## Contributor Quickstart

1. Identify version/plan/endpoint and create the folder if it doesn’t exist (use the slug rules above).
2. For defaults:
   - If path params are required, add `defaults/default.request.json`.
   - Always add `defaults/default.response.json` (trimmed docs example).

3. For scenarios: add pairs under `scenarios/` using the naming rules above.
4. Run tests; the runner auto-discovers your fixtures and executes them.

---

## FAQ

- **Do I need a default.request.json for every endpoint?**
  No. Only when the endpoint requires path params.

- **How do I express that a scenario should fail validation?**
  Use `<scenario>.error.response.json` or a `<scenario>.meta.json` with `{ "expect": "fail" }`.

- **Where do I put very large examples?**
  Avoid giant payloads. Trim to the minimal set that exercises the schema edge you need.

---

## Rationale

This per-endpoint, per-version/plan layout avoids cross-endpoint filename scanning and keeps fixtures **local** to the endpoint being tested. The **dot + by-** slugging rule matches API routes and makes path parameters unambiguous for maintainers and contributors.
