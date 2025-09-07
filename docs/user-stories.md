> SNAPSHOT — 2025-08-30 (Europe/London)
> User Stories baseline: Maintainer persona + Maintainer/Contributor Stories, DX helpers (getRequestFor, explainError, parseRequest), and simplification scope.

# ZodGecko — User Stories

_A living document in `docs/` capturing the top‑down needs of real users. Guides what features exist, how they should feel, and what to avoid._

---

## Personas

- **App Developer (Frontend/Node)** — Wants to call CoinGecko endpoints with minimal boilerplate and type safety.
- **Data/ETL Engineer** — Pulls and validates large volumes of data; stability and validation are key.
- **Library/SDK Integrator** — Wraps ZodGecko in higher‑level tooling; needs a minimal, predictable surface.
- **QA/Test Engineer** — Needs deterministic outputs for snapshot tests and fixtures.
- **TypeScript Enthusiast** — Expects type inference to come directly from schemas.
- **Maintainer/Contributor (OSS)** — Adds/updates endpoints and defaults safely with minimal touch points; wants strong CI, docs traceability, and clear deprecation workflows.

---

## Must‑Have Stories

1. **Discover schemas by endpoint**
   _As an App Dev, I can get the request and response schemas for an endpoint, so I don’t hand‑roll types._

2. **Safe path building**
   _As an App Dev, I can build paths from templates and params safely, so URLs are never malformed._

3. **Deterministic query building**
   _As a QA Engineer, I can serialize query params in a deterministic way (sorted, normalized, empties dropped), so tests are stable._

4. **One‑liner URL composition**
   _As an App Dev, I can compose base + path + query into a full URL without worrying about slashes or encoding._

5. **Runtime response validation**
   _As a Data Engineer, I can validate API responses with tolerant schemas, so upstream changes don’t break me silently._

6. **Human‑readable errors**
   _As any user, I see clear, compact error messages when validation fails, so I can fix issues quickly._

7. **Single source of truth for defaults**
   _As an App Dev, the library knows server defaults and omits them from queries, so I don’t ship redundant params._

8. **Strong TS types**
   _As a TypeScript Enthusiast, I can infer request/response types directly from schemas, so types never drift._

---

## Should‑Have Stories

9. **Minimal preset client**
   _As an App Dev, I can use a tiny helper that plugs in `fetch` to perform fetch + validate in one step, without opinionated retries or caching._

10. **Mock/fixture helpers**
    _As a QA Engineer, I can plug fixtures into validators and generate deterministic URLs for snapshot tests._

11. **Endpoint inventory/docs**
    _As an App Dev, I can list supported endpoints and see required fields, so onboarding is fast._

12. **CSV helpers for common params**
    _As a Data Engineer, I can pass arrays (e.g. ids, vs_currencies) and the library normalizes them to CSV automatically._

---

## Could‑Have Stories

13. **Type‑safe `withDefaults` helper**
    _As an App Dev, I can expand partial requests into complete ones with defaults filled in, for UI presets or local reasoning._

14. **Strict mode snapshot**
    _As a QA Engineer, I can run a sweep that validates all fixtures and reports diffs, for CI dashboards._

15. **Schema‑guided form helpers**
    _As a UI Dev, I can generate form presets (labels, initial values) from request schemas._

---

## New DX Enhancements

16. **Discoverable request surface (`getRequestFor`)**
    _As an App Dev, I can retrieve a request object for an endpoint with defaults filled and optional fields visible, so I can form valid requests without deep API knowledge._

17. **Implementation‑agnostic error explanation (`explainError`)**
    _As any user, I can call `explainError` on any failure to get a clean message, without needing to know that Zod is used internally._

18. **Request validation symmetry (`parseRequest`)**
    _As an App Dev, I can validate and normalize my request object upfront, just as I can with `parseResponse`, for consistency and safer programmatic query building._

---

## Maintainer/Contributor Stories

### Must‑Have

M1) **Single‑source endpoint onboarding**
_As a Maintainer, I can add or version an endpoint by editing the registry entry (with version/plan, server defaults) and the two schemas, plus tests—**no other files**—so changes are localized and safe._

M2) **Deterministic outputs for CI**
_As a Maintainer, helper outputs are deterministic (sorted, canonical), so snapshots do not flap across machines or Node versions._

M3) **CI gates + coverage**
_As a Maintainer, PRs are blocked unless typecheck, lint, and tests pass and helper coverage remains 100%, ensuring quality._

M4) **Deprecation workflow**
_As a Maintainer, I can deprecate or rename helpers/endpoints with aliasing and a CHANGELOG entry, so downstreams have a clean migration path._

M5) **Docs/inventory from registry**
_As a Maintainer, I can generate an endpoint inventory (including defaults and version/plan) directly from the registry, so docs stay in sync._

### Should‑Have

M6) **Scaffolding for new endpoints**
_As a Maintainer, I can run a scaffold to create schema stubs, a registry descriptor, and test templates, reducing boilerplate._

M7) **Version/plan validation**
_As a Maintainer, the registry flags collisions or gaps between `free`/`pro` and across versions, preventing mismatched schemas/defaults._

M8) **Fixture validation harness**
_As a Maintainer, I can validate minimal fixtures against schemas in watch/CI modes, catching drift early._

M9) **Contribution ergonomics**
_As a Contributor, a PR template and CONTRIBUTING guide clarify coding style, naming, and test expectations._

### Could‑Have

M10) **Upstream sync checks**
_As a Maintainer, I can run a script to diff schemas against upstream specs or sampled payloads to spot breaking changes._

M11) **Endpoint inventory visualization**
_As a Maintainer, I can view a small generated table/graph of endpoints by version/plan with defaults, aiding reviews._

---

## Won’t‑Have (deliberate exclusions)

- Multiple overlapping path formatters; we keep only one clear `formatPath`.
- Overloaded query encodings; default is CSV unless a specific endpoint demands otherwise.
- Heavy HTTP client with retries, caching, or backoff; we stay fetch‑agnostic.
- Hidden global config or toggles; prefer explicit arguments per call.

---

## Cross‑Cutting Qualities

- **Deterministic:** Same input always → same output (stable URLs, stable tests).
- **Orthogonal:** Path, query, validation, docs are separate and composable.
- **No surprises:** No hidden state; no global mutations.
- **Documentation clarity:** Each public helper has a one‑line purpose and intuitive name.
