// src/endpoints/__tests__/_utils/schema.ts
import type { z } from "zod";

/** Zod v4-safe: is a top-level “missing required field” issue */
function isTopLevelMissing(issue: unknown): issue is {
  code: "invalid_type";
  received: "undefined";
  path: [string];
} {
  if (
    typeof issue === "object" &&
    issue !== null &&
    "code" in issue &&
    (issue as { code?: unknown }).code === "invalid_type" &&
    "received" in issue &&
    (issue as { received?: unknown }).received === "undefined" &&
    "path" in issue &&
    Array.isArray((issue as { path?: unknown }).path) &&
    (issue as { path: unknown[] }).path.length === 1 &&
    typeof (issue as { path: unknown[] }).path[0] === "string"
  ) {
    return true;
  }
  return false;
}

/** True if the schema requires *anything* (broad gate to enable/skip tests). */
export function hasRequiredFields(schema: z.ZodTypeAny): boolean {
  const r = schema.safeParse(undefined);
  return !r.success;
}

/** Names of required top-level keys, derived by probing with `{}`. */
export function getRequiredKeysFromSchema(req: z.ZodTypeAny): readonly string[] {
  const r = req.safeParse({});
  if (r.success) return [];
  const out = new Set<string>();
  for (const issue of r.error.issues) {
    if (isTopLevelMissing(issue)) out.add(issue.path[0]);
  }
  return Array.from(out);
}
