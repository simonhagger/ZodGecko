> SNAPSHOT — 2025-08-30 (Europe/London)
> Simplification sprint baseline: formatParams, version/plan registry, opt-in fetch client, per-endpoint fixtures layout, dot+by- slugs.

# ZodGecko — Functional Design

A compact, practical design that satisfies the User Stories and Functional Requirements (FR). The companion documents live in `docs/` and provide traceability.

---

## 1) Purpose & Scope

- Provide a minimal, intuitive API to build CoinGecko requests and validate responses.
- Keep one source of truth for endpoints, server defaults, and path/query metadata (FR-1).
- Favor composition over inheritance, deterministic behavior, and strong typing.

---

## 2) Architecture Overview

Layers (top -> bottom):

1. Public API (`src/index.ts`) — stable surface: helpers and types only.
2. Helpers (`src/helpers/*`) — pure, deterministic functions (path, params, URL, parse, error explain, DX helpers).
3. Registry (`src/registry/*`) — endpoint catalog: maps endpoint IDs -> schemas + server defaults + param metadata + version/plan.
4. Schemas (`src/schemas/*`) — request/response validators and transforms.
5. Utilities (`src/utils/*`) — CSV, sort, URL join, encoding. No app logic.
6. Optional Fetch Client (`src/fetch/*`) — tiny, tree-shakeable client & header helper; exported via separate entry point.

Principles

- Public API never imports utilities directly; it imports helpers only.
- Helpers read from the registry; they never mutate it.
- Schemas are opaque to consumers. We export types derived from them, not Zod itself.
- **Schemas are referenced via the registry, not filesystem conventions.** The registry binds to concrete `requestSchema`/`responseSchema` modules regardless of their filenames/paths; the legacy schema layout is preserved for this sprint.
- **Runtime code MUST NOT import from `src/testkit/**`.** Shared fundamentals (e.g., `VersionPlanPair`, `RequestShape`) live in `/types/api.ts`, and `testkit` depends on those.
- No global state; all functions are pure (deterministic) and accept explicit inputs.

---

## 3) Folder & File Layout

```
/zodgecko
  /docs
    user-stories.md
    functional-requirements.md
    functional-design.md

  /src
    index.ts              <- public re-exports only (stable surface)

    /helpers              <- pure, deterministic helpers (public)
      format-path.ts
      format-params.ts
      to-url.ts
      parse-request.ts
      parse-response.ts
      get-request-for.ts
      explain-error.ts

    /fetch
      index.ts            <- createClient(), buildHeaders(), url(), get()

    /registry
      index.ts            <- in-code catalog (uses validFor: "v3.0.1/public" | "v3.1.1/paid")
      types.ts            <- RegistryEndpoint, QueryRule, HttpMethod, Schema<T>
      define.ts           <- defineEndpoint() derives serverDefaults from rules

    /schemas              <- keep existing modules; no enforced naming this sprint
      ...                 <- legacy layout preserved (arbitrary nesting/file names)

    /types
      api.ts              <- EndpointId, VersionPlanPair, ApiVersion, Plan, QueryPrimitive, RequestShape,
                             VersionedEndpoint, RequestInputFor<E>, RequestOutputFor<E>, ResponseFor<E>, DefaultsFor<E>

    /utils
      csv.ts              <- array <-> CSV normalization
      sort.ts             <- stable lexicographic sorting
      url.ts              <- join, encode, ensure-leading-slash

    /testkit              <- INTERNAL: test harness only (not exported)
      discover.ts         <- locate fixtures, build test plans
      run.ts              <- execute default/scenario plans
      fs.ts               <- thin fs helpers (mockable)
      slug.ts             <- slug utilities for tests
      types.ts            <- Test plan types only (DefaultTestPlan, ScenarioTestPlan, EndpointFixtureRoot);
                             reuses VersionPlanPair & RequestShape from /types/api.ts
      default-request.ts  <- synthesize default request when needed

  /endpoints/__tests__/fixtures
    /<version>/<plan>/<endpoint>/
      /defaults/
        default.request.json   (optional when path params required)
        default.response.json  (docs lift-and-drop, minimized)
      /scenarios/
        <scenario>.request.json
        <scenario>.response.json
        <scenario>.error.response.json (optional) or <scenario>.meta.json
```

