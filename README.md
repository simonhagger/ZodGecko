# ZodGecko

A **TypeScript + Zod client toolkit** for the [CoinGecko API](https://www.coingecko.com/api/documentation).

- ✅ End-to-end **runtime validation** with [Zod](https://zod.dev)
- ✅ Strongly typed **request & response models**
- ✅ Covers **all documented endpoints** (schemas, requests, responses)
- ✅ Provides **helpers** for query building and server default handling
- ✅ Modular, endpoint-scoped design for easy maintenance and tree-shaking

> ⚠️ **Disclaimer**  
> This project is a **hobby library** maintained on a **best-efforts basis**.  
> It is not officially affiliated with CoinGecko. Contributions welcome!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Installation

```sh
npm install zodgecko
# or
yarn add zodgecko
```

Peer dependency: [Zod](https://zod.dev).

---

## Usage

### Importing an endpoint

```ts
import { coins } from "zodgecko";

// Validate a request
const req = coins.schemas.MarketsRequestSchema.parse({
  vs_currency: "usd",
  ids: ["bitcoin", "ethereum"],
});

// Serialize query string (drops defaults, stable order)
import { buildQuery } from "zodgecko";
const qs = new URLSearchParams(buildQuery("/coins/markets", req)).toString();
// → "ids=bitcoin%2Cethereum&vs_currency=usd"

// Validate a response
const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?${qs}`);
const data = coins.schemas.MarketsResponseSchema.parse(await res.json());
```

---

## Project Structure

```
src/
  core/        # Shared Zod primitives & fragments
  runtime/     # buildQuery + serverDefaults
  endpoints/   # One folder per API group (coins, exchanges, simple, ...)
```

Each endpoint group contains:

- `schemas.ts` — Zod schemas (runtime validation)
- `requests.ts` — inferred request types
- `responses.ts` — inferred response types
- `index.ts` — public barrel
- (optional) `README.md` — endpoint docs
- (optional) `__tests__/` — unit tests

---

## Why Zod + CoinGecko?

CoinGecko’s API is powerful but untyped and fast-evolving.
ZodGecko provides:

- **Runtime safety** — every response is schema-validated
- **Type inference** — no need to hand-maintain TypeScript interfaces
- **Consistency** — defaults and CSV lists normalized
- **Flexibility** — tolerant responses survive API changes

---

## Contributing

Contributions are welcome!

1. Fork and clone this repo
2. Install dependencies: `npm install`
3. Run type checks: `npm run typecheck`
4. Add tests where possible
5. Submit a PR

**Coding standards:**

- One endpoint = one folder in `src/endpoints/`
- Requests strict, responses tolerant
- Shared fragments in `src/core/`
- Document new files with `@file` and `@module` JSDoc

---

## Roadmap

- [x] Full endpoint coverage
- [x] Stable query serialization with defaults
- [ ] Unit tests for each endpoint
- [ ] Publish to NPM
- [ ] Example usage in frameworks (Node, Deno, browser)

---

### Notes

- This library is provided **as-is**.
- No guarantees of completeness, uptime, or compatibility with future CoinGecko API versions.
- Please open an issue if you spot missing schemas or defaults.

---

Happy hacking! 🚀

## License

This project is licensed under the terms of the [MIT License](./LICENSE).

## Note

To produce an holistic overview of this repository there is a PowerShell script that can be run with:

```powershell
.\Export-Project.ps1 -OutputFile "project-dump-$(Get-Date -Format yyyyMMdd-HHmm).txt"
```
