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
