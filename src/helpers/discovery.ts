/**
 * src/helpers/discovery.ts
 * ---------------------------------------------------------------------------
 * Node-only helpers for discovering schema modules under `src/schemas`.
 * Extracted from the registry generator so other tooling (tests, CLIs) can
 * reuse a single, deterministic discovery implementation.
  * @file src/helpers/discovery.ts
  * @module helpers/discovery
  * @summary Discovery.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";

import { SLUG_RE, PLANS, VERSIONS, VERSION_TO_PLAN } from "../helpers/constants.js";
import type { ApiVersion, DiscoverOptions, DiscoveredModule } from "../types.js";

const defaultAccess = async (p: string): Promise<boolean> => {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
};

const VERSION_SET = new Set(VERSIONS as readonly string[]);
const PLAN_SET = new Set(PLANS as readonly string[]);
const SCHEMA_ENTRY = "index.ts" as const;
const ACCESS_CONCURRENCY = 8 as const;

// Narrowing guard for optional fsAccess implementation
const isAccessFn = (fn: unknown): fn is (p: string) => Promise<boolean> => typeof fn === "function";

/**
 * Discover all schema variants present on disk.
 *
 * Scans: `${schemasDir}/{slug}/{version}/{plan}/index.ts`
 * - `slug` must match {@link SLUG_RE}
 * - `version` must be one of {@link VERSIONS}
 * - `plan` is derived from {@link VERSION_TO_PLAN}
 */
export async function discoverSchemaModules({
  schemasDir,
  only = null,
  fsAccess,
}: DiscoverOptions): Promise<DiscoveredModule[]> {
  if (typeof schemasDir !== "string") {
    throw new TypeError("discoverSchemaModules: `schemasDir` must be a string");
  }

  let onlySet: ReadonlySet<string> | null = null;
  if (only instanceof Set) {
    onlySet = only;
  } else if (Array.isArray(only)) {
    onlySet = new Set<string>(only);
  }

  let checkAccess: (p: string) => Promise<boolean> = defaultAccess;
  if (isAccessFn(fsAccess)) {
    const f = fsAccess;
    checkAccess = (p: string) => f(p);
  }

  const out: DiscoveredModule[] = [];
  const slugs = (await fs.readdir(schemasDir)).filter((d) => !d.startsWith("_")).sort();

  for (const slug of slugs) {
    if (onlySet && !onlySet.has(slug)) continue;
    if (!SLUG_RE.test(slug)) throw new Error(`Invalid slug folder name: ${slug}`);

    const slugDir = path.join(schemasDir, slug);
    const versions = (await fs.readdir(slugDir)).sort();
    const candidates: DiscoveredModule[] = [];

    for (const v of versions) {
      if (!VERSION_SET.has(v)) continue;
      const version = v as ApiVersion;

      const plan = VERSION_TO_PLAN[version];
      if (!PLAN_SET.has(plan)) continue;

      const file = path.join(slugDir, version, plan, SCHEMA_ENTRY);
      candidates.push({ slug, version, plan, file });
    }
    // Check existence with small-batch concurrency
    for (let i = 0; i < candidates.length; i += ACCESS_CONCURRENCY) {
      const batch = candidates.slice(i, i + ACCESS_CONCURRENCY);
      const hits = await Promise.all(batch.map((c) => checkAccess(c.file)));
      for (let j = 0; j < batch.length; j += 1) if (hits[j]) out.push(batch[j]);
    }
  }

  // Deterministic order
  const cmpDiscovered = (a: DiscoveredModule, b: DiscoveredModule): number => {
    if (a.slug !== b.slug) return a.slug.localeCompare(b.slug);
    if (a.version !== b.version) return a.version.localeCompare(b.version);
    return a.plan.localeCompare(b.plan);
  };
  out.sort(cmpDiscovered);

  // Duplicate guard
  const seen = new Set<string>();
  for (const { slug, version, plan } of out) {
    const key = `${slug}__${version}__${plan}`;
    if (seen.has(key)) throw new Error(`Duplicate schema variant: ${key}`);
    seen.add(key);
  }

  return out;
}
