// scripts/check-endpoint-inventory.ts
// Verifies docs/endpoint-inventory.md matches current schemas + SERVER_DEFAULTS,
// using the renamed columns.
//
// Columns expected (order only; names are ignored):
// 1) API Endpoint (backticked path)
// 2) Required in Path
// 3) Required in Querystring
// 4) Optional in Querystring (with Server Defaults)
// 5) Optional in Querystring (no Server Defaults defined)

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ZodError } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const DOC_MD = path.join(ROOT, "docs", "endpoint-inventory.md");
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

// Runtime types
type GetSchemasFn = (ep: string) => { req: any; res: any };
type GetRequiredKeysFromSchemaFn = (schema: unknown) => string[];
type SafeParseResult = { success: true } | { success: false; error: ZodError };
type FallbackSP = (x: unknown) => SafeParseResult;

// ---- Markdown parsing (header-agnostic) ----
function parseMdTable(md: string) {
  // Matches table rows like:
  // | `/coins/markets` | ... | ... | ... | ... |
  const rows = [
    ...md.matchAll(/^\|\s*`([^`]+)`\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|$/gm),
  ];
  return rows.map((m) => {
    const ep = m[1].trim();

    const parseCell = (s: string) => {
      if (s.includes("_(none)_")) return [];
      // backticked tokens (can be `key` or `key=value`)
      return [...s.matchAll(/`([^`]+)`/g)].map((x) => x[1]).sort();
    };

    return {
      ep,
      reqPath_doc: parseCell(m[2]),
      reqQuery_doc: parseCell(m[3]),
      optWithDefault_doc: parseCell(m[4]),
      optOther_doc: parseCell(m[5]),
    };
  });
}

// ---- Helpers to compute truth from code ----
function pathParams(ep: string): string[] {
  const out: string[] = [];
  const re = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(ep))) out.push(m[1]);
  return out;
}

async function loadAllEndpoints(): Promise<string[]> {
  const mod = await import(pathToFileURL(ENDPOINTS_TS).href);
  const list: unknown = (mod as any).ALL_ENDPOINTS ?? [];
  if (!Array.isArray(list)) throw new Error("ALL_ENDPOINTS not found");
  return (list as unknown[])
    .map(String)
    .filter((s) => s.startsWith("/"))
    .sort();
}

async function loadGetSchemas(): Promise<GetSchemasFn> {
  const mod = await import(pathToFileURL(RUNTIME_INDEX_TS).href);
  const fn = (mod as any).getSchemas ?? (mod as any).default?.getSchemas;
  if (typeof fn === "function") return fn as GetSchemasFn;
  throw new Error("getSchemas() not found");
}

async function loadHelper(): Promise<GetRequiredKeysFromSchemaFn> {
  const mod = await import(pathToFileURL(TEST_HELPER_SCHEMA_TS).href);
  const fn = (mod as any).getRequiredKeysFromSchema;
  if (typeof fn !== "function") throw new Error("getRequiredKeysFromSchema not found");
  return fn as GetRequiredKeysFromSchemaFn;
}

async function loadServerDefaults(): Promise<Record<string, Record<string, unknown>>> {
  const mod = await import(pathToFileURL(SERVER_DEFAULTS_TS).href);
  return (mod as any).SERVER_DEFAULTS ?? {};
}

/** Top-level keys for a ZodObject (v4-safe) */
function getTopLevelKeys(schema: unknown): string[] {
  const maybeObj = schema as { keyof?: () => { options?: string[] } };
  const ko = typeof maybeObj?.keyof === "function" ? maybeObj.keyof() : undefined;
  const options = (ko as any)?.options;
  return Array.isArray(options) ? options.map(String).sort() : [];
}

