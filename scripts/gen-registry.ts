/*
 * scripts/gen-registry.ts
 * ---------------------------------------------------------------------------
 * Generates the runtime registry as a **single `as const` array** export and,
 * optionally, a tiny derived types helper so the client can index paths by
 * version/plan without collapsing to `never`.
 *
 * Output files:
 *   - src/registry/generated.ts        (runtime, `GENERATED_REGISTRY` as const)
 *   - src/registry/derived-types.ts    (types-only, derived from generated)
 *
 * Notes:
 *   - This script expects an array of `EntrySource` from your existing discovery
 *     step. Replace `loadEntries()` with your project-specific loader.
 *   - The writer consolidates schema imports and emits them once at the top of
 *     `generated.ts`.
 */

/* eslint-disable no-console */
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import prettier from "prettier";

import { pathTemplateFromSlug } from "../src/registry/path-from-slug.ts";
import { PLANS, VERSIONS, VERSION_TO_PLAN, type ApiPlan, type ApiVersion } from "../src/types.ts";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const SCHEMAS = path.join(SRC, "schemas");
const OUT = path.join(SRC, "registry", "generated.ts");

const SLUG_RE = /^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\.by-[a-z0-9_]+(?:\.[a-z0-9_]+)*)?$/;

/* ---------------- CLI flags ---------------- */
type Cli = {
  debug: boolean;
  only: Set<string> | null;
  dumpShape: boolean;
  dumpRequest: boolean;
  printWidth: number;
};
function parseCli(argv: string[]): Cli {
  let debug = false;
  let only: Set<string> | null = null;
  let dumpShape = false;
  let dumpRequest = false;
  let printWidth = 100;

  for (const a of argv.slice(2)) {
    if (a === "--debug") debug = true;
    else if (a.startsWith("--only=")) {
      const list = a
        .slice("--only=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      only = new Set(list);
    } else if (a === "--dump-shape") dumpShape = true;
    else if (a === "--dump-request") dumpRequest = true;
    else if (a.startsWith("--print-width=")) {
      const n = Number(a.slice("--print-width=".length));
      if (!Number.isNaN(n) && n > 20) printWidth = n;
    }
  }
  return { debug, only, dumpShape, dumpRequest, printWidth };
}
const CLI = parseCli(process.argv);
function dbg(...args: unknown[]): void {
  if (CLI.debug) console.log("[gen-registry]", ...args);
}

// --- pretty emit helpers ---
function renderArrayConst(items: string[]): string {
  if (items.length === 0) return "[] as const";
  return `[${items.join(", ").trim()}] as const`;
}

function renderObjectConst(lines: string[]): string {
  if (lines.length === 0) return "{} as const";
  return `{${lines.join(", ").trim()}} as const`;
}

/* ---------- helpers ---------- */
function requiredFromTemplate(tpl: string): string[] {
  const out = new Set<string>();
  const re = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tpl))) out.add(m[1]);
  return Array.from(out);
}
function sanitizeAlias(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, "_");
}

/* Zod duck-typing helpers */
function getDef(s: unknown): unknown {
  if (!s || typeof s !== "object") return undefined;
  const anyS = s as Record<string, unknown>;
  // prefer _def, but allow def (seen in your build)
  return (anyS as any)._def ?? (anyS as any).def ?? undefined;
}

function getTypeName(s: unknown): string | undefined {
  const d = getDef(s) as { typeName?: unknown } | undefined;
  const tn = d && typeof d.typeName === "string" ? d.typeName : undefined;
  if (tn) return tn;
  const ctor = (s as any)?.constructor?.name;
  if (typeof ctor === "string" && ctor.startsWith("Zod")) return ctor;
  return undefined;
}
function getQMeta(schema: unknown): { arrayEncoding?: "csv"; dropWhenDefault?: boolean } | null {
  const sym = Symbol.for("zodgecko.qmeta");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return (schema && (schema as any)[sym]) ?? null;
}
function isOptionalish(schema: unknown): boolean {
  try {
    const sp = (schema as any)?.safeParse;
    if (typeof sp === "function") {
      const res = sp(undefined);
      return !!(
        res &&
        typeof res === "object" &&
        "success" in res &&
        (res as any).success === true
      );
    }
  } catch {
    // ignore and fall through
  }
  return false;
}

