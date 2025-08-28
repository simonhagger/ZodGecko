// scripts/generate-endpoint-inventory-docs.ts
/**
 * Build docs/endpoint-inventory.md with:
 * - Required Path params      (from /path/{param})
 * - Required Query params     (helper getRequiredKeysFromSchema(req) OR Zod fallback)
 * - Optional (server default) (keys in SERVER_DEFAULTS[ep], rendered as key=value)
 * - Optional (other)          (remaining top-level keys)
 *
 * Also emits a machine-readable sidecar: docs/endpoint-inventory.json
 *
 * CLI:
 *   --debug
 *   --endpoint="/coins/{id}/history"
 *
 * Usage:
 *   npm run docs:inventory -- --debug
 *   npx tsx scripts/generate-endpoint-inventory-docs.ts --endpoint="/coins/{id}/history"
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ZodError } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const OUT_MD = path.join(ROOT, "docs", "endpoint-inventory.md");
const OUT_JSON = path.join(ROOT, "docs", "endpoint-inventory.json");
const RUNTIME_INDEX_TS = path.join(ROOT, "src", "runtime", "index.ts");
const ENDPOINTS_TS = path.join(ROOT, "src", "runtime", "endpoints.ts");
const SERVER_DEFAULTS_TS = path.join(ROOT, "src", "runtime", "server-defaults.ts");
const TEST_HELPER_SCHEMA_TS = path.join(
  ROOT,
  "src",
  "endpoints",
  "__tests__",
  "_utils",
  "schema.ts",
);

/* ---------------- CLI flags --------------- */
type CliFlags = { debug: boolean; endpoint?: string };
function parseArgs(argv: string[]): CliFlags {
  const flags: CliFlags = { debug: false };
  for (const a of argv.slice(2)) {
    if (a === "--debug") flags.debug = true;
    else if (a.startsWith("--endpoint=")) flags.endpoint = a.split("=", 2)[1];
    else if (a === "--help" || a === "-h") {
      console.log(
        'Usage: tsx scripts/generate-endpoint-inventory-docs.ts [--debug] [--endpoint="/path"]',
      );
      process.exit(0);
    }
  }
  return flags;
}
const { debug: DEBUG_VERBOSE, endpoint: DEBUG_ENDPOINT } = parseArgs(process.argv);
const log = (...args: unknown[]) => {
  if (DEBUG_VERBOSE) console.log("[docs:inventory]", ...args);
};
const logEp = (ep: string, ...args: unknown[]) => {
  if (DEBUG_VERBOSE || DEBUG_ENDPOINT === ep) console.log(`[docs:inventory][${ep}]`, ...args);
};

/* ---------------- Types --------------- */
type GetSchemasFn = (ep: string) => { req: any; res: any };
type GetRequiredKeysFromSchemaFn = (schema: unknown) => string[];
type SafeParseResult = { success: true } | { success: false; error: ZodError };
type FallbackSP = (x: unknown) => SafeParseResult;

/* ---------------- Helpers --------------- */
function pathParams(ep: string): string[] {
  const out: string[] = [];
  const re = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(ep))) out.push(m[1]);
  return out;
}

function backtickList(items: string[]): string {
  const arr = [...items];
  if (arr.length) arr.sort((a, b) => a.localeCompare(b));
  return arr.length ? arr.map((k) => `\`${k}\``).join(", ") : "*(none)*";
}

function render(
  rows: Array<{
    ep: string;
    reqPath: string[];
    reqQuery: string[];
    optWithDefault: string[]; // rendered key=value strings
    optOther: string[];
  }>,
): string {
  const intro = `# Endpoint Inventory

This document is the **catalogue of CoinGecko API endpoints supported by ZodGecko**.
It shows, for each endpoint, which parameters must be supplied and which are optional.

The columns are:

- **API Endpoint** — the REST path exactly as it appears in the CoinGecko API.
- **Required in Path** — parameters that must appear directly in the URL path (e.g. "/coins/{id}" requires "id").
- **Required in Querystring** — query parameters that must always be provided in the request (e.g. "/coins/markets" requires "vs_currency").
- **Optional in Querystring (with Server Defaults)** — query parameters that are optional because the server applies a default value if you omit them. These are shown in "key=value" form (e.g. "depth=false", "page=1").
- **Optional in Querystring (no Server Defaults defined)** — query parameters that are entirely optional and have no default; you only include them when you want to refine the response.

Together, these columns give you a quick reference to how each endpoint is shaped and how ZodGecko enforces it.  
Because this inventory is generated from the schemas and server defaults in the codebase, it is always up to date.

| API Endpoint | Required in Path | Required in Querystring | Optional in Querystring (with Server Defaults) | Optional in Querystring (no Server Defaults defined) |
|--------------|------------------|-------------------------|-----------------------------------------------|------------------------------------------------------|
`;

  const body = rows
    .map(
      (r) =>
        `| \`${r.ep}\` | ${backtickList(r.reqPath)} | ${backtickList(r.reqQuery)} | ${backtickList(r.optWithDefault)} | ${backtickList(r.optOther)} |`,
    )
    .join("\n");

  const tsUtc = new Date().toISOString().replace("T", " ").replace("Z", " UTC");
  const shortSha = (process.env.GITHUB_SHA || "").slice(0, 7);
  const footer = `\n\n_Generated on ${tsUtc}` + (shortSha ? ` (commit ${shortSha})` : "") + `._\n`;

  return intro + body + footer;
}

