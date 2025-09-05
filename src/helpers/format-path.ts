/**
 * @file src/helpers/format-path.ts
 * @module helpers/format-path
 * @summary Format Path.
 */
export type PathParams = Readonly<Record<string, string | number>>;

export function formatPath(template: string, params: PathParams = {}): string {
  return template
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean)
    .map((seg) => {
      const m = seg.match(/^\{(.+?)\}$/);
      if (!m) return encodeURIComponent(seg);
      const key = m[1];
      const raw = params[key];
      if (raw === undefined || raw === null) {
        throw new Error(`Missing path param: ${key}`);
      }
      return encodeURIComponent(String(raw));
    })
    .join("/");
}