/** Handle chained wrappers (Default / Optional / Effects / Branded) and surface first default. */
function unwrapForDefaultsDeep(s: unknown): {
  inner: unknown;
  defaultValue: unknown | undefined;
  wasOptional: boolean;
  isArray: boolean;
} {
  let node: unknown = s;
  let defaultValue: unknown | undefined;
  let wasOptional = false;

  for (let i = 0; i < 16; i += 1) {
    const t = getTypeName(node);
    const d = getDef(node) as
      | {
          defaultValue?: unknown;
          innerType?: unknown;
          schema?: unknown;
          type?: unknown;
          options?: unknown[]; // unions
        }
      | undefined;

    // capture default if present at this level
    if (d && "defaultValue" in d) {
      const dv = d.defaultValue;
      if (dv !== undefined) defaultValue = typeof dv === "function" ? (dv as () => unknown)() : dv;
    }

    // explicit wrappers that imply optional-ish semantics
    if (t === "ZodOptional") wasOptional = true;
    if (t === "ZodNullable" || t === "ZodNullish") wasOptional = true;

    // unions that include undefined also imply optional-ish
    if ((t === "ZodUnion" || t === "ZodDiscriminatedUnion") && Array.isArray(d?.options)) {
      const hasUndefined = (d!.options as unknown[]).some((o) => getTypeName(o) === "ZodUndefined");
      if (hasUndefined) wasOptional = true;
    }

    // unwrap known wrappers
    if (t === "ZodDefault" || (d && "defaultValue" in d)) {
      node = d?.innerType ?? d?.schema ?? d?.type ?? node;
      continue;
    }
    if (t === "ZodOptional" || t === "ZodNullable" || t === "ZodNullish") {
      node = d?.innerType ?? node;
      continue;
    }
    if (t === "ZodEffects") {
      node = d?.schema ?? node;
      continue;
    }
    if (t === "ZodBranded") {
      node = d?.type ?? node;
      continue;
    }

    // as a last resort, try generic inner pointers once
    if (!t && d && (d.innerType || d.schema || d.type)) {
      node = d.innerType ?? d.schema ?? d.type ?? node;
      continue;
    }

    break;
  }

  const isArray = getTypeName(node) === "ZodArray";
  return { inner: node, defaultValue, wasOptional, isArray };
}

/** Unwrap the ROOT schema until we reach a ZodObject (or give up). */
function unwrapObjectForShapeDeep(s: unknown): unknown {
  let node: unknown = s;
  for (let i = 0; i < 12; i += 1) {
    const t = getTypeName(node);
    if (t === "ZodObject") return node;
    const d = getDef(node) as { innerType?: unknown; schema?: unknown; type?: unknown } | undefined;
    if (t === "ZodDefault" || t === "ZodOptional") {
      node = d?.innerType ?? node;
      continue;
    }
    if (t === "ZodEffects") {
      node = d?.schema ?? node;
      continue;
    }
    if (t === "ZodBranded") {
      node = d?.type ?? node;
      continue;
    }
    // if we still don't know the type, try generic fallbacks anyway
    if (!t && d) {
      node = d.innerType ?? d.schema ?? d.type ?? node;
      if (node !== s) continue;
    }
    break;
  }
  return node;
}

function isZodObject(s: unknown): boolean {
  return getTypeName(s) === "ZodObject";
}

/** Accepts either a ZodObject or a wrapper around it. */
function getObjectShape(s: unknown): Record<string, unknown> | null {
  const root = unwrapObjectForShapeDeep(s);
  const t = getTypeName(root);
  dbg("   root type after unwrap:", t ?? "(unknown)");
  if (getTypeName(root) !== "ZodObject") return null;

  const anyR = root as any;
  const d = getDef(root) as { shape?: unknown } | undefined;
  const shapeCandidate = d?.shape ?? anyR.shape;

  if (typeof shapeCandidate === "function") {
    try {
      return (shapeCandidate as () => Record<string, unknown>)();
    } catch {
      return null;
    }
  }
  if (shapeCandidate && typeof shapeCandidate === "object") {
    return shapeCandidate as Record<string, unknown>;
  }
  return null;
}

