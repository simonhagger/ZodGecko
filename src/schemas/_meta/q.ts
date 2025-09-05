/**
 * @file src/schemas/_meta/q.ts
 * @module schemas/_meta/q
 * @summary Q.
 */
import type { z } from "zod";

export type ArrayEncoding = "csv"; // extensible later

type QMeta = Readonly<{
  arrayEncoding?: ArrayEncoding;
  dropWhenDefault?: boolean; // default true
}>;

const QMETA = Symbol.for("zodgecko.qmeta");

export function getQMeta(schema: unknown): QMeta | null {
  return (schema && (schema as { [QMETA]?: QMeta })[QMETA]) ?? null;
}

function withMeta<T extends z.ZodTypeAny>(schema: T, meta: QMeta): T {
  (schema as unknown as { [QMETA]: QMeta })[QMETA] = meta;
  return schema;
}

/** Mark an array query param to be CSV-encoded; dropWhenDefault defaults to true. */
export function qCsv<T extends z.ZodArray<z.ZodTypeAny>>(
  schema: T,
  opts?: { dropWhenDefault?: boolean },
): T {
  return withMeta(schema, { arrayEncoding: "csv", dropWhenDefault: opts?.dropWhenDefault });
}

/** Mark a scalar param to *not* be dropped when it equals its default. */
export function qKeep<T extends z.ZodTypeAny>(schema: T): T {
  return withMeta(schema, { dropWhenDefault: false });
}