/** Fallback required detector (Zod safeParse on empty) */
function zodFallbackRequired(reqSchema: any, ep: string, ignore: Set<string>): string[] {
  const sp: FallbackSP | undefined =
    typeof reqSchema?.safeParse === "function" ? reqSchema.safeParse : undefined;
  if (!sp) return [];
  const r = sp({});
  if (r.success) return [];
  const issues = flattenIssues(((r.error as ZodError).issues as any[]) ?? []);
  const required = new Set<string>();
  for (const issue of issues) {
    if (!Array.isArray(issue.path) || issue.path.length !== 1) continue;
    const key = String(issue.path[0]);
    if (ignore.has(key)) continue;
    const code = String(issue.code ?? "");
    const msg = String(issue.message ?? "");
    const receivedUndefined = /received\s+undefined/i.test(msg);
    if (code === "invalid_type" && receivedUndefined) {
      required.add(key);
      continue;
    }
    if (code === "invalid_union") {
      required.add(key);
      continue;
    }
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

function normalizeDefaultKV(epDefaults: Record<string, unknown>): string[] {
  // Produce `key=value` strings (booleans as true/false, numbers as is, strings raw)
  const list = Object.entries(epDefaults).map(([k, v]) => {
    if (typeof v === "boolean") return `${k}=${v ? "true" : "false"}`;
    if (typeof v === "number") return `${k}=${String(v)}`;
    if (typeof v === "string") return `${k}=${v}`;
    return `${k}=${JSON.stringify(v)}`;
  });
  return list.sort();
}

function diff(label: string, docs: string[], code: string[]) {
  const D = new Set(docs);
  const C = new Set(code);
  const onlyDocs = docs.filter((x) => !C.has(x));
  const onlyCode = code.filter((x) => !D.has(x));
  if (onlyDocs.length || onlyCode.length) {
    console.error(`❌ ${label} mismatch`);
    if (onlyDocs.length) console.error("  Only in docs:", onlyDocs.join(", "));
    if (onlyCode.length) console.error("  Only in code:", onlyCode.join(", "));
    return false;
  }
  return true;
}

// ---- Main ----
(async () => {
  const md = readFileSync(DOC_MD, "utf8");
  const rows = parseMdTable(md);
  if (!rows.length) {
    console.error("❌ No rows parsed from docs/endpoint-inventory.md");
    process.exit(1);
  }

  const [paths, getSchemas, helper, serverDefaults] = await Promise.all([
    loadAllEndpoints(),
    loadGetSchemas(),
    loadHelper(),
    loadServerDefaults(),
  ]);

  let ok = true;

  for (const ep of paths) {
    const doc = rows.find((r) => r.ep === ep);
    if (!doc) {
      console.error(`❌ Missing row in docs for ${ep}`);
      ok = false;
      continue;
    }

    const reqPath = pathParams(ep);
    const { req } = getSchemas(ep);
    const allKeys = getTopLevelKeys(req);
    const defaults = serverDefaults[ep] ?? {};

    // Required in Querystring (helper ∪ fallback) − path − defaults-keys
    const fromHelper = helper(req) || [];
    const fallback = fromHelper.length === 0 ? zodFallbackRequired(req, ep, new Set(reqPath)) : [];
    const requiredUnion = [...new Set([...fromHelper, ...fallback])].sort();
    const reqQuery_final = requiredUnion
      .filter((k) => !reqPath.includes(k))
      .filter((k) => !Object.prototype.hasOwnProperty.call(defaults, k))
      .sort();

    // Optional in Querystring (with defaults): show `key=value`
    const optWithDefault = normalizeDefaultKV(defaults);

    // Optional in Querystring (no defaults): the rest of top-level keys
    const optOther = allKeys.filter(
      (k) =>
        !reqPath.includes(k) &&
        !reqQuery_final.includes(k) &&
        !Object.prototype.hasOwnProperty.call(defaults, k),
    );

    ok &&= diff(`${ep} — Required in Path`, doc.reqPath_doc, reqPath);
    ok &&= diff(`${ep} — Required in Querystring`, doc.reqQuery_doc, reqQuery_final);
    ok &&= diff(
      `${ep} — Optional in Querystring (with Server Defaults)`,
      doc.optWithDefault_doc,
      optWithDefault,
    );
    ok &&= diff(
      `${ep} — Optional in Querystring (no Server Defaults defined)`,
      doc.optOther_doc,
      optOther,
    );
  }

  if (!ok) process.exit(1);
  console.log("✅ endpoint-inventory.md matches code & defaults");
})().catch((err) => {
  console.error("❌ check-endpoint-inventory failed");
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
