function getBaseUrl(): string {
  return import.meta.env.BASE_URL ?? "/";
}

/** Remove Astro `base` prefix from a pathname (for i18n locale URL helpers). */
export function stripBase(pathname: string): string {
  const base = getBaseUrl();
  if (base === "/") return pathname;

  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  if (pathname === normalizedBase || pathname === `${normalizedBase}/`) {
    return "/";
  }

  if (pathname.startsWith(`${normalizedBase}/`)) {
    return pathname.slice(normalizedBase.length) || "/";
  }

  return pathname;
}

export function withBase(path: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }

  const base = getBaseUrl();
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, "");

  return `${normalizedBase}${normalizedPath}`;
}