// Build a wrapped import so max-len never trips (always multi-line, trailing comma)
function buildWrappedImport(alias: string, specifierFromRegistryDir: string): string {
  return [
    "import {",
    `  requestSchema as req_${alias},`,
    `  responseSchema as res_${alias},`,
    `} from "./${specifierFromRegistryDir}";`,
  ].join("\n");
}

// Normalize an import specifier string for sorting so "." sorts AFTER "/"
function normalizeSpecifierForSort(spec: string): string {
  return spec.replaceAll(".", "~");
}

/* -------------------------- discovery (TS) -------------------------- */
async function findModules(): Promise<
  Array<{ slug: string; version: ApiVersion; plan: ApiPlan; file: string }>
> {
  const out: Array<{ slug: string; version: ApiVersion; plan: ApiPlan; file: string }> = [];

  const slugs = (await fs.readdir(SCHEMAS)).filter((d) => !d.startsWith("_"));
  for (const slug of slugs) {
    if (CLI.only && !CLI.only.has(slug)) continue;

    if (!SLUG_RE.test(slug)) throw new Error(`Invalid slug folder name: ${slug}`);
    const slugDir = path.join(SCHEMAS, slug);

    const versions = await fs.readdir(slugDir);
    for (const version of versions as ApiVersion[]) {
      if (!(VERSIONS as readonly string[]).includes(version)) continue;

      const vDir = path.join(slugDir, version);
      const plan = VERSION_TO_PLAN[version];
      if (!(PLANS as readonly string[]).includes(plan)) continue;

      const idx = path.join(vDir, plan, "index.ts");
      try {
        await fs.access(idx);
        out.push({ slug, version, plan, file: idx });
      } catch {
        // missing variant → skip
      }
    }
  }

  // duplicate guard
  const seen = new Set<string>();
  for (const m of out) {
    const key = `${m.slug}__${m.version}__${m.plan}`;
    if (seen.has(key)) throw new Error(`Duplicate schema variant: ${key}`);
    seen.add(key);
  }
  return out;
}

type RequestSource =
  | "barrel:requestSchema"
  | "barrel:baseRequestSchema"
  | "request.ts"
  | "base-request.ts"
  | "none";

async function tryImportRequest(
  file: string,
): Promise<{ schema?: unknown; source: RequestSource }> {
  // 1) barrel/index.ts
  try {
    const mod = await import(pathToFileURL(file).href);
    if ((mod as any).requestSchema)
      return { schema: (mod as any).requestSchema, source: "barrel:requestSchema" };
    if ((mod as any).baseRequestSchema)
      return { schema: (mod as any).baseRequestSchema, source: "barrel:baseRequestSchema" };
  } catch {
    /* ignore */
  }

  // 2) sibling request.ts
  try {
    const reqFile = file.replace(/index\.ts$/, "request.ts");
    const reqMod = await import(pathToFileURL(reqFile).href);
    if ((reqMod as any).requestSchema)
      return { schema: (reqMod as any).requestSchema, source: "request.ts" };
    if ((reqMod as any).baseRequestSchema)
      return { schema: (reqMod as any).baseRequestSchema, source: "request.ts" };
  } catch {
    /* ignore */
  }

  // 3) two-level base-request.ts  (../../base-request.ts)
  try {
    const baseReqFile = path.join(path.dirname(file), "..", "..", "base-request.ts");
    await fs.access(baseReqFile);
    const baseMod = await import(pathToFileURL(baseReqFile).href);
    if ((baseMod as any).baseRequestSchema) {
      return { schema: (baseMod as any).baseRequestSchema, source: "base-request.ts" };
    }
  } catch {
    /* ignore */
  }

  return { schema: undefined, source: "none" };
}

async function importModule(file: string): Promise<{
  meta: { pathTemplate?: string; method?: string } | null;
  requestSchema?: unknown;
  responseSchema?: unknown;
  requestSource: RequestSource;
}> {
  const mod = await import(pathToFileURL(file).href); // tsx resolves .js specifiers to .ts
  const { schema, source } = await tryImportRequest(file);

  const meta = (mod as any).meta ?? null;
  const responseSchema = (mod as any).responseSchema;

  return { meta, requestSchema: schema, responseSchema, requestSource: source };
}

