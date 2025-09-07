> SNAPSHOT — 2025-08-30 (Europe/London) Functional Requirements baseline: formatParams (core + registry-aware), version/plan registry, opt-in fetch client, headers helper, per-endpoint fixtures layout, dot+by- endpoint slugs.

# ZodGecko — Functional Requirements

_A concise specification of functional requirements. Traceability to user stories will be provided in the functional design document._

---

## FR-1: Endpoint Registry

- The system **shall maintain a single registry** mapping endpoint paths → request/response schemas.
- The registry **shall be the source of truth** for supported endpoints, server defaults, and path/query metadata.
- The registry **shall be the single source of truth for server defaults**, ensuring consistent omission of defaults during params formatting and discoverable defaults in request helpers.
- The registry **shall support versioning and plan channels**, allowing entries to be tagged with an API **version** (e.g., `v3`, `v4`) and a **plan** (`free`, `pro`). Unversioned endpoint lookups resolve to a project default (e.g., `v3/free`).

## FR-2: Path Handling

- The system **shall provide a function** to format paths safely using required parameters.
- Missing or invalid parameters **shall cause an explicit error**.
- Encoded path segments **shall always be URL-safe**.

## FR-3: Params Formatting (Core)

- The system **shall provide a core function** `formatParams(params)` that **deterministically formats query parameters**:
  - Arrays → deduped, sorted CSV.
  - Booleans → `"true"` / `"false"`.
  - Numbers → finite only; drop `NaN`/`Infinity`.
  - Empty values (nullish/blank strings/empty arrays) → dropped.
  - Keys sorted lexicographically.

- The core formatter **shall not consult the registry** and is pure.

## FR-4: Params Formatting (Registry‑Aware)

- The system **shall provide a registry‑aware params formatter** `formatParams(endpoint, params)` that:
  - Drops keys whose values equal **server defaults** (from the registry).
  - Excludes any **path parameters** from the querystring.
  - Applies the same deterministic rules as the core formatter.

- Non‑CSV array encodings **shall be supported only if explicitly required by endpoint metadata**; otherwise CSV is the default.

## FR-5: URL Composition

- The system **shall provide a function** to combine base, path, and formatted params into a valid full URL.
- Double slashes **shall be avoided**.

## FR-6: Request Handling

- The system **shall provide a helper** (`parseRequest`) that validates and normalizes a request object against the request schema.
- The system **shall provide a helper** (`getRequestFor`) that produces a discoverable request object with defaults and optional fields visible.

## FR-7: Response Handling

- The system **shall provide a helper** (`parseResponse`) that validates and normalizes an API response against the response schema.
- Tolerant schemas **shall allow unknown fields** so upstream changes do not break consumers.

## FR-8: Error Explanation

- The system **shall provide a helper** (`explainError`) that converts any validation or runtime error into a concise, human‑readable message.

## FR-9: Type Inference

- All request and response schemas **shall be strongly typed** so that TypeScript users can infer types directly from them.

## FR-10: Minimal Fetch Integration (Separate Export)

- The system **shall provide an optional minimal fetch helper** exposed under a **separate entry point** (e.g., `zodgecko/fetch`) that:
  - Accepts an injected `fetch` implementation.
  - Builds the URL via `formatPath` + `formatParams`, performs the request, and validates the response.
  - Performs **no retries, caching, or hidden behavior**.

## FR-11: Header Helper for GET

- The system **shall provide a helper** to produce canonical headers for GET requests:
  - Always include `Accept: application/json`.
  - Optionally include a configurable API key header (default: `x-cg-pro-api-key`).
  - Allow user‑supplied headers to be merged deterministically.

## FR-12: Endpoint Testing Structure (Defaults & Scenarios)

- The testing suite **shall distinguish** between **default** and **scenario** fixtures to reduce maintenance and clarify intent.
- **Folder layout (canonical):**
  - `endpoints/__tests__/fixtures/<version>/<plan>/<endpoint>/defaults/`
  - `endpoints/__tests__/fixtures/<version>/<plan>/<endpoint>/scenarios/`

### FR-12a: Default (Server) Fixtures

- The suite **shall run happy‑path tests** using **server‑default requests** derived from the registry.
- For endpoints **without required path params**, the request is **auto‑generated** from the registry (server defaults + empty query).
- For endpoints **with required path params**, a manual default request may be provided:
  - `.../defaults/default.request.json` (optional; supplies minimal path/query values when required)

- The expected response is stored at:
  - `.../defaults/default.response.json` (a **lift‑and‑drop** of the CoinGecko docs example, trimmed to minimal structure)

- If no `default.request.json` exists for endpoints with required path params, the default test **is skipped** gracefully.

### FR-12b: Scenario Fixtures (Per‑Case)

- The suite **shall iterate** the endpoint’s `scenarios/` folder and execute each scenario pair.
- **File naming (simple and local to the endpoint):**
  - `.../scenarios/<scenario>.request.json`
  - `.../scenarios/<scenario>.response.json`

- **Failure scenarios** are supported via either:
  - `.../scenarios/<scenario>.error.response.json` (response expected to fail validation), **or**
  - `.../scenarios/<scenario>.meta.json` with `{ "expect": "fail" | "pass" }`.

- Scenarios **are optional**; include them only when deeper coverage is useful (e.g., nested structures, edge cases).

### FR-12c: Determinism & Canonicalization

- URL building in tests **shall use** `formatPath` + `formatParams` to guarantee deterministic strings.
- Fixture comparison **shall be structure‑based** (after normalization) rather than raw string matching.

### FR-12d: Zero Manual Wiring

- Adding a new scenario **shall require only** dropping a request and response JSON pair (plus optional meta) following the naming rules; the runner discovers and executes it automatically.

## Pseudo‑code Illustrations

**Path + Params → URL**

```
path  = formatPath("/coins/{id}", { id: "bitcoin" })
query = formatParams("/coins/{id}", { vs_currency: "usd" })
url   = toURL(BASE, path, query)
```

**Validate Response**

```
response = fetch(url)
validated = parseResponse("/coins/{id}", response.json)
```

**Explain Error**

```
try
  parseResponse(...)
catch err
  log(explainError(err))
```

---

## Endpoint Slugging (dot + by-)

This project uses **dot-separated segments** plus a `by-<param>` marker for each path parameter, mirroring CoinGecko's documented parameter names.

- Replace `/` with `.` between path segments.
- For `{param}` insert `by-<param>` using the **exact** name from the docs (e.g., `{coin_id}` -> `by-coin_id`, `{contract_address}` -> `by-contract_address`, `{id}` -> `by-id`).
- Preserve literal segment spelling (underscores allowed, e.g., `market_chart`, `public_treasury`).
- Remove duplicate dots if any.

**Examples**

- `coins.by-id.contract.by-contract_address.market_chart.range.response.json`
- `coins.categories.list.response.json`
- `coins.by-id.history.request.json`
- `companies.public_treasury.by-coin_id.response.json`
