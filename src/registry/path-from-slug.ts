// src/registry/path-from-slug.ts
export type PathFromSlug = Readonly<{
  template: string; // e.g. "/coins/{id}/history"
  requiredParams: ReadonlyArray<string>; // e.g. ["id"]
}>;

/** Build a URL path template from a slug using dot + `by-<param>` rules. */
export function pathTemplateFromSlug(slug: string): PathFromSlug {
  const parts = slug.split(".");
  const segments: string[] = [];
  const params: string[] = [];

  for (const p of parts) {
    if (p.startsWith("by-")) {
      const name = p.slice(3);
      if (name.length === 0) throw new Error(`Invalid slug segment "${p}" in "${slug}"`);
      params.push(name);
      segments.push(`{${name}}`);
    } else {
      segments.push(p);
    }
  }
  return { template: `/${segments.join("/")}`, requiredParams: params };
}