async function loadAllEndpoints(): Promise<string[]> {
  const mod = await import(pathToFileURL(ENDPOINTS_TS).href);
  const list: unknown = (mod as any).ALL_ENDPOINTS ?? (mod as any).default ?? [];
  if (!Array.isArray(list)) throw new Error("ALL_ENDPOINTS not found or not an array");
  return (list as unknown[])
    .map(String)
    .filter((s) => s.startsWith("/"))
    .sort();
}

async function loadGetSchemas(): Promise<GetSchemasFn> {
  try {
    const mod = await import(pathToFileURL(RUNTIME_INDEX_TS).href);
    const fn = (mod as any).getSchemas ?? (mod as any).default?.getSchemas;
    if (typeof fn === "function") return fn as GetSchemasFn;
  } catch {}
  const mod2 = await import(pathToFileURL(ENDPOINTS_TS).href);
  const fn2 = (mod2 as any).getSchemas ?? (mod2 as any).default?.getSchemas;
  if (typeof fn2 === "function") return fn2 as GetSchemasFn;
  throw new Error("getSchemas() not found");
}

async function loadHelper(): Promise<GetRequiredKeysFromSchemaFn> {
  const mod = await import(pathToFileURL(TEST_HELPER_SCHEMA_TS).href);
  const fn =
    (mod as any).getRequiredKeysFromSchema ?? (mod as any).default?.getRequiredKeysFromSchema;
  if (typeof fn !== "function") throw new Error("getRequiredKeysFromSchema not found");
  return fn as GetRequiredKeysFromSchemaFn;
}

async function loadServerDefaults(): Promise<Record<string, Record<string, unknown>>> {
  const mod = await import(pathToFileURL(SERVER_DEFAULTS_TS).href);
  const obj: unknown = (mod as any).SERVER_DEFAULTS ?? {};
  if (!obj || typeof obj !== "object") throw new Error("SERVER_DEFAULTS not found");
  return obj as Record<string, Record<string, unknown>>;
}

/** Zod v4-safe way to get top-level keys from a ZodObject: use keyof() */
function getTopLevelKeys(schema: unknown, ep: string): string[] {
  type WithKeyof = { keyof: () => { options?: string[] } };

  const hasKeyof = (s: unknown): s is WithKeyof => !!s && typeof (s as any).keyof === "function";

  if (!hasKeyof(schema)) {
    logEp(ep, "Request schema is not a ZodObject (no keyof()); skipping top-level key discovery.");
    return [];
  }

  const ko = schema.keyof(); // safe: schema is WithKeyof here
  const options = (ko as any)?.options;
  return Array.isArray(options) ? options.map(String).sort() : [];
}

/** Flatten Zod issues (union branches included) */
function flattenIssues(raw: any[]): any[] {
  const out: any[] = [];
  const stack = [...raw];
  while (stack.length) {
    const issue = stack.pop();
    out.push(issue);
    if (Array.isArray(issue?.errors)) stack.push(...issue.errors);
    if (Array.isArray(issue?.unionErrors)) {
      for (const ue of issue.unionErrors) {
        if (Array.isArray(ue?.issues)) stack.push(...ue.issues);
      }
    }
  }
  return out;
}

