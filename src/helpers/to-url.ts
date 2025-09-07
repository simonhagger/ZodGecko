/**
 * @file src/helpers/to-url.ts
 * @module helpers/to-url
 * @summary To Url.
 */
/**
 * Function toURL.
 * @param base (required: string)
 * @param path (required: string)
 * @param query (optional: object) [default={}]
 * @returns string
 */
export function toURL(
  base: string,
  path: string,
  query: Readonly<Record<string, string>> = {},
): string {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  const qs = new URLSearchParams(query).toString();
  return qs ? `${cleanBase}/${cleanPath}?${qs}` : `${cleanBase}/${cleanPath}`;
}