**Valid versions & plans (folder names):**

- Versions: `v3.0.1` (public endpoints), `v3.1.1` (paid endpoints).
- Plans: `public`, `paid`.
- Mapping enforced by types: `v3.0.1 → public`, `v3.1.1 → paid`.

**Examples:**

- `endpoints/__tests__/fixtures/v3.0.1/public/coins.by-id/defaults/default.response.json`
- `endpoints/__tests__/fixtures/v3.1.1/paid/market.data/scenarios/deep.response.json`

Note: The endpoint folder `<endpoint>` uses the dot + `by-<param>` slug convention described in the Fixtures README. Version and plan are carried by the folder path.

**Schema layout compatibility (sprint scope).** We will **preserve the existing schema files and folders** from the current codebase. The registry binds to concrete `requestSchema`/`responseSchema` references regardless of filename or path. No renames or moves are required for this sprint. A later “Schema Simplification” task can propose standardized names if desired.

---

## 4) Naming Conventions

- Files: kebab-case. Endpoint descriptors mirror path tokens.
- Symbols: functions camelCase; types PascalCase with Input/Output suffixes.
- Exports: named exports only; no default exports.
- Endpoint IDs: dot + `by-<param>` slugs (e.g., `coins.by-id.history`); version/plan handled by the registry.

---

## 5) Public API Surface (stable)

Exported from `src/index.ts` only:

- `getSchemas(endpoint)`
- `getRequestFor(endpoint, opts?)`
- `parseRequest(endpoint, input)`, `parseResponse(endpoint, json)`
- `formatPath(template, params)`
- `formatParams(params)` (core)
- `formatParamsForEndpoint(endpoint, params)` (registry-aware)
- `toURL(base, path, params)`
- `explainError(err)`

Exported from `zodgecko/fetch`:

- `createClient(options?)`
- `buildHeaders(extra?)`
- `url(endpoint, params)`
- `get(endpoint, params)`

---

## 6) Separation of Concerns & Composition

- Registry: pure data (id, template, partitions, defaults, version, plan, schema refs).
- Helpers: path/params formatting, parse helpers, DX discoverability, error explainer.
- Optional Fetch Client: header assembly, url convenience, GET + validate.
- Utilities: primitive helpers; never depend upward.

---

## 7) Shared Types & DRY

- `ApiVersion`, `Plan`, `VersionPlanPair`, `EndpointId`, `VersionedEndpoint`.
- `QueryPrimitive`, `RequestShape`, `RequestInputFor<E>`, `RequestOutputFor<E>`, `ResponseFor<E>`, `DefaultsFor<E>`.
- `SchemaRef`.

**Location.** All shared fundamentals live in `/types/api.ts`. `testkit` imports these and defines **only** test-planning types.

Policies: derive types from schemas; declare defaults once; centralize CSV rules.

### 7.1 Promoting shared types out of `testkit`

- Move foundational types currently in `src/testkit/types.ts` (`VersionPlanPair`, `QueryPrimitive`, `RequestShape`) to `/types/api.ts`.
- Update imports across helpers/registry/testkit to reference `/types/api.ts`.
- Keep `src/testkit/types.ts` for **test-only** plan types (`DefaultTestPlan`, `ScenarioTestPlan`, `EndpointFixtureRoot`), reusing shared types from `/types/api.ts`.
- Add lint rule/CI check prohibiting runtime imports from `src/testkit/**`.

---

## 8) Determinism & Error Handling

- Deterministic params and URLs; sorted keys; stable CSV.
- `explainError` is concise and path-aware.
- No global config; behavior is explicit per call.

