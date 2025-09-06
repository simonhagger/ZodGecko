/**
 * @file src/testkit/slug.ts
 * @module testkit/slug
 * @summary Slug.
 */
// -----------------------------------------------------------------------------
// file: src/testkit/slug.ts
// -----------------------------------------------------------------------------

/**
 * Convert an unversioned API path template to our repo slug (dot + by-).
 * @param template (required: string)
 * @returns string
 */
export function slugFromPathTemplate(template: string): string {
  return template
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean)
    .map((seg) => {
      const m = seg.match(/^\{(.+?)\}$/);
      return m ? `by-${m[1]}` : seg; // keep underscores as-is
    })
    .join(".");
}