/** Heuristic required detection from safeParse({}) */
function zodFallbackRequired(reqSchema: any, ep: string, ignore: Set<string>): string[] {
  const sp: FallbackSP | undefined =
    typeof reqSchema?.safeParse === "function" ? reqSchema.safeParse : undefined;
  if (!sp) {
    logEp(ep, "No safeParse on req schema; skipping fallback.");
    return [];
  }
  const r = sp({});
  if (r.success) return [];

  const issues = flattenIssues(((r.error as ZodError).issues as any[]) ?? []);
  logEp(ep, "flattened issues:", issues);

  const required = new Set<string>();
  for (const issue of issues) {
    if (!Array.isArray(issue.path) || issue.path.length !== 1) continue;
    const key = String(issue.path[0]);
    if (ignore.has(key)) continue;

    const code = String(issue.code ?? "");
    const msg = String(issue.message ?? "");
    const receivedUndefined = /received\s+undefined/i.test(msg);

    // Primary: invalid_type + "received undefined"
    if (code === "invalid_type" && receivedUndefined) {
      required.add(key);
      continue;
    }
    // Unions: empty input fails union → treat as required (e.g., vs_currencies)
    if (code === "invalid_union") {
      required.add(key);
      continue;
    }
    // Conservative extras
    if (code === "invalid_string" || code === "too_small" || code === "too_big") {
      required.add(key);
      continue;
    }
    if (/required/i.test(msg)) {
      required.add(key);
      continue;
    }
  }
  return Array.from(required).sort();
}

/** Render default value as a stable string for key=value */
function formatDefaultValue(v: unknown): string {
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") {
    // Quote if contains comma/backtick to avoid breaking Markdown cell parsing
    return /[`,]/.test(v) ? JSON.stringify(v) : v;
  }
  // Arrays/objects → JSON
  return JSON.stringify(v);
}

/* ---------------- Main --------------- */
async function main() {
  console.log("[docs:inventory] Starting generation…");
  const [paths, getSchemas, helper, serverDefaults] = await Promise.all([
    loadAllEndpoints(),
    loadGetSchemas(),
    loadHelper(),
    loadServerDefaults(),
  ]);

  const rows: Array<{
    ep: string;
    reqPath: string[];
    reqQuery: string[];
    optWithDefault: string[]; // rendered key=value
    optOther: string[];
  }> = [];

  for (const ep of paths) {
    const verbose = DEBUG_VERBOSE || DEBUG_ENDPOINT === ep;
    const reqPath = pathParams(ep);
    if (verbose) logEp(ep, "Path params:", reqPath);

    const { req } = getSchemas(ep);
    const allKeys = getTopLevelKeys(req, ep);
    if (verbose) logEp(ep, "Top-level keys:", allKeys);

    // (1) Required from helper
    let required = [] as string[];
    try {
      required = (helper(req) || []).slice();
      if (verbose) logEp(ep, "helper required:", required);
    } catch (e) {
      console.error(`[docs:inventory][${ep}] helper error:`, (e as Error).message);
    }

    // (2) Fallback from Zod if helper empty (or keep union with helper by merging)
    if (required.length === 0) {
      const ignore = new Set(reqPath);
      const fb = zodFallbackRequired(req, ep, ignore);
      if (verbose) logEp(ep, "fallback required:", fb);
      required = fb;
    }

    // (3) Subtract path params and server-default keys from required
    const defaultsMap = serverDefaults[ep] ?? {};
    const defaultsKeys = Object.keys(defaultsMap).sort();
    const reqPathSet = new Set(reqPath);
    const defaultsSet = new Set(defaultsKeys);
    const requiredFinal = required.filter((k) => !reqPathSet.has(k) && !defaultsSet.has(k)).sort();
    if (verbose) logEp(ep, "required (final):", requiredFinal);

    // Optional buckets (stable ordering)
    // Optional with defaults: show key=value, then sort the rendered strings
    const optWithDefault = Object.entries(defaultsMap)
      .map(([k, v]) => `${k}=${formatDefaultValue(v)}`)
      .sort((a, b) => a.localeCompare(b));

    // Optional other: remaining top-level keys
    const optOther = allKeys
      .filter((k) => !defaultsSet.has(k) && !requiredFinal.includes(k) && !reqPathSet.has(k))
      .sort((a, b) => a.localeCompare(b));

    rows.push({ ep, reqPath, reqQuery: requiredFinal, optWithDefault, optOther });
  }

  // Rows are already in endpoint-sorted order from loadAllEndpoints()

  await fs.mkdir(path.dirname(OUT_MD), { recursive: true });

  // Write JSON sidecar (machine-readable)
  await fs.writeFile(OUT_JSON, JSON.stringify(rows, null, 2), "utf8");

  // Write Markdown
  await fs.writeFile(OUT_MD, render(rows), "utf8");

  console.log(
    `✅ Wrote ${path.relative(ROOT, OUT_MD)} & ${path.relative(ROOT, OUT_JSON)} (${rows.length} endpoints).`,
  );
}

main().catch((err) => {
  console.error("[docs:inventory] ❌ Failed to generate endpoint-inventory.*");
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