---

## 9) Endpoint Test Runner Design

_Implementation lives under `src/testkit/_` and is **internal only** (not part of the public API).\*
Discovery

1. For each version/plan and endpoint in the registry, set `base = endpoints/__tests__/fixtures/<version>/<plan>/<endpoint>/`.
2. Defaults
   - If `defaults/default.response.json` exists:
     - Use `defaults/default.request.json` if present.
     - Else if endpoint has no required path params, auto-generate the request from the registry (server defaults + empty query).
     - Else skip default test for this endpoint (log a skip reason).

3. Scenarios
   - For each `*.request.json` in `scenarios/`:
     - Let `name = <scenario>` (basename).
     - Pair with `scenarios/<name>.response.json` (or `<name>.error.response.json`).
     - Optionally read `scenarios/<name>.meta.json` to set `{ "expect": "fail" | "pass" }`.

Execution

- Build URLs via `formatPath` + `formatParams`.
- Validate requests with `parseRequest`, responses with `parseResponse`.
- Canonicalize comparisons (structure-based, not raw string).
- Emit concise error via `explainError`.

Determinism

- Normalize arrays to CSV, drop blanks, sort keys.
- Stable path and params -> stable URL.

---

## 10) Testing Strategy & Quality Gates

- Unit tests for helpers; 100% coverage for helpers.
- Endpoint fixtures per layout above; auto discovery; no manual wiring.
- Stubbed fetch client tests for header assembly, URL formation, validation, rate-limit metadata.
- CI: strict typecheck, lint, unit/integration tests, bundle size budget.

---

## 11) Package Exports & Versioning

- Exports: root helpers and `./fetch` client.
- SemVer: minors add endpoints; patches fix; majors break.

---

## 12) Pseudo-Flow (non-code)

```
req  := parseRequest(endpoint, input)
path := formatPath(template, req.path)
prms := formatParams(endpoint, req.query)
url  := toURL(base, path, prms)
res  := parseResponse(endpoint, json)
seed := getRequestFor(endpoint)
msg  := explainError(error)
{ url, get, buildHeaders } := createClient({ plan: "paid", apiKey: X })
```

---

## 13) DoD (selected)

- Public API matches Section 5; no extra exports.
- Registry entries include defaults, version, plan.
- `formatParams` (core + registry-aware) implemented.
- Test runner follows Section 9; fixtures layout matches Section 3.
- **No runtime imports from `src/testkit/**`; shared types live in `/types/api.ts`.\*\*
- Docs updated accordingly.

---

## 14) Internal Testkit (non-public)

**Purpose.** Provide a lightweight harness to drive TDD with file-based fixtures for each endpoint/version/plan, without leaking into the runtime or public API.

**Scope.**

- **Fixture discovery**: walks `endpoints/__tests__/fixtures/<version>/<plan>/<endpoint>/{defaults,scenarios}` and enforces `validFor` mapping (`v3.0.1→public`, `v3.1.1→paid`).
- **Slug rules**: endpoint folders use dot + `by-<param>` (e.g., `coins.by-id.history`).
- **Default request synthesis**: builds minimal default request shapes when `defaults/default.request.json` is absent and no required path params are needed.
- **Runner**: defines tests synchronously (Vitest); scenarios are **invisible** if none exist.
- **Determinism**: stable iteration order; normalized CSV, sorted keys, and stable URLs.
- **Separation**: `testkit` imports public helpers/registry; **runtime code never imports `testkit`**.

**Conventions.**

- Keep `scenarios/` present per endpoint for consistency; empty folders are allowed and skipped.
- File names mirror API routes and CoinGecko-documented param names.

**Build/Publish.**

- Exclude `src/testkit/**` and `**/__tests__/**` from build output and package publishing.
- If a utility becomes broadly useful (e.g., slug helpers), migrate it to `src/helpers/` and have `testkit` depend on it (not vice versa).