/* ------------------------------ main ------------------------------ */
async function main(): Promise<void> {
  const mods = await findModules();

  // deterministic entry order
  mods.sort((a, b) =>
    a.slug === b.slug
      ? a.version === b.version
        ? a.plan.localeCompare(b.plan)
        : a.version.localeCompare(b.version)
      : a.slug.localeCompare(b.slug),
  );

  const importBlocks: Array<{ key: string; sortKey: string; block: string }> = [];
  const entryBlocks: string[] = [];

  for (const m of mods) {
    const { meta, requestSchema, responseSchema, requestSource } = await importModule(m.file);
    if (!responseSchema) {
      console.warn(`Skipping ${m.file}: missing responseSchema`);
      continue;
    }

    // Path: meta override or slug-derived
    let pathTemplate: string;
    let requiredPath: string[];
    if (meta?.pathTemplate) {
      pathTemplate = meta.pathTemplate;
      requiredPath = requiredFromTemplate(meta.pathTemplate);
      const derived = pathTemplateFromSlug(m.slug);
      const a = [...requiredPath].sort().join(",");
      const b = [...derived.requiredParams].sort().join(",");
      if (a !== b) {
        console.warn(
          `Param mismatch for ${m.slug}: template {${a}} vs slug-derived {${b}} — verify.`,
        );
      }
    } else {
      const derived = pathTemplateFromSlug(m.slug);
      pathTemplate = derived.template;
      requiredPath = [...derived.requiredParams];
    }

    dbg(`→ ${m.slug} [${m.version}/${m.plan}] requestSource=${requestSource}`);
    if (CLI.dumpRequest) {
      const kind = requestSchema === undefined ? "undefined" : typeof requestSchema;
      const ctor =
        requestSchema && (requestSchema as any).constructor
          ? (requestSchema as any).constructor.name
          : "(no ctor)";
      const hasDef = !!(requestSchema && (requestSchema as any)._def);
      const tname = getTypeName(requestSchema);
      dbg("   requestSchema dump:", {
        kind,
        ctor,
        hasDef,
        typeName: tname,
        keys:
          requestSchema && typeof requestSchema === "object"
            ? Object.keys(requestSchema as object)
            : [],
      });
    }

    // Cross-check path keys from request schema (when present & normalized)
    if (requestSchema) {
      const root = getObjectShape(requestSchema);
      const pathObj = root?.path ? getObjectShape((root as { path: unknown }).path) : null;
      if (pathObj) {
        const keys = Object.keys(pathObj).sort();
        const req = [...requiredPath].sort();
        if (JSON.stringify(keys) !== JSON.stringify(req)) {
          throw new Error(
            `Path keys ${JSON.stringify(keys)} do not match required ${JSON.stringify(
              req,
            )} for ${m.slug}`,
          );
        }
      }
    }

    // Derive queryRules & serverDefaults (normalized OR legacy)
    const queryRules: string[] = [];
    const serverDefaultsPairs: string[] = [];
    // Derive queryRules & serverDefaults (normalized OR legacy)
    const queryRuleObjs: string[] = [];
    const serverDefaultLines: string[] = [];
    const requiredQueryNames: string[] = [];

    // Prefer normalized request.query; else legacy flat minus path keys
    let qShape: Record<string, unknown> | null = null;

    if (requestSchema) {
      const rootObj = getObjectShape(requestSchema);
      if (rootObj) {
        if ("query" in rootObj && (rootObj as { query?: unknown }).query) {
          qShape = getObjectShape((rootObj as { query: unknown }).query);
          dbg(
            `   using normalized query shape: keys=${
              qShape ? Object.keys(qShape).sort().join(",") : "(none)"
            }`,
          );
        } else {
          const flat: Record<string, unknown> = { ...rootObj };
          for (const p of requiredPath) delete flat[p];
          qShape = flat;
          dbg(`   using legacy flat shape: keys=${Object.keys(qShape).sort().join(",")}`);
        }
      } else {
        dbg("   requestSchema had no object shape");
      }
    } else {
      dbg("   no requestSchema found");
    }

    if (CLI.dumpShape && qShape) {
      console.log(
        `[shape] ${m.slug} ${m.version}/${m.plan}:`,
        Object.keys(qShape).sort().join(", "),
      );
    }

    if (qShape) {
      const entries = Object.entries(qShape);
      for (let i = 0; i < entries.length; i += 1) {
        const [key, schema] = entries[i];
        const { inner, defaultValue, wasOptional, isArray } = unwrapForDefaultsDeep(schema);
        const optionalish = wasOptional || isOptionalish(schema);
        const metaQ = getQMeta(schema) ?? getQMeta(inner) ?? {};
        const parts: string[] = [`key: "${key}"`];

        if (defaultValue !== undefined) {
          parts.push(`default: ${JSON.stringify(defaultValue)}`);
          serverDefaultLines.push(`  ${key}: ${JSON.stringify(defaultValue)}`);
        } else if (!optionalish) {
          // no default and not optional → required
          parts.push(`required: true`);
          requiredQueryNames.push(`"${key}"`);
        }
        if (metaQ.arrayEncoding) {
          parts.push(`arrayEncoding: "${metaQ.arrayEncoding}"`);
        } else if (isArray) {
          // optional: if you want a hint even without explicit encoding policy
          parts.push(`kind: "array"`);
        }
        if (metaQ.dropWhenDefault === false) {
          parts.push(`dropWhenDefault: false`);
        }

        // one object per line, no trailing comma inside the object
        queryRuleObjs.push(`  { ${parts.join(", ")} }`);
      }
    }

    // Imports
    const srcIndexSpecifier = path
      .relative(path.join(SRC, "registry"), m.file)
      .replace(/\\/g, "/")
      .replace(/\.ts$/, ".js");
    const alias = sanitizeAlias(`${m.slug}_${m.version}_${m.plan}`);

    const importRecord = {
      key: srcIndexSpecifier,
      sortKey: srcIndexSpecifier.replaceAll(".", "~"),
      block: buildWrappedImport(alias, srcIndexSpecifier),
    };

    const method = (meta?.method ?? "GET").toUpperCase();

    const queryRulesBlock = renderArrayConst(queryRuleObjs);
    const requiredQueryBlock = renderArrayConst(requiredQueryNames);
    const serverDefaultsBlock = renderObjectConst(serverDefaultLines);

    // ✅ Push just the OBJECT; we'll wrap everything into an array at the end
    entryBlocks.push(
      [
        `{`,
        `  id: "${m.slug}",`,
        `  validFor: { version: "${m.version}", plan: "${m.plan}" } as const,`,
        `  method: "${method}",`,
        `  pathTemplate: "${pathTemplate}",`,
        `  requiredPath: ${String(JSON.stringify(requiredPath)).replace(/,/g, ", ")} as const,`,
        `  requiredQuery: ${requiredQueryBlock},`,
        `  queryRules: ${queryRulesBlock},`,
        `  serverDefaults: ${serverDefaultsBlock},`,
        `  requestSchema: req_${alias},`,
        `  responseSchema: res_${alias},`,
        `}`,
      ].join("\n"),
    );

    importBlocks.push(importRecord);
  }

  // Build one contiguous, sorted import block
  importBlocks.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const importBlock = [
    // (types-only import removed — we no longer need RegistryEndpoint here)
    ...importBlocks.map((x) => x.block),
  ].join("\n");

  const header = `/* AUTO-GENERATED FILE — DO NOT EDIT\n * Run: pnpm gen:registry\n */`;

  // ✅ Emit a SINGLE as-const array export
  const out =
    `${header}\n` +
    `${importBlock}\n\n` +
    `export const GENERATED_REGISTRY = [\n` +
    `${entryBlocks.join(",\n\n")}\n` +
    `] as const;\n`;

  // format with project config (Prettier picks parser from filepath)
  const prettierConfig = (await prettier.resolveConfig(OUT).catch(() => null)) ?? {};
  const formatted = await prettier.format(out, { ...prettierConfig, filepath: OUT });

  await fs.writeFile(OUT, formatted, "utf8");
  console.log(`Generated ${path.relative(ROOT, OUT)} with ${entryBlocks.length} entries.`);
}

await main().catch((e) => {
  console.error(e);
  process.exit(1);
});
